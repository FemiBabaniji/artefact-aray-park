import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSections, updateSection, submitSection, reviewSection } from "@/lib/data/members";

type RouteParams = { params: Promise<{ memberId: string }> };

// GET /api/sections/[memberId]
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { memberId } = await params;

  const sections = await getSections(memberId);

  return NextResponse.json(sections);
}

// PATCH /api/sections/[memberId]?key=practice
const UpdateSectionSchema = z.object({
  status: z.enum(["empty", "in_progress", "submitted", "reviewed", "accepted"]).optional(),
  evidence: z.string().optional(),
  feedback: z.string().optional(),
  feedbackBy: z.string().optional(),
});

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { memberId } = await params;
  const sectionKey = request.nextUrl.searchParams.get("key");

  if (!sectionKey) {
    return NextResponse.json(
      { error: "Section key is required. Use ?key=practice" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const updates = UpdateSectionSchema.parse(body);

    const section = await updateSection(memberId, sectionKey, updates);

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    return NextResponse.json(section);
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

// POST /api/sections/[memberId]/submit
const SubmitSchema = z.object({
  sectionKey: z.string(),
  evidence: z.string().min(1),
});

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { memberId } = await params;
  const action = request.nextUrl.searchParams.get("action");

  try {
    const body = await request.json();

    if (action === "submit") {
      const { sectionKey, evidence } = SubmitSchema.parse(body);
      const section = await submitSection(memberId, sectionKey, evidence);

      if (!section) {
        return NextResponse.json({ error: "Section not found" }, { status: 404 });
      }

      return NextResponse.json(section);
    }

    if (action === "review") {
      const ReviewSchema = z.object({
        sectionKey: z.string(),
        feedback: z.string(),
        reviewerId: z.string(),
        accept: z.boolean(),
      });

      const { sectionKey, feedback, reviewerId, accept } = ReviewSchema.parse(body);
      const section = await reviewSection(memberId, sectionKey, feedback, reviewerId, accept);

      if (!section) {
        return NextResponse.json({ error: "Section not found" }, { status: 404 });
      }

      return NextResponse.json(section);
    }

    return NextResponse.json(
      { error: "Invalid action. Use ?action=submit or ?action=review" },
      { status: 400 }
    );
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
