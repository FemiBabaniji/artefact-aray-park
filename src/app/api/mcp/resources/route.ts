// ════════════════════════════════════════════════════════════════════════════
// P3: MCP Resource Discovery
// GET /api/mcp/resources - List available artefact and engagement resources
// GET /api/mcp/resources?uri=artefact://slug - Read specific artefact resource
// GET /api/mcp/resources?uri=engagement://slug - Read specific engagement resource
// GET /api/mcp/resources?type=engagement - List only engagement resources
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDemoAdminClient } from "@/lib/supabase/admin";
import { compileMCPResource } from "@/lib/artefact/output";
import type { Identity, StandaloneRoom } from "@/types/artefact";
import type { EngagementPhase } from "@/types/engagement";
import { getPhaseLabel } from "@/types/engagement";

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
  const resourceType = request.nextUrl.searchParams.get("type");
  const supabase = await createClient();
  const adminClient = getDemoAdminClient();

  // If URI provided, read specific resource
  if (uri) {
    // Check for engagement://slug format first
    const engagementMatch = uri.match(/^engagement:\/\/(.+)$/);
    if (engagementMatch && adminClient) {
      return handleEngagementResource(engagementMatch[1], uri, adminClient);
    }

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

  // List resources based on type filter
  const resources: MCPResourceListResponse["resources"] = [];

  // List engagements if requested or no type filter
  if ((!resourceType || resourceType === "engagement") && adminClient) {
    const { data: engagementsData } = await adminClient
      .from("engagement_summary")
      .select("slug, name, client_name, phase")
      .not("slug", "is", null);

    type EngagementRow = { slug: string; name: string; client_name: string | null; phase: string };
    const engagements = (engagementsData ?? []) as EngagementRow[];

    for (const e of engagements) {
      resources.push({
        uri: `engagement://${e.slug}`,
        name: `${e.name}${e.client_name ? ` - ${e.client_name}` : ""}`,
        description: `Engagement context: ${getPhaseLabel(e.phase as EngagementPhase)} phase`,
        mimeType: "application/json",
      });
    }
  }

  // List artefacts if requested or no type filter
  if (!resourceType || resourceType === "artefact") {
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

    for (const a of artefacts) {
      resources.push({
        uri: `artefact://${a.slug}`,
        name: a.identity.name || a.slug || "Unknown",
        description: `Professional context for ${a.identity.name || a.slug}`,
        mimeType: "application/json",
      });
    }
  }

  const response: MCPResourceListResponse = { resources };

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}

// ── Engagement Resource Handler ─────────────────────────────────────────────

async function handleEngagementResource(
  slug: string,
  uri: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
) {
  // Fetch engagement
  const { data: engagement, error: engagementError } = await supabase
    .from("engagements")
    .select("*")
    .eq("slug", slug)
    .single();

  if (engagementError || !engagement) {
    return NextResponse.json(
      { error: "Engagement not found" },
      { status: 404 }
    );
  }

  // Fetch client
  let client = null;
  if (engagement.client_id) {
    const { data } = await supabase
      .from("clients")
      .select("id, name, slug, industry, website")
      .eq("id", engagement.client_id)
      .single();
    client = data;
  }

  // Fetch rooms with blocks
  const { data: rooms } = await supabase
    .from("engagement_rooms")
    .select("*")
    .eq("engagement_id", engagement.id)
    .order("order_index", { ascending: true });

  const roomIds = rooms?.map((r: { id: string }) => r.id) ?? [];
  let blocks: Record<string, unknown[]> = {};
  if (roomIds.length > 0) {
    const { data: allBlocks } = await supabase
      .from("engagement_blocks")
      .select("*")
      .in("room_id", roomIds)
      .order("order_index", { ascending: true });

    blocks = (allBlocks ?? []).reduce((acc: Record<string, unknown[]>, block: { room_id: string }) => {
      if (!acc[block.room_id]) acc[block.room_id] = [];
      acc[block.room_id].push(block);
      return acc;
    }, {} as Record<string, unknown[]>);
  }

  // Fetch participants
  const { data: participants } = await supabase
    .from("engagement_participants")
    .select("name, email, role")
    .eq("engagement_id", engagement.id);

  // Fetch phase transitions
  const { data: transitions } = await supabase
    .from("engagement_phase_transitions")
    .select("from_phase, to_phase, created_at")
    .eq("engagement_id", engagement.id)
    .order("created_at", { ascending: true });

  // Fetch recent events (last 20 for AI context)
  const { data: recentEvents } = await supabase
    .from("engagement_events")
    .select("event_type, payload, created_at, sequence")
    .eq("engagement_id", engagement.id)
    .order("sequence", { ascending: false })
    .limit(20);

  // Compile MCP resource
  const mcpContents = {
    format: "engagement_context",
    version: "1.1",
    engagement: {
      id: engagement.id,
      slug: engagement.slug,
      name: engagement.name,
      phase: engagement.phase,
      phaseLabel: getPhaseLabel(engagement.phase as EngagementPhase),
      value: engagement.value,
      currency: engagement.currency,
      startDate: engagement.start_date,
      endDate: engagement.end_date,
      createdAt: engagement.created_at,
      updatedAt: engagement.updated_at,
    },
    client: client
      ? {
          name: client.name,
          industry: client.industry,
          website: client.website,
        }
      : null,
    rooms: (rooms ?? []).map((room: { id: string; key: string; label: string; room_type: string; visibility: string; prompt: string }) => ({
      key: room.key,
      label: room.label,
      type: room.room_type,
      visibility: room.visibility,
      prompt: room.prompt,
      blocks: (blocks[room.id] ?? []).map((block) => {
        const b = block as { block_type?: string; content?: string; caption?: string };
        return {
          type: b.block_type,
          content: b.content,
          caption: b.caption,
        };
      }),
    })),
    participants: (participants ?? []).map((p: { name: string; role: string }) => ({
      name: p.name,
      role: p.role,
    })),
    timeline: (transitions ?? []).map((t: { from_phase: string | null; to_phase: string; created_at: string }) => ({
      from: t.from_phase,
      to: t.to_phase,
      date: t.created_at,
    })),
    recentEvents: (recentEvents ?? []).map((e: { event_type: string; payload: Record<string, unknown>; created_at: string }) => ({
      type: e.event_type,
      payload: e.payload,
      timestamp: e.created_at,
    })),
  };

  const response: MCPResourceReadResponse = {
    contents: [
      {
        uri,
        mimeType: "application/json",
        text: JSON.stringify(mcpContents, null, 2),
      },
    ],
  };

  return NextResponse.json(response);
}
