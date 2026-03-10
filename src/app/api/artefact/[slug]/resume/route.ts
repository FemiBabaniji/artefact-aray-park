// ════════════════════════════════════════════════════════════════════════════
// P3: Resume HTML/PDF Export
// GET /api/artefact/:slug/resume - Returns printable HTML resume
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { compileResume } from "@/lib/artefact/output";
import { generateResumeHTML } from "@/lib/artefact/resume-html";
import type { Identity, StandaloneRoom } from "@/types/artefact";

type RouteParams = { params: Promise<{ slug: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  const format = request.nextUrl.searchParams.get("format") ?? "html";

  const supabase = await createClient();

  // Fetch artefact
  const { data: artefactData, error } = await supabase
    .from("artefact_full")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !artefactData) {
    return NextResponse.json({ error: "Artefact not found" }, { status: 404 });
  }

  const artefact = artefactData as {
    id: string;
    identity: Identity;
    rooms: StandaloneRoom[];
  };

  // Fetch skills
  const { data: skillsData } = await supabase
    .from("artefact_skills")
    .select("*")
    .eq("slug", slug);

  type SkillRow = { name: string; level: string | null; usage_count: number };
  const skills = (skillsData ?? []) as SkillRow[];

  const identity = artefact.identity;
  const rooms = artefact.rooms ?? [];

  const data = {
    identity,
    rooms: rooms.map((r) => ({
      ...r,
      semantic: (r as unknown as { semantic?: string }).semantic ?? "custom",
      blocks: (r.blocks ?? []).map((b) => ({
        type: b.blockType,
        content: {
          body: b.content,
          ...(b.metadata ?? {}),
        },
      })),
    })),
    skills: skills.map((s) => ({
      name: s.name,
      level: s.level ?? undefined,
      usage_count: s.usage_count,
    })),
  };

  const resume = compileResume(data);

  if (format === "json") {
    return NextResponse.json(resume);
  }

  // Return HTML
  const html = generateResumeHTML(resume);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="${slug}-resume.html"`,
    },
  });
}
