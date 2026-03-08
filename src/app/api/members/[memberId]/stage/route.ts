import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ memberId: string }> };

const StageSchema = z.object({
  toStage: z.enum(["pending", "entry", "foundation", "development", "showcase", "graduate"]),
  transitionedBy: z.string().uuid().optional(),
});

// POST /api/members/[memberId]/stage
// Advances a member to a new stage and logs the transition
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { memberId } = await params;

  // Check if Supabase is configured
  if (process.env.USE_SUPABASE !== "true") {
    return NextResponse.json(
      { error: "Database not configured. Set USE_SUPABASE=true" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { toStage, transitionedBy } = StageSchema.parse(body);

    const supabase = await createClient();

    // Get current stage
    const { data: member, error: fetchError } = await supabase
      .from("members")
      .select("stage")
      .eq("id", memberId)
      .single();

    if (fetchError || !member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const fromStage = (member as { stage: string }).stage;

    // Update member stage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase.from("members") as any)
      .update({ stage: toStage })
      .eq("id", memberId);

    if (updateError) {
      console.error("Error updating stage:", updateError);
      return NextResponse.json({ error: "Failed to update stage" }, { status: 500 });
    }

    // Log the transition
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: logError } = await (supabase.from("stage_transitions") as any)
      .insert({
        member_id: memberId,
        from_stage: fromStage,
        to_stage: toStage,
        transitioned_by: transitionedBy,
      });

    if (logError) {
      console.error("Error logging transition:", logError);
      // Don't fail the request, stage was updated successfully
    }

    return NextResponse.json({
      memberId,
      fromStage,
      toStage,
      transitionedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
