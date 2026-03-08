import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getMember, getSections } from "@/lib/data/members";
import { createClient } from "@/lib/supabase/server";
import type { Artefact } from "@/types/artefact";

type RouteParams = { params: Promise<{ memberId: string }> };

// GET /api/artefacts/[memberId]
// Returns the complete artefact (member sections + workspace content)
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { memberId } = await params;

  const [member, sections] = await Promise.all([
    getMember(memberId),
    getSections(memberId),
  ]);

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  // Try to get workspace content from database
  let wsContent = "";
  if (process.env.USE_SUPABASE === "true") {
    const supabase = await createClient();
    const { data } = await supabase
      .from("artefacts")
      .select("ws_content")
      .eq("member_id", memberId)
      .single();
    wsContent = (data as { ws_content?: string } | null)?.ws_content ?? "";
  }

  const artefact: Artefact = {
    memberId: member.id,
    sections,
    wsContent,
    updatedAt: new Date().toISOString(),
  };

  return NextResponse.json(artefact);
}

const UpdateArtefactSchema = z.object({
  wsContent: z.string(),
});

// PATCH /api/artefacts/[memberId]
// Updates workspace content
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { memberId } = await params;

  if (process.env.USE_SUPABASE !== "true") {
    // Stub mode - pretend to save
    return NextResponse.json({ success: true, memberId });
  }

  try {
    const body = await request.json();
    const { wsContent } = UpdateArtefactSchema.parse(body);

    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("artefacts") as any)
      .update({ ws_content: wsContent, updated_at: new Date().toISOString() })
      .eq("member_id", memberId);

    if (error) {
      console.error("Error updating artefact:", error);
      return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }

    return NextResponse.json({ success: true, memberId });
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
