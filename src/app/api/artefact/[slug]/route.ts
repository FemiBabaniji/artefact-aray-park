// ════════════════════════════════════════════════════════════════════════════
// P3: Public Artefact API
// GET /api/artefact/:slug - Get artefact in various formats
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  compile,
  type OutputFormat,
} from "@/lib/artefact/output";
import type { Identity, StandaloneRoom } from "@/types/artefact";

type RouteParams = { params: Promise<{ slug: string }> };

// GET /api/artefact/:slug?format=context|resume|portfolio|mcp
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  const format = (request.nextUrl.searchParams.get("format") ?? "context") as OutputFormat;

  if (!["context", "resume", "portfolio", "mcp"].includes(format)) {
    return NextResponse.json(
      { error: "Invalid format. Use: context, resume, portfolio, mcp" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Fetch artefact with rooms and blocks using the view
  const { data: artefactData, error: artefactError } = await supabase
    .from("artefact_full")
    .select("*")
    .eq("slug", slug)
    .single();

  if (artefactError || !artefactData) {
    return NextResponse.json(
      { error: "Artefact not found" },
      { status: 404 }
    );
  }

  const artefact = artefactData as {
    id: string;
    identity: Identity;
    rooms: StandaloneRoom[];
  };

  // Type definitions for view results
  type SkillRow = { name: string; level: string | null; usage_count: number };
  type TimelineRow = { title: string | null; start_date: string | null; item_type: string; source: string };
  type EdgeRow = { edge_type: string; source_type: string; source_id: string; target_type: string; target_ref: string | null; context: string | null };

  // Fetch skills aggregation
  const { data: skillsData } = await supabase
    .from("artefact_skills")
    .select("*")
    .eq("slug", slug);

  // Fetch timeline aggregation
  const { data: timelineData } = await supabase
    .from("artefact_timeline")
    .select("*")
    .eq("slug", slug)
    .order("start_date", { ascending: false });

  // Fetch graph edges
  const { data: edgesData } = await supabase
    .from("graph_edges")
    .select("edge_type, source_type, source_id, target_type, target_ref, context")
    .eq("artefact_id", artefact.id);

  const skills = (skillsData ?? []) as SkillRow[];
  const timeline = (timelineData ?? []) as TimelineRow[];
  const edges = (edgesData ?? []) as EdgeRow[];

  // Transform data for compiler
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
    timeline: timeline.map((t) => ({
      title: t.title ?? "",
      date: t.start_date ?? "",
      type: t.item_type,
      source: t.source,
    })),
    edges: edges.map((e) => ({
      type: e.edge_type,
      source: `${e.source_type}:${e.source_id}`,
      target: `${e.target_type}:${e.target_ref ?? e.target_type}`,
      context: e.context ?? undefined,
    })),
  };

  const output = compile(data, format, slug);

  // Set appropriate headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  };

  // Add CORS headers for public API
  headers["Access-Control-Allow-Origin"] = "*";
  headers["Access-Control-Allow-Methods"] = "GET, OPTIONS";

  return NextResponse.json(output, { headers });
}

// OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
