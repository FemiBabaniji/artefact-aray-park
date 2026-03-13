// ============================================================================
// Mask Annotations API
// PATCH /api/engagements/[id]/rooms/[roomKey]/blocks/[blockId]/masks
// Add or remove mask annotations on a block
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import type { MaskAnnotation } from "@/types/render";

type Params = {
  params: Promise<{ id: string; roomKey: string; blockId: string }>;
};

export async function PATCH(request: NextRequest, { params }: Params) {
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

  // Get the block
  const { data: block, error: blockErr } = await supabase
    .from("engagement_blocks")
    .select("id, mask_annotations, content")
    .eq("id", blockId)
    .eq("room_id", room.id)
    .single();

  if (blockErr || !block) {
    return NextResponse.json({ error: "Block not found" }, { status: 404 });
  }

  const body = await request.json();
  const { action, annotation } = body as {
    action: "add" | "remove" | "clear";
    annotation?: MaskAnnotation;
  };

  const currentAnnotations = (block.mask_annotations || []) as MaskAnnotation[];
  let newAnnotations: MaskAnnotation[];

  switch (action) {
    case "add":
      if (!annotation) {
        return NextResponse.json({ error: "Annotation required for add" }, { status: 400 });
      }
      // Validate annotation bounds
      if (
        annotation.start < 0 ||
        annotation.end > (block.content?.length || 0) ||
        annotation.start >= annotation.end
      ) {
        return NextResponse.json({ error: "Invalid annotation bounds" }, { status: 400 });
      }
      // Check for overlapping annotations
      const overlaps = currentAnnotations.some(
        (a) =>
          (annotation.start >= a.start && annotation.start < a.end) ||
          (annotation.end > a.start && annotation.end <= a.end) ||
          (annotation.start <= a.start && annotation.end >= a.end)
      );
      if (overlaps) {
        return NextResponse.json({ error: "Annotation overlaps existing" }, { status: 400 });
      }
      newAnnotations = [...currentAnnotations, annotation];
      break;

    case "remove":
      if (!annotation) {
        return NextResponse.json({ error: "Annotation required for remove" }, { status: 400 });
      }
      newAnnotations = currentAnnotations.filter(
        (a) => !(a.start === annotation.start && a.end === annotation.end)
      );
      break;

    case "clear":
      newAnnotations = [];
      break;

    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  // Update block
  const { error: updateErr } = await supabase
    .from("engagement_blocks")
    .update({
      mask_annotations: newAnnotations,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq("id", blockId);

  if (updateErr) {
    return NextResponse.json(
      { error: "Failed to update masks" },
      { status: 500 }
    );
  }

  // Log event
  try {
    await supabase.rpc("insert_engagement_event", {
      p_engagement_id: engagementId,
      p_event_type: action === "add" ? "mask_annotation_added" : action === "remove" ? "mask_annotation_removed" : "mask_annotations_cleared",
      p_payload: {
        blockId,
        roomKey,
        annotation: annotation || null,
        totalAnnotations: newAnnotations.length,
      },
      p_actor_id: userId,
      p_actor_type: "user",
    });
  } catch (e) {
    console.error("Failed to log mask event:", e);
  }

  return NextResponse.json({
    success: true,
    maskAnnotations: newAnnotations,
  });
}

// GET current mask annotations
export async function GET(request: NextRequest, { params }: Params) {
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

  // Get block with annotations
  const { data: block, error: blockErr } = await supabase
    .from("engagement_blocks")
    .select("id, content, mask_annotations")
    .eq("id", blockId)
    .eq("room_id", room.id)
    .single();

  if (blockErr || !block) {
    return NextResponse.json({ error: "Block not found" }, { status: 404 });
  }

  return NextResponse.json({
    blockId: block.id,
    content: block.content,
    maskAnnotations: block.mask_annotations || [],
  });
}
