import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";

type Params = {
  params: Promise<{ id: string; roomKey: string }>;
};

// GET /api/engagements/[id]/rooms/[roomKey] - Get room with blocks
export async function GET(request: NextRequest, { params }: Params) {
  const { id, roomKey } = await params;
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { supabase } = auth.context;

  try {
    // Fetch room by engagement_id and key
    const { data: room, error: roomError } = await supabase
      .from("engagement_rooms")
      .select("*")
      .eq("engagement_id", id)
      .eq("key", roomKey)
      .single();

    if (roomError || !room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    // Fetch blocks for this room
    const { data: blocks } = await supabase
      .from("engagement_blocks")
      .select("*")
      .eq("room_id", room.id)
      .order("order_index", { ascending: true });

    // Transform to camelCase
    const transformedBlocks = (blocks ?? []).map((block) => ({
      id: block.id,
      roomId: block.room_id,
      blockType: block.block_type,
      content: block.content,
      storagePath: block.storage_path,
      caption: block.caption,
      metadata: block.metadata,
      orderIndex: block.order_index,
      createdBy: block.created_by,
      createdAt: block.created_at,
      updatedAt: block.updated_at,
    }));

    return NextResponse.json({
      room: {
        id: room.id,
        engagementId: room.engagement_id,
        key: room.key,
        label: room.label,
        type: room.room_type,
        visibility: room.visibility,
        prompt: room.prompt,
        required: room.required,
        orderIndex: room.order_index,
        blocks: transformedBlocks,
        createdAt: room.created_at,
        updatedAt: room.updated_at,
      },
    });
  } catch (error) {
    console.error("Room fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/engagements/[id]/rooms/[roomKey] - Update room
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id, roomKey } = await params;
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { user, supabase } = auth.context;

  try {
    const body = await request.json();
    const { label, visibility, prompt } = body;

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

    const updates: Record<string, unknown> = {};
    if (label !== undefined) updates.label = label;
    if (visibility !== undefined) updates.visibility = visibility;
    if (prompt !== undefined) updates.prompt = prompt;

    const { data, error } = await supabase
      .from("engagement_rooms")
      .update(updates)
      .eq("id", room.id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update room:", error);
      return NextResponse.json(
        { error: "Failed to update room" },
        { status: 500 }
      );
    }

    // Record event
    await supabase.rpc("insert_engagement_event", {
      p_engagement_id: id,
      p_event_type: "room_updated",
      p_payload: { roomKey, ...updates },
      p_actor_id: user.id,
      p_actor_type: "user",
    });

    return NextResponse.json({
      room: {
        id: data.id,
        engagementId: data.engagement_id,
        key: data.key,
        label: data.label,
        type: data.room_type,
        visibility: data.visibility,
        prompt: data.prompt,
        required: data.required,
        orderIndex: data.order_index,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  } catch (error) {
    console.error("Room update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
