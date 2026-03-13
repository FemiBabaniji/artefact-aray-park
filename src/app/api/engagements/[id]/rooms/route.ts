import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";

type Params = {
  params: Promise<{ id: string }>;
};

// GET /api/engagements/[id]/rooms - List all rooms with blocks
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { supabase } = auth.context;

  try {
    // Verify engagement exists
    const { data: engagement, error: engagementError } = await supabase
      .from("engagements")
      .select("id")
      .eq("id", id)
      .single();

    if (engagementError || !engagement) {
      return NextResponse.json(
        { error: "Engagement not found" },
        { status: 404 }
      );
    }

    // Fetch rooms
    const { data: rooms, error: roomsError } = await supabase
      .from("engagement_rooms")
      .select("*")
      .eq("engagement_id", id)
      .order("order_index", { ascending: true });

    if (roomsError) {
      console.error("Failed to fetch rooms:", roomsError);
      return NextResponse.json(
        { error: "Failed to fetch rooms" },
        { status: 500 }
      );
    }

    // Fetch blocks for all rooms
    const roomIds = rooms?.map((r) => r.id) ?? [];
    let blocks: Record<string, unknown[]> = {};

    if (roomIds.length > 0) {
      const { data: allBlocks } = await supabase
        .from("engagement_blocks")
        .select("*")
        .in("room_id", roomIds)
        .order("order_index", { ascending: true });

      // Group blocks by room
      blocks = (allBlocks ?? []).reduce((acc, block) => {
        if (!acc[block.room_id]) acc[block.room_id] = [];
        acc[block.room_id].push({
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
          featured: block.featured ?? false,
          maskAnnotations: block.mask_annotations ?? [],
        });
        return acc;
      }, {} as Record<string, unknown[]>);
    }

    // Transform rooms with blocks
    const roomsWithBlocks = (rooms ?? []).map((room) => ({
      id: room.id,
      engagementId: room.engagement_id,
      key: room.key,
      label: room.label,
      type: room.room_type,
      visibility: room.visibility,
      prompt: room.prompt,
      required: room.required,
      orderIndex: room.order_index,
      blocks: blocks[room.id] ?? [],
      createdAt: room.created_at,
      updatedAt: room.updated_at,
    }));

    return NextResponse.json({ rooms: roomsWithBlocks });
  } catch (error) {
    console.error("Rooms fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
