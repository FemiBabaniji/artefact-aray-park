import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";

type Params = {
  params: Promise<{ id: string; roomKey: string; blockId: string }>;
};

// PATCH /api/engagements/[id]/rooms/[roomKey]/blocks/[blockId] - Update block
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id, roomKey, blockId } = await params;
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { user, supabase } = auth.context;

  try {
    const body = await request.json();
    const { content, caption, metadata, version } = body;

    // Version is required for optimistic locking
    if (version === undefined) {
      return NextResponse.json(
        { error: "version is required for updates" },
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
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    // Fetch current block state
    const { data: existingBlock } = await supabase
      .from("engagement_blocks")
      .select("*")
      .eq("id", blockId)
      .eq("room_id", room.id)
      .single();

    if (!existingBlock) {
      return NextResponse.json(
        { error: "Block not found" },
        { status: 404 }
      );
    }

    // Optimistic locking: check version matches
    if (existingBlock.version !== version) {
      return NextResponse.json(
        {
          error: "conflict",
          message: "Block was modified by another user",
          currentVersion: existingBlock.version,
          currentContent: existingBlock.content,
          updatedBy: existingBlock.updated_by_type,
          updatedAt: existingBlock.updated_at,
        },
        { status: 409 }
      );
    }

    // Build updates
    const updates: Record<string, unknown> = {
      updated_by: user.id,
      updated_by_type: "user",
    };
    if (content !== undefined) updates.content = content;
    if (caption !== undefined) updates.caption = caption;
    if (metadata !== undefined) updates.metadata = metadata;

    // Update with version check (double-check for race)
    const { data: block, error } = await supabase
      .from("engagement_blocks")
      .update(updates)
      .eq("id", blockId)
      .eq("version", version) // Only update if version still matches
      .select()
      .single();

    if (error || !block) {
      // Version changed between check and update
      const { data: current } = await supabase
        .from("engagement_blocks")
        .select("*")
        .eq("id", blockId)
        .single();

      return NextResponse.json(
        {
          error: "conflict",
          message: "Block was modified by another user",
          currentVersion: current?.version,
          currentContent: current?.content,
          updatedBy: current?.updated_by_type,
          updatedAt: current?.updated_at,
        },
        { status: 409 }
      );
    }

    // Record event using atomic function
    await supabase.rpc("insert_engagement_event", {
      p_engagement_id: id,
      p_event_type: "block_updated",
      p_payload: {
        roomKey,
        blockId,
        updates: Object.keys(updates).filter(k => !k.startsWith("updated_")),
        fromVersion: version,
        toVersion: block.version,
      },
      p_actor_id: user.id,
      p_actor_type: "user",
    });

    return NextResponse.json({
      block: {
        id: block.id,
        roomId: block.room_id,
        blockType: block.block_type,
        content: block.content,
        storagePath: block.storage_path,
        caption: block.caption,
        metadata: block.metadata,
        orderIndex: block.order_index,
        version: block.version,
        createdBy: block.created_by,
        createdAt: block.created_at,
        updatedAt: block.updated_at,
        updatedBy: block.updated_by,
        updatedByType: block.updated_by_type,
      },
    });
  } catch (error) {
    console.error("Block update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/engagements/[id]/rooms/[roomKey]/blocks/[blockId] - Delete block
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id, roomKey, blockId } = await params;
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { user, supabase } = auth.context;

  try {
    const body = await request.json().catch(() => ({}));
    const { version } = body;

    // Verify room exists
    const { data: room } = await supabase
      .from("engagement_rooms")
      .select("id")
      .eq("engagement_id", id)
      .eq("key", roomKey)
      .single();

    if (!room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    // Fetch current block
    const { data: existingBlock } = await supabase
      .from("engagement_blocks")
      .select("*")
      .eq("id", blockId)
      .eq("room_id", room.id)
      .single();

    if (!existingBlock) {
      return NextResponse.json(
        { error: "Block not found" },
        { status: 404 }
      );
    }

    // Optimistic locking for delete (if version provided)
    if (version !== undefined && existingBlock.version !== version) {
      return NextResponse.json(
        {
          error: "conflict",
          message: "Block was modified since you loaded it",
          currentVersion: existingBlock.version,
          currentContent: existingBlock.content,
          updatedBy: existingBlock.updated_by_type,
          updatedAt: existingBlock.updated_at,
        },
        { status: 409 }
      );
    }

    // Delete block
    const { error } = await supabase
      .from("engagement_blocks")
      .delete()
      .eq("id", blockId);

    if (error) {
      console.error("Failed to delete block:", error);
      return NextResponse.json(
        { error: "Failed to delete block" },
        { status: 500 }
      );
    }

    // Record event using atomic function
    await supabase.rpc("insert_engagement_event", {
      p_engagement_id: id,
      p_event_type: "block_removed",
      p_payload: {
        roomKey,
        blockId,
        blockType: existingBlock.block_type,
        deletedVersion: existingBlock.version,
      },
      p_actor_id: user.id,
      p_actor_type: "user",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Block delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/engagements/[id]/rooms/[roomKey]/blocks/[blockId] - Get single block
export async function GET(request: NextRequest, { params }: Params) {
  const { id, roomKey, blockId } = await params;
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { supabase } = auth.context;

  try {
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

    // Fetch block
    const { data: block, error } = await supabase
      .from("engagement_blocks")
      .select("*")
      .eq("id", blockId)
      .eq("room_id", room.id)
      .single();

    if (error || !block) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }

    return NextResponse.json({
      block: {
        id: block.id,
        roomId: block.room_id,
        blockType: block.block_type,
        content: block.content,
        storagePath: block.storage_path,
        caption: block.caption,
        metadata: block.metadata,
        orderIndex: block.order_index,
        version: block.version,
        createdBy: block.created_by,
        createdAt: block.created_at,
        updatedAt: block.updated_at,
        updatedBy: block.updated_by,
        updatedByType: block.updated_by_type,
      },
    });
  } catch (error) {
    console.error("Block fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
