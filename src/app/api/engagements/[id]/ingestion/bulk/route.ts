// ════════════════════════════════════════════════════════════════════════════
// Bulk Ingestion Actions API
// POST /api/engagements/[id]/ingestion/bulk
// Process multiple ingestion queue items at once
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: Params) {
  const { id: engagementId } = await params;

  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { user, supabase } = auth.context;

  let body: {
    itemIds: string[];
    action: "approve" | "reject";
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { itemIds, action } = body;

  if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
    return NextResponse.json({ error: "itemIds array is required" }, { status: 400 });
  }

  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
  }

  const status = action === "approve" ? "approved" : "rejected";
  const processedAt = new Date().toISOString();

  const results: { id: string; success: boolean; error?: string }[] = [];

  // Process in batches of 10
  const batchSize = 10;
  for (let i = 0; i < itemIds.length; i += batchSize) {
    const batch = itemIds.slice(i, i + batchSize);

    // Update batch
    const { data: updatedItems, error: updateError } = await supabase
      .from("ingestion_queue")
      .update({
        status,
        processed_at: processedAt,
        processed_by: user.id,
      })
      .eq("engagement_id", engagementId)
      .in("id", batch)
      .eq("status", "pending") // Only update pending items
      .select("id, source_type, source_id, suggested_room, suggested_block, summary");

    if (updateError) {
      batch.forEach((id) => {
        results.push({ id, success: false, error: updateError.message });
      });
      continue;
    }

    // For approved items, create blocks
    if (action === "approve" && updatedItems) {
      for (const item of updatedItems) {
        try {
          const roomKey = item.suggested_room || "meetings";

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

            const block = item.suggested_block as { type?: string; content?: string } | null;

            // Create the block
            await supabase.from("engagement_blocks").insert({
              room_id: room.id,
              block_type: block?.type || "text",
              content: block?.content || item.summary || "",
              metadata: {
                source: item.source_type,
                sourceId: item.source_id,
                ingestedAt: processedAt,
                bulkIngested: true,
              },
              order_index: (lastBlock?.order_index ?? -1) + 1,
            });
          }

          results.push({ id: item.id, success: true });
        } catch (err) {
          results.push({
            id: item.id,
            success: false,
            error: err instanceof Error ? err.message : "Block creation failed",
          });
        }
      }
    } else {
      // For rejected items, just mark as success
      batch.forEach((id) => {
        const wasUpdated = updatedItems?.some((u) => u.id === id);
        results.push({
          id,
          success: wasUpdated || false,
          error: wasUpdated ? undefined : "Item not found or not pending",
        });
      });
    }
  }

  // Log bulk action event
  try {
    await supabase.rpc("insert_engagement_event", {
      p_engagement_id: engagementId,
      p_event_type: "bulk_ingestion_processed",
      p_payload: {
        action,
        itemCount: itemIds.length,
        successCount: results.filter((r) => r.success).length,
      },
      p_actor_id: user.id,
      p_actor_type: "user",
    });
  } catch (e) {
    console.error("Failed to log bulk action event:", e);
  }

  const successCount = results.filter((r) => r.success).length;
  const errorCount = results.filter((r) => !r.success).length;

  return NextResponse.json({
    success: errorCount === 0,
    processed: successCount,
    failed: errorCount,
    results,
  });
}
