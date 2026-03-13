// ============================================================================
// Single Render API
// GET /api/engagements/[id]/renders/[renderId] - Get render with computed output
// PATCH /api/engagements/[id]/renders/[renderId] - Update render
// DELETE /api/engagements/[id]/renders/[renderId] - Delete render
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { computeRender, generateShareToken } from "@/lib/render/service";
import type { RenderIntent, RenderRoomSelection, RenderConfig, MaskAnnotation } from "@/types/render";

type Params = {
  params: Promise<{ id: string; renderId: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { supabase, user } = auth.context;
  const userId = user.id;

  const { id: engagementId, renderId } = await params;

  // Get the render
  const { data: render, error: renderErr } = await supabase
    .from("engagement_renders")
    .select("*")
    .eq("id", renderId)
    .eq("engagement_id", engagementId)
    .single();

  if (renderErr || !render) {
    return NextResponse.json({ error: "Render not found" }, { status: 404 });
  }

  // Check ownership
  const { data: engagement } = await supabase
    .from("engagements")
    .select("owner_id, name, client_name")
    .eq("id", engagementId)
    .single();

  const isOwner = engagement?.owner_id === userId;

  // Get rooms with blocks
  const { data: rooms, error: roomsErr } = await supabase
    .from("engagement_rooms")
    .select(`
      id,
      key,
      label,
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
    .eq("engagement_id", engagementId)
    .order("order_index", { ascending: true });

  if (roomsErr) {
    return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
  }

  // Get participant names for masking
  const { data: participants } = await supabase
    .from("engagement_participants")
    .select("name")
    .eq("engagement_id", engagementId);

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

  // Compute the render
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

  const computed = computeRender(
    engagementRender,
    roomsData,
    {
      clientName: engagement?.client_name,
      participantNames,
    },
    isOwner
  );

  return NextResponse.json({ computed });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { supabase, user } = auth.context;
  const userId = user.id;

  const { id: engagementId, renderId } = await params;

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

  // Get render
  const { data: render, error: renderErr } = await supabase
    .from("engagement_renders")
    .select("*")
    .eq("id", renderId)
    .eq("engagement_id", engagementId)
    .single();

  if (renderErr || !render) {
    return NextResponse.json({ error: "Render not found" }, { status: 404 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.name !== undefined) updates.name = body.name;
  if (body.intent !== undefined) updates.intent = body.intent;
  if (body.roomSelections !== undefined) updates.room_selections = body.roomSelections;
  if (body.renderConfig !== undefined) updates.render_config = body.renderConfig;

  // Handle sharing
  if (body.share === true && !render.share_token) {
    updates.share_token = generateShareToken();
    updates.shared_at = new Date().toISOString();

    // Log share event
    try {
      await supabase.rpc("insert_engagement_event", {
        p_engagement_id: engagementId,
        p_event_type: "render_shared",
        p_payload: {
          renderId,
          shareToken: updates.share_token,
          audienceType: body.audienceType || "external",
        },
        p_actor_id: userId,
        p_actor_type: "user",
      });
    } catch (e) {
      console.error("Failed to log share event:", e);
    }
  } else if (body.share === false) {
    updates.share_token = null;
    updates.shared_at = null;
  }

  if (body.sharePassword !== undefined) {
    updates.share_password = body.sharePassword || null;
  }

  updates.updated_at = new Date().toISOString();

  const { data: updated, error: updateErr } = await supabase
    .from("engagement_renders")
    .update(updates)
    .eq("id", renderId)
    .select()
    .single();

  if (updateErr) {
    return NextResponse.json({ error: "Failed to update render" }, { status: 500 });
  }

  return NextResponse.json({
    render: {
      id: updated.id,
      engagementId: updated.engagement_id,
      name: updated.name,
      intent: updated.intent,
      roomSelections: updated.room_selections,
      renderConfig: updated.render_config,
      shareToken: updated.share_token,
      sharedAt: updated.shared_at,
      updatedAt: updated.updated_at,
    },
  });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { supabase, user } = auth.context;
  const userId = user.id;

  const { id: engagementId, renderId } = await params;

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

  const { error } = await supabase
    .from("engagement_renders")
    .delete()
    .eq("id", renderId)
    .eq("engagement_id", engagementId);

  if (error) {
    return NextResponse.json({ error: "Failed to delete render" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
