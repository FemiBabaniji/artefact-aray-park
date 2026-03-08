import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const DecisionSchema = z.object({
  memberId: z.string().uuid(),
  decision: z.enum(["accepted", "rejected", "waitlisted"]),
  decidedBy: z.string().uuid().optional(),
  note: z.string().optional(),
});

// POST /api/decisions
// Records an application decision (accept/reject/waitlist)
export async function POST(request: NextRequest) {
  // Check if Supabase is configured
  if (process.env.USE_SUPABASE !== "true") {
    return NextResponse.json(
      { error: "Database not configured. Set USE_SUPABASE=true" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { memberId, decision, decidedBy, note } = DecisionSchema.parse(body);

    const supabase = await createClient();

    // Record the decision
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("application_decisions") as any)
      .insert({
        member_id: memberId,
        decision,
        decided_by: decidedBy,
        note,
      })
      .select()
      .single();

    if (error) {
      console.error("Error recording decision:", error);
      return NextResponse.json({ error: "Failed to record decision" }, { status: 500 });
    }

    // If accepted, advance stage from pending to entry
    if (decision === "accepted") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: stageError } = await (supabase.from("members") as any)
        .update({ stage: "entry" })
        .eq("id", memberId)
        .eq("stage", "pending");

      if (stageError) {
        console.error("Error updating stage:", stageError);
      }

      // Log the transition
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("stage_transitions") as any).insert({
        member_id: memberId,
        from_stage: "pending",
        to_stage: "entry",
        transitioned_by: decidedBy,
      });
    }

    return NextResponse.json(data);
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

// GET /api/decisions?memberId=xxx
// Get decision history for a member
export async function GET(request: NextRequest) {
  if (process.env.USE_SUPABASE !== "true") {
    return NextResponse.json([]);
  }

  const memberId = request.nextUrl.searchParams.get("memberId");
  if (!memberId) {
    return NextResponse.json({ error: "memberId required" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("application_decisions")
    .select("*")
    .eq("member_id", memberId)
    .order("decided_at", { ascending: false });

  if (error) {
    console.error("Error fetching decisions:", error);
    return NextResponse.json({ error: "Failed to fetch decisions" }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
