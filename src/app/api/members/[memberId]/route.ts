import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getMember, updateMember } from "@/lib/data/members";

type RouteParams = { params: Promise<{ memberId: string }> };

// GET /api/members/[memberId]
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { memberId } = await params;

  const member = await getMember(memberId);

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  return NextResponse.json(member);
}

// PATCH /api/members/[memberId]
const UpdateMemberSchema = z.object({
  name: z.string().min(1).optional(),
  title: z.string().optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { memberId } = await params;

  try {
    const body = await request.json();
    const updates = UpdateMemberSchema.parse(body);

    const member = await updateMember(memberId, updates);

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json(member);
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
