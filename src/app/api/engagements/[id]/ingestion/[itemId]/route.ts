// ════════════════════════════════════════════════════════════════════════════
// Individual Ingestion Item API
// GET /api/engagements/[id]/ingestion/[itemId] - Get item
// PATCH /api/engagements/[id]/ingestion/[itemId] - Update status (approve/reject)
// DELETE /api/engagements/[id]/ingestion/[itemId] - Delete item
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";

type Params = {
  params: Promise<{ id: string; itemId: string }>;
};

// GET: Get single item
export async function GET(request: NextRequest, { params }: Params) {
  const { id: engagementId, itemId } = await params;

  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { supabase } = auth.context;

  const { data, error } = await supabase
    .from("ingestion_queue")
    .select("*")
    .eq("id", itemId)
    .eq("engagement_id", engagementId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json({
    item: {
      id: data.id,
      sourceType: data.source_type,
      sourceId: data.source_id,
      sourceData: data.source_data || {},
      suggestedRoom: data.suggested_room,
      suggestedBlock: data.suggested_block,
      summary: data.summary,
      status: data.status,
      processedAt: data.processed_at,
      processedBy: data.processed_by,
      createdAt: data.created_at,
    },
  });
}

// PATCH: Update item (approve/reject)
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id: engagementId, itemId } = await params;

  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { user, supabase } = auth.context;

  let body: {
    status?: "approved" | "rejected";
    suggestedRoom?: string;
    suggestedBlock?: Record<string, unknown>;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { status, suggestedRoom, suggestedBlock } = body;

  // Get the item first
  const { data: item, error: fetchError } = await supabase
    .from("ingestion_queue")
    .select("*")
    .eq("id", itemId)
    .eq("engagement_id", engagementId)
    .single();

  if (fetchError || !item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  // Build update
  const updates: Record<string, unknown> = {};

  if (status) {
    updates.status = status;
    updates.processed_at = new Date().toISOString();
    updates.processed_by = user.id;
  }

  if (suggestedRoom !== undefined) updates.suggested_room = suggestedRoom;
  if (suggestedBlock !== undefined) updates.suggested_block = suggestedBlock;

  const { data, error } = await supabase
    .from("ingestion_queue")
    .update(updates)
    .eq("id", itemId)
    .eq("engagement_id", engagementId)
    .select()
    .single();

  if (error) {
    console.error("Failed to update item:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }

  // If approved, create the block
  if (status === "approved" && item.suggested_block) {
    const roomKey = suggestedRoom || item.suggested_room || "meetings";

    // Get the room
    const { data: room } = await supabase
      .from("engagement_rooms")
      .select("id")
      .eq("engagement_id", engagementId)
      .eq("key", roomKey)
      .single();

    if (room) {
      // Get next order index
      const { data: lastBlock } = await supabase
        .from("engagement_blocks")
        .select("order_index")
        .eq("room_id", room.id)
        .order("order_index", { ascending: false })
        .limit(1)
        .single();

      const block = item.suggested_block as { type?: string; content?: string };

      // Create the block
      await supabase.from("engagement_blocks").insert({
        room_id: room.id,
        block_type: block.type || "text",
        content: block.content || item.summary || "",
        metadata: {
          source: item.source_type,
          sourceId: item.source_id,
          ingestedAt: new Date().toISOString(),
        },
        order_index: (lastBlock?.order_index ?? -1) + 1,
      });

      // Log event
      await supabase.rpc("insert_engagement_event", {
        p_engagement_id: engagementId,
        p_event_type: "block_ingested",
        p_payload: {
          roomKey,
          sourceType: item.source_type,
          sourceId: item.source_id,
        },
        p_actor_id: user.id,
        p_actor_type: "user",
      });
    }
  }

  return NextResponse.json({
    item: {
      id: data.id,
      status: data.status,
      processedAt: data.processed_at,
    },
  });
}

// DELETE: Remove item from queue
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id: engagementId, itemId } = await params;

  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { supabase } = auth.context;

  const { error } = await supabase
    .from("ingestion_queue")
    .delete()
    .eq("id", itemId)
    .eq("engagement_id", engagementId);

  if (error) {
    console.error("Failed to delete item:", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
