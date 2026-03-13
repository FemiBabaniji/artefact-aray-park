// ============================================================================
// Public Render View API
// GET /api/render/[token] - View a shared render (no auth required)
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { computeRender } from "@/lib/render/service";
import type { RenderIntent, RenderRoomSelection, RenderConfig, MaskAnnotation } from "@/types/render";

type Params = {
  params: Promise<{ token: string }>;
};

// Use admin client for public access
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

export async function GET(request: NextRequest, { params }: Params) {
  const { token } = await params;
  const { searchParams } = new URL(request.url);
  const password = searchParams.get("password");

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  // Find render by share token
  const { data: render, error: renderErr } = await supabase
    .from("engagement_renders")
    .select("*, engagement_id")
    .eq("share_token", token)
    .single();

  if (renderErr || !render) {
    return NextResponse.json({ error: "Render not found" }, { status: 404 });
  }

  // Check password if required
  if (render.share_password && render.share_password !== password) {
    return NextResponse.json(
      { error: "Password required", requiresPassword: true },
      { status: 401 }
    );
  }

  // Get engagement info
  const { data: engagement } = await supabase
    .from("engagements")
    .select("name, client_name")
    .eq("id", render.engagement_id)
    .single();

  // Get rooms with blocks (respecting visibility)
  const { data: rooms, error: roomsErr } = await supabase
    .from("engagement_rooms")
    .select(`
      id,
      key,
      label,
      visibility,
      engagement_blocks (
        id,
        block_type,
        content,
        caption,
        metadata,
        featured,
        mask_annotations,
        order_index
      )
    `)
    .eq("engagement_id", render.engagement_id)
    .neq("visibility", "consultant_only") // Don't expose consultant-only rooms
    .order("order_index", { ascending: true });

  if (roomsErr) {
    return NextResponse.json({ error: "Failed to fetch render data" }, { status: 500 });
  }

  // Get participant names for masking
  const { data: participants } = await supabase
    .from("engagement_participants")
    .select("name")
    .eq("engagement_id", render.engagement_id);

  const participantNames = participants?.map((p) => p.name).filter(Boolean) || [];

  // Transform rooms data
  type BlockRow = {
    id: string;
    block_type: string;
    content?: string;
    caption?: string;
    metadata?: Record<string, unknown>;
    featured?: boolean;
    mask_annotations?: MaskAnnotation[];
    order_index: number;
  };

  const roomsData = (rooms || []).map((r) => ({
    id: r.id as string,
    key: r.key as string,
    label: r.label as string,
    blocks: ((r.engagement_blocks || []) as BlockRow[])
      .sort((a, b) => a.order_index - b.order_index)
      .map((b) => ({
        id: b.id,
        block_type: b.block_type,
        content: b.content,
        caption: b.caption,
        metadata: b.metadata,
        featured: b.featured,
        mask_annotations: b.mask_annotations as MaskAnnotation[] | undefined,
      })),
  }));

  // Build engagement render object
  const engagementRender = {
    id: render.id,
    engagementId: render.engagement_id,
    name: render.name,
    intent: render.intent as RenderIntent,
    roomSelections: render.room_selections as RenderRoomSelection[],
    renderConfig: render.render_config as RenderConfig,
    shareToken: render.share_token,
    sharedAt: render.shared_at,
    forkedFromTemplateId: render.forked_from_template,
    createdAt: render.created_at,
    updatedAt: render.updated_at,
  };

  // Compute with masks (not owner, so no raw content)
  const computed = computeRender(
    engagementRender,
    roomsData,
    {
      clientName: engagement?.client_name,
      participantNames,
    },
    false // isOwner = false
  );

  // Log view
  try {
    // Determine viewer type from request headers
    const viewerType = "anonymous";
    const ipHash = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const userAgent = request.headers.get("user-agent") || "";

    await supabase.from("render_views").insert({
      render_id: render.id,
      viewer_type: viewerType,
      ip_hash: ipHash.slice(0, 8), // Just first 8 chars as pseudo-hash
      user_agent: userAgent.slice(0, 200),
    });

    // Also log as engagement event
    await supabase.rpc("insert_engagement_event", {
      p_engagement_id: render.engagement_id,
      p_event_type: "render_viewed",
      p_payload: {
        renderId: render.id,
        viewerType,
        shareToken: token,
      },
      p_actor_id: null,
      p_actor_type: "system",
    });
  } catch (e) {
    console.error("Failed to log view:", e);
  }

  return NextResponse.json({
    engagementName: engagement?.name,
    computed,
  });
}
