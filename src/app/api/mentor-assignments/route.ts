import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Stub data for mentor assignments
const STUB_ASSIGNMENTS = [
  { id: "ma1", mentorId: "m1", mentorName: "Jordan Lee", memberId: "am", memberName: "Ava Martinez", active: true },
  { id: "ma2", mentorId: "m1", mentorName: "Jordan Lee", memberId: "cb", memberName: "Carlos Bautista", active: true },
  { id: "ma3", mentorId: "m2", mentorName: "Maya Chen", memberId: "sp", memberName: "Sofia Park", active: true },
];

// GET /api/mentor-assignments - List assignments
export async function GET(request: NextRequest) {
  const mentorId = request.nextUrl.searchParams.get("mentorId");
  const memberId = request.nextUrl.searchParams.get("memberId");

  let assignments = STUB_ASSIGNMENTS;

  if (mentorId) {
    assignments = assignments.filter(a => a.mentorId === mentorId);
  }
  if (memberId) {
    assignments = assignments.filter(a => a.memberId === memberId);
  }

  return NextResponse.json(assignments);
}

// POST /api/mentor-assignments - Create assignment
const AssignmentSchema = z.object({
  mentorId: z.string(),
  memberId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mentorId, memberId } = AssignmentSchema.parse(body);

    // In production, this would insert into database
    const newAssignment = {
      id: `ma${Date.now()}`,
      mentorId,
      memberId,
      mentorName: "Assigned Mentor",
      memberName: "Assigned Member",
      active: true,
    };

    return NextResponse.json(newAssignment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid assignment data", issues: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 });
  }
}

// DELETE /api/mentor-assignments?id=xxx - Remove assignment
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Assignment ID required" }, { status: 400 });
  }

  // In production, this would update the database
  return NextResponse.json({ success: true, id });
}
