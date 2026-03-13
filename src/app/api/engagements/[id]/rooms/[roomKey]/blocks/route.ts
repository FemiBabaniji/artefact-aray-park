import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";

type Params = {
  params: Promise<{ id: string; roomKey: string }>;
};

// Valid block types (matches DB constraint)
const VALID_BLOCK_TYPES = [
  "text",
  "decision",
  "file",
  "outcome",
  "transcript",
  "channel_message",
  "note",
  "summary",
] as const;

type BlockType = (typeof VALID_BLOCK_TYPES)[number];

function isValidBlockType(type: string): type is BlockType {
  return VALID_BLOCK_TYPES.includes(type as BlockType);
}

// POST /api/engagements/[id]/rooms/[roomKey]/blocks - Add block to room
export async function POST(request: NextRequest, { params }: Params) {
  const { id, roomKey } = await params;
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { user, supabase } = auth.context;

  try {
    const body = await request.json();
    const { blockType, content, storagePath, caption, metadata } = body;

    // Validate block type
    if (!blockType) {
      return NextResponse.json(
        { error: "blockType is required" },
        { status: 400 }
      );
    }

    if (!isValidBlockType(blockType)) {
      return NextResponse.json(
        {
          error: "Invalid blockType",
          validTypes: VALID_BLOCK_TYPES,
        },
        { status: 400 }
      );
    }

    // Fetch room
    const { data: room, error: roomError } = await supabase
      .from("engagement_rooms")
      .select("id")
      .eq("engagement_id", id)
      .eq("key", roomKey)
      .single();

    if (roomError || !room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    // Get next order_index atomically using FOR UPDATE
    const { data: orderData } = await supabase.rpc("get_next_block_order", {
      p_room_id: room.id,
    });

    // Fallback if RPC doesn't exist yet
    let nextOrderIndex = orderData;
    if (nextOrderIndex === null || nextOrderIndex === undefined) {
      const { data: lastBlock } = await supabase
        .from("engagement_blocks")
        .select("order_index")
        .eq("room_id", room.id)
        .order("order_index", { ascending: false })
        .limit(1)
        .single();
      nextOrderIndex = (lastBlock?.order_index ?? -1) + 1;
    }

    // Create block
    const { data: block, error: blockError } = await supabase
      .from("engagement_blocks")
      .insert({
        room_id: room.id,
        block_type: blockType,
        content: content ?? null,
        storage_path: storagePath ?? null,
        caption: caption ?? null,
        metadata: metadata ?? null,
        order_index: nextOrderIndex,
        created_by: user.id,
        updated_by: user.id,
        updated_by_type: "user",
      })
      .select()
      .single();

    if (blockError) {
      console.error("Failed to create block:", blockError);
      return NextResponse.json(
        { error: "Failed to create block", details: blockError.message },
        { status: 500 }
      );
    }

    // Record event using atomic sequence function
    await supabase.rpc("insert_engagement_event", {
      p_engagement_id: id,
      p_event_type: "block_added",
      p_payload: {
        roomKey,
        blockId: block.id,
        blockType,
        content: content?.substring?.(0, 100) ?? null,
      },
      p_actor_id: user.id,
      p_actor_type: "user",
    });

    return NextResponse.json(
      {
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
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Block creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/engagements/[id]/rooms/[roomKey]/blocks - List blocks in room
export async function GET(request: NextRequest, { params }: Params) {
  const { id, roomKey } = await params;
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { supabase } = auth.context;

  try {
    // Fetch room
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

    // Fetch blocks
    const { data: blocks, error } = await supabase
      .from("engagement_blocks")
      .select("*")
      .eq("room_id", room.id)
      .order("order_index", { ascending: true });

    if (error) {
      console.error("Failed to fetch blocks:", error);
      return NextResponse.json(
        { error: "Failed to fetch blocks" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      blocks: (blocks ?? []).map((block) => ({
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
      })),
    });
  } catch (error) {
    console.error("Blocks fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
