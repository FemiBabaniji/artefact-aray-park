// ════════════════════════════════════════════════════════════════════════════
// P3: MCP Resource Discovery
// GET /api/mcp/resources - List available artefact resources
// GET /api/mcp/resources?uri=artefact://slug - Read specific resource
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { compileMCPResource } from "@/lib/artefact/output";
import type { Identity, StandaloneRoom } from "@/types/artefact";

// MCP Resource List Response
type MCPResourceListResponse = {
  resources: {
    uri: string;
    name: string;
    description: string;
    mimeType: string;
  }[];
};

// MCP Resource Read Response
type MCPResourceReadResponse = {
  contents: {
    uri: string;
    mimeType: string;
    text: string;
  }[];
};

export async function GET(request: NextRequest) {
  const uri = request.nextUrl.searchParams.get("uri");
  const supabase = await createClient();

  // If URI provided, read specific resource
  if (uri) {
    // Parse artefact://slug format
    const match = uri.match(/^artefact:\/\/(.+)$/);
    if (!match) {
      return NextResponse.json(
        { error: "Invalid URI format. Use: artefact://slug" },
        { status: 400 }
      );
    }

    const slug = match[1];

    // Fetch artefact
    const { data: artefactData, error } = await supabase
      .from("artefact_full")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !artefactData) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    const artefact = artefactData as {
      id: string;
      identity: Identity;
      rooms: StandaloneRoom[];
    };

    // Type definitions
    type SkillRow = { name: string; level: string | null; usage_count: number };
    type TimelineRow = { title: string | null; start_date: string | null; item_type: string; source: string };
    type EdgeRow = { edge_type: string; source_type: string; source_id: string; target_type: string; target_ref: string | null; context: string | null };

    // Fetch related data
    const [{ data: skillsData }, { data: timelineData }, { data: edgesData }] = await Promise.all([
      supabase.from("artefact_skills").select("*").eq("slug", slug),
      supabase.from("artefact_timeline").select("*").eq("slug", slug),
      supabase.from("graph_edges").select("*").eq("artefact_id", artefact.id),
    ]);

    const skills = (skillsData ?? []) as SkillRow[];
    const timeline = (timelineData ?? []) as TimelineRow[];
    const edges = (edgesData ?? []) as EdgeRow[];

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
        target: `${e.target_type}:${e.target_ref}`,
        context: e.context ?? undefined,
      })),
    };

    const mcpResource = compileMCPResource(data, slug);

    const response: MCPResourceReadResponse = {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(mcpResource.contents, null, 2),
        },
      ],
    };

    return NextResponse.json(response);
  }

  // List all published artefacts as resources
  const { data: artefactsData, error } = await supabase
    .from("standalone_artefacts")
    .select("slug, identity")
    .not("slug", "is", null);

  if (error) {
    return NextResponse.json(
      { error: "Failed to list resources" },
      { status: 500 }
    );
  }

  type ArtefactRow = { slug: string | null; identity: Identity };
  const artefacts = (artefactsData ?? []) as ArtefactRow[];

  const response: MCPResourceListResponse = {
    resources: artefacts.map((a) => ({
      uri: `artefact://${a.slug}`,
      name: a.identity.name || a.slug || "Unknown",
      description: `Professional context for ${a.identity.name || a.slug}`,
      mimeType: "application/json",
    })),
  };

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
