// ============================================================================
// Engagement Renders API
// GET /api/engagements/[id]/renders - List all renders
// POST /api/engagements/[id]/renders - Create a new render
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { generateShareToken } from "@/lib/render/service";
import type { RenderIntent, RenderRoomSelection, RenderConfig } from "@/types/render";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { supabase, user } = auth.context;
  const userId = user.id;

  const { id: engagementId } = await params;

  // Verify engagement ownership
  const { data: engagement, error: engErr } = await supabase
    .from("engagements")
    .select("id, owner_id")
    .eq("id", engagementId)
    .single();

  if (engErr || !engagement) {
    return NextResponse.json({ error: "Engagement not found" }, { status: 404 });
  }

  if (engagement.owner_id !== userId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Get all renders for this engagement
  const { data: renders, error } = await supabase
    .from("engagement_renders")
    .select("*")
    .eq("engagement_id", engagementId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch renders" }, { status: 500 });
  }

  // Transform to camelCase
  const transformed = (renders || []).map((r) => ({
    id: r.id,
    engagementId: r.engagement_id,
    name: r.name,
    intent: r.intent as RenderIntent,
    roomSelections: r.room_selections as RenderRoomSelection[],
    renderConfig: r.render_config as RenderConfig,
    shareToken: r.share_token,
    sharedAt: r.shared_at,
    forkedFromTemplateId: r.forked_from_template,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  return NextResponse.json({ renders: transformed });
}

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { supabase, user } = auth.context;
  const userId = user.id;

  const { id: engagementId } = await params;

  // Verify engagement ownership
  const { data: engagement, error: engErr } = await supabase
    .from("engagements")
    .select("id, owner_id")
    .eq("id", engagementId)
    .single();

  if (engErr || !engagement) {
    return NextResponse.json({ error: "Engagement not found" }, { status: 404 });
  }

  if (engagement.owner_id !== userId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await request.json();
  const {
    name,
    intent,
    roomSelections,
    renderConfig,
    forkedFromTemplateId,
  } = body as {
    name: string;
    intent: RenderIntent;
    roomSelections: RenderRoomSelection[];
    renderConfig: RenderConfig;
    forkedFromTemplateId?: string;
  };

  if (!name || !intent) {
    return NextResponse.json(
      { error: "Name and intent are required" },
      { status: 400 }
    );
  }

  // Create the render
  const { data: render, error } = await supabase
    .from("engagement_renders")
    .insert({
      engagement_id: engagementId,
      name,
      intent,
      room_selections: roomSelections || [],
      render_config: renderConfig || { intent, showFeaturedOnly: false },
      forked_from_template: forkedFromTemplateId || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create render:", error);
    return NextResponse.json({ error: "Failed to create render" }, { status: 500 });
  }

  // Log event
  try {
    await supabase.rpc("insert_engagement_event", {
      p_engagement_id: engagementId,
      p_event_type: "render_created",
      p_payload: {
        renderId: render.id,
        name,
        intent,
        forkedFromTemplateId,
      },
      p_actor_id: userId,
      p_actor_type: "user",
    });
  } catch (e) {
    console.error("Failed to log render event:", e);
  }

  // If forked from template, increment fork count
  if (forkedFromTemplateId) {
    try {
      // Increment using raw SQL via RPC or update
      const { data: template } = await supabase
        .from("render_templates")
        .select("fork_count")
        .eq("id", forkedFromTemplateId)
        .single();

      if (template) {
        await supabase
          .from("render_templates")
          .update({ fork_count: (template.fork_count || 0) + 1 })
          .eq("id", forkedFromTemplateId);
      }
    } catch {
      // Ignore - fork count is best effort
    }
  }

  return NextResponse.json({
    render: {
      id: render.id,
      engagementId: render.engagement_id,
      name: render.name,
      intent: render.intent,
      roomSelections: render.room_selections,
      renderConfig: render.render_config,
      createdAt: render.created_at,
      updatedAt: render.updated_at,
    },
  });
}
