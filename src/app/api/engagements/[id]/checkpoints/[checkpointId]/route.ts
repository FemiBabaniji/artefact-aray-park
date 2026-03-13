import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";

type Params = {
  params: Promise<{ id: string; checkpointId: string }>;
};

// PATCH /api/engagements/[id]/checkpoints/[checkpointId] - Update checkpoint
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id, checkpointId } = await params;
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { user, supabase } = auth.context;

  try {
    const body = await request.json();
    const { status, notes, label, description, required } = body;

    // Verify checkpoint exists and belongs to this engagement
    const { data: existingCheckpoint } = await supabase
      .from("engagement_checkpoints")
      .select("id, status")
      .eq("id", checkpointId)
      .eq("engagement_id", id)
      .single();

    if (!existingCheckpoint) {
      return NextResponse.json(
        { error: "Checkpoint not found" },
        { status: 404 }
      );
    }

    // Build updates
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (status !== undefined) {
      updates.status = status;
      if (status === "completed") {
        updates.completed_at = new Date().toISOString();
        updates.completed_by = user.id;
      }
    }
    if (notes !== undefined) updates.notes = notes;
    if (label !== undefined) updates.label = label;
    if (description !== undefined) updates.description = description;
    if (required !== undefined) updates.required = required;

    const { data: checkpoint, error } = await supabase
      .from("engagement_checkpoints")
      .update(updates)
      .eq("id", checkpointId)
      .select()
      .single();

    if (error) {
      console.error("Checkpoint update error:", error);
      return NextResponse.json(
        { error: "Failed to update checkpoint" },
        { status: 500 }
      );
    }

    // Log event if status changed
    if (status && status !== existingCheckpoint.status) {
      await supabase.rpc("insert_engagement_event", {
        p_engagement_id: id,
        p_event_type: "checkpoint_status_changed",
        p_payload: {
          checkpointId,
          label: checkpoint.label,
          fromStatus: existingCheckpoint.status,
          toStatus: status,
        },
        p_actor_id: user.id,
        p_actor_type: "user",
      });
    }

    return NextResponse.json({
      checkpoint: {
        id: checkpoint.id,
        engagementId: checkpoint.engagement_id,
        label: checkpoint.label,
        description: checkpoint.description,
        phase: checkpoint.phase,
        checkpointType: checkpoint.checkpoint_type,
        required: checkpoint.required,
        orderIndex: checkpoint.order_index,
        status: checkpoint.status,
        completedAt: checkpoint.completed_at,
        completedBy: checkpoint.completed_by,
        notes: checkpoint.notes,
        createdAt: checkpoint.created_at,
        updatedAt: checkpoint.updated_at,
      },
    });
  } catch (error) {
    console.error("Checkpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/engagements/[id]/checkpoints/[checkpointId] - Delete checkpoint
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id, checkpointId } = await params;
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { user, supabase } = auth.context;

  try {
    // Verify checkpoint exists
    const { data: checkpoint } = await supabase
      .from("engagement_checkpoints")
      .select("id, label")
      .eq("id", checkpointId)
      .eq("engagement_id", id)
      .single();

    if (!checkpoint) {
      return NextResponse.json(
        { error: "Checkpoint not found" },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from("engagement_checkpoints")
      .delete()
      .eq("id", checkpointId);

    if (error) {
      console.error("Checkpoint delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete checkpoint" },
        { status: 500 }
      );
    }

    // Log event
    await supabase.rpc("insert_engagement_event", {
      p_engagement_id: id,
      p_event_type: "checkpoint_removed",
      p_payload: { checkpointId, label: checkpoint.label },
      p_actor_id: user.id,
      p_actor_type: "user",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Checkpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
