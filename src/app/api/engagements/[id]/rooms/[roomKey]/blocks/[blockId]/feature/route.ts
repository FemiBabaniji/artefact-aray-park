// ============================================================================
// Feature Block API
// POST /api/engagements/[id]/rooms/[roomKey]/blocks/[blockId]/feature
// Toggle featured status - only one featured block per room
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";

type Params = {
  params: Promise<{ id: string; roomKey: string; blockId: string }>;
};

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { supabase, user } = auth.context;
  const userId = user.id;

  const { id: engagementId, roomKey, blockId } = await params;

  // Verify engagement ownership
  const { data: engagement, error: engErr } = await supabase
    .from("engagements")
    .select("id, owner_id")
    .eq("id", engagementId)
    .single();

  if (engErr || !engagement) {
    return NextResponse.json({ error: "Engagement not found" }, { status: 404 });
  }

  if (engagement.owner_id !== userId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Get the room
  const { data: room, error: roomErr } = await supabase
    .from("engagement_rooms")
    .select("id")
    .eq("engagement_id", engagementId)
    .eq("key", roomKey)
    .single();

  if (roomErr || !room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  // Get the block and verify it belongs to this room
  const { data: block, error: blockErr } = await supabase
    .from("engagement_blocks")
    .select("id, featured, room_id")
    .eq("id", blockId)
    .eq("room_id", room.id)
    .single();

  if (blockErr || !block) {
    return NextResponse.json({ error: "Block not found" }, { status: 404 });
  }

  // Toggle featured status
  const newFeatured = !block.featured;
  let previousFeaturedBlockId: string | null = null;

  // If featuring this block, unfeature any other featured block in the same room
  if (newFeatured) {
    const { data: currentFeatured } = await supabase
      .from("engagement_blocks")
      .select("id")
      .eq("room_id", room.id)
      .eq("featured", true)
      .neq("id", blockId)
      .single();

    if (currentFeatured) {
      previousFeaturedBlockId = currentFeatured.id;
      await supabase
        .from("engagement_blocks")
        .update({ featured: false, updated_at: new Date().toISOString(), updated_by: userId })
        .eq("id", currentFeatured.id);
    }
  }

  // Update this block's featured status
  const { error: updateErr } = await supabase
    .from("engagement_blocks")
    .update({
      featured: newFeatured,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq("id", blockId);

  if (updateErr) {
    return NextResponse.json(
      { error: "Failed to update block" },
      { status: 500 }
    );
  }

  // Log event
  try {
    await supabase.rpc("insert_engagement_event", {
      p_engagement_id: engagementId,
      p_event_type: newFeatured ? "block_featured" : "block_unfeatured",
      p_payload: {
        blockId,
        roomId: room.id,
        roomKey,
        previousFeaturedBlockId,
      },
      p_actor_id: userId,
      p_actor_type: "user",
    });
  } catch (e) {
    console.error("Failed to log feature event:", e);
  }

  return NextResponse.json({
    success: true,
    featured: newFeatured,
    previousFeaturedBlockId,
  });
}
