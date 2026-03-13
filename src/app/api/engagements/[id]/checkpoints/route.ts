import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";

type Params = {
  params: Promise<{ id: string }>;
};

// GET /api/engagements/[id]/checkpoints - List checkpoints
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { supabase } = auth.context;

  try {
    const { searchParams } = new URL(request.url);
    const phase = searchParams.get("phase");

    // Verify engagement exists
    const { data: engagement } = await supabase
      .from("engagements")
      .select("id")
      .eq("id", id)
      .single();

    if (!engagement) {
      return NextResponse.json(
        { error: "Engagement not found" },
        { status: 404 }
      );
    }

    // Build query
    let query = supabase
      .from("engagement_checkpoints")
      .select("*")
      .eq("engagement_id", id)
      .order("order_index", { ascending: true });

    if (phase) {
      query = query.eq("phase", phase);
    }

    const { data: checkpoints, error } = await query;

    if (error) {
      console.error("Checkpoints fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch checkpoints" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      checkpoints: (checkpoints ?? []).map((cp) => ({
        id: cp.id,
        engagementId: cp.engagement_id,
        label: cp.label,
        description: cp.description,
        phase: cp.phase,
        checkpointType: cp.checkpoint_type,
        required: cp.required,
        orderIndex: cp.order_index,
        status: cp.status,
        completedAt: cp.completed_at,
        completedBy: cp.completed_by,
        notes: cp.notes,
        createdAt: cp.created_at,
        updatedAt: cp.updated_at,
      })),
    });
  } catch (error) {
    console.error("Checkpoints error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/engagements/[id]/checkpoints - Create checkpoint
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { user, supabase } = auth.context;

  try {
    const body = await request.json();
    const { label, description, phase, checkpointType, required = true } = body;

    if (!label || !phase || !checkpointType) {
      return NextResponse.json(
        { error: "Label, phase, and checkpoint type required" },
        { status: 400 }
      );
    }

    // Verify engagement exists
    const { data: engagement } = await supabase
      .from("engagements")
      .select("id")
      .eq("id", id)
      .single();

    if (!engagement) {
      return NextResponse.json(
        { error: "Engagement not found" },
        { status: 404 }
      );
    }

    // Get next order index
    const { data: lastCheckpoint } = await supabase
      .from("engagement_checkpoints")
      .select("order_index")
      .eq("engagement_id", id)
      .eq("phase", phase)
      .order("order_index", { ascending: false })
      .limit(1)
      .single();

    const orderIndex = (lastCheckpoint?.order_index ?? -1) + 1;

    const { data: checkpoint, error } = await supabase
      .from("engagement_checkpoints")
      .insert({
        engagement_id: id,
        label,
        description: description || null,
        phase,
        checkpoint_type: checkpointType,
        required,
        order_index: orderIndex,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Checkpoint creation error:", error);
      return NextResponse.json(
        { error: "Failed to create checkpoint" },
        { status: 500 }
      );
    }

    // Log event
    await supabase.rpc("insert_engagement_event", {
      p_engagement_id: id,
      p_event_type: "checkpoint_added",
      p_payload: { checkpointId: checkpoint.id, label, phase },
      p_actor_id: user.id,
      p_actor_type: "user",
    });

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
