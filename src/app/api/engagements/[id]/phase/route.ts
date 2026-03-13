import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import type { EngagementPhase } from "@/types/engagement";

type Params = {
  params: Promise<{ id: string }>;
};

const VALID_PHASES: EngagementPhase[] = [
  "intake",
  "qualification",
  "proposal",
  "negotiation",
  "signed",
  "delivery",
  "completed",
  "archived",
];

// POST /api/engagements/[id]/phase - Change engagement phase
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { user, supabase } = auth.context;

  try {
    const body = await request.json();
    const { toPhase, reason } = body;

    if (!toPhase) {
      return NextResponse.json(
        { error: "toPhase is required" },
        { status: 400 }
      );
    }

    if (!VALID_PHASES.includes(toPhase)) {
      return NextResponse.json(
        { error: "Invalid phase" },
        { status: 400 }
      );
    }

    // Get current phase
    const { data: engagement, error: fetchError } = await supabase
      .from("engagements")
      .select("phase")
      .eq("id", id)
      .single();

    if (fetchError || !engagement) {
      return NextResponse.json(
        { error: "Engagement not found" },
        { status: 404 }
      );
    }

    const fromPhase = engagement.phase;

    if (fromPhase === toPhase) {
      return NextResponse.json(
        { error: "Already in this phase" },
        { status: 400 }
      );
    }

    // Update phase
    const { error: updateError } = await supabase
      .from("engagements")
      .update({ phase: toPhase })
      .eq("id", id);

    if (updateError) {
      console.error("Failed to update phase:", updateError);
      return NextResponse.json(
        { error: "Failed to update phase" },
        { status: 500 }
      );
    }

    // Record phase transition
    await supabase.from("engagement_phase_transitions").insert({
      engagement_id: id,
      from_phase: fromPhase,
      to_phase: toPhase,
      transitioned_by: user.id,
      reason,
    });

    // Record event
    await supabase.rpc("insert_engagement_event", {
      p_engagement_id: id,
      p_event_type: "engagement_phase_changed",
      p_payload: { fromPhase, toPhase, reason },
      p_actor_id: user.id,
      p_actor_type: "user",
    });

    return NextResponse.json({
      success: true,
      fromPhase,
      toPhase,
    });
  } catch (error) {
    console.error("Phase change error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
