import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";

type Params = {
  params: Promise<{ id: string; roomKey: string; blockId: string }>;
};

// POST /api/engagements/[id]/rooms/[roomKey]/blocks/[blockId]/restore - Restore block to previous version
export async function POST(request: NextRequest, { params }: Params) {
  const { id, roomKey, blockId } = await params;
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { user, supabase } = auth.context;

  try {
    const body = await request.json();
    const { targetVersion, currentVersion } = body;

    if (targetVersion === undefined) {
      return NextResponse.json(
        { error: "targetVersion is required" },
        { status: 400 }
      );
    }

    if (currentVersion === undefined) {
      return NextResponse.json(
        { error: "currentVersion is required for optimistic locking" },
        { status: 400 }
      );
    }

    // Verify room exists
    const { data: room } = await supabase
      .from("engagement_rooms")
      .select("id")
      .eq("engagement_id", id)
      .eq("key", roomKey)
      .single();

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Get current block
    const { data: currentBlock } = await supabase
      .from("engagement_blocks")
      .select("*")
      .eq("id", blockId)
      .eq("room_id", room.id)
      .single();

    if (!currentBlock) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }

    // Optimistic locking check
    if (currentBlock.version !== currentVersion) {
      return NextResponse.json(
        {
          error: "conflict",
          message: "Block was modified by another user",
          currentVersion: currentBlock.version,
          currentContent: currentBlock.content,
          updatedBy: currentBlock.updated_by_type,
          updatedAt: currentBlock.updated_at,
        },
        { status: 409 }
      );
    }

    // Get the target version
    const { data: targetVersionData } = await supabase
      .from("engagement_block_versions")
      .select("*")
      .eq("block_id", blockId)
      .eq("version", targetVersion)
      .single();

    if (!targetVersionData) {
      return NextResponse.json(
        { error: `Version ${targetVersion} not found in history` },
        { status: 404 }
      );
    }

    // Restore by updating with old content (triggers version archive)
    const { data: restoredBlock, error: updateError } = await supabase
      .from("engagement_blocks")
      .update({
        content: targetVersionData.content,
        metadata: targetVersionData.metadata,
        updated_by: user.id,
        updated_by_type: "user",
      })
      .eq("id", blockId)
      .eq("version", currentVersion) // Double-check version
      .select()
      .single();

    if (updateError || !restoredBlock) {
      // Version changed during restore
      const { data: current } = await supabase
        .from("engagement_blocks")
        .select("*")
        .eq("id", blockId)
        .single();

      return NextResponse.json(
        {
          error: "conflict",
          message: "Block was modified during restore",
          currentVersion: current?.version,
        },
        { status: 409 }
      );
    }

    // Log event
    await supabase.rpc("insert_engagement_event", {
      p_engagement_id: id,
      p_event_type: "block_restored",
      p_payload: {
        roomKey,
        blockId,
        fromVersion: currentVersion,
        toVersion: restoredBlock.version,
        restoredFromVersion: targetVersion,
      },
      p_actor_id: user.id,
      p_actor_type: "user",
    });

    return NextResponse.json({
      block: {
        id: restoredBlock.id,
        roomId: restoredBlock.room_id,
        blockType: restoredBlock.block_type,
        content: restoredBlock.content,
        metadata: restoredBlock.metadata,
        version: restoredBlock.version,
        createdAt: restoredBlock.created_at,
        updatedAt: restoredBlock.updated_at,
      },
      restoredFrom: targetVersion,
    });
  } catch (error) {
    console.error("Block restore error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
