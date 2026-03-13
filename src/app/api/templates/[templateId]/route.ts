// ============================================================================
// Single Template API
// GET /api/templates/[templateId] - Get template details
// PATCH /api/templates/[templateId] - Update template
// DELETE /api/templates/[templateId] - Delete template
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import type { RenderTemplate, RoomSchema, IntentDefaults } from "@/types/render";

type Params = {
  params: Promise<{ templateId: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { supabase, user } = auth.context;
  const userId = user.id;

  const { templateId } = await params;

  const { data: template, error } = await supabase
    .from("render_templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (error || !template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  // Check visibility
  if (template.visibility !== "public" && template.owner_id !== userId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const transformed: RenderTemplate = {
    id: template.id,
    ownerId: template.owner_id,
    practiceId: template.practice_id,
    name: template.name,
    slug: template.slug,
    description: template.description,
    engagementType: template.engagement_type,
    roomSchema: template.room_schema as RoomSchema[],
    renderIntents: template.render_intents as Record<string, IntentDefaults>,
    blockGuidance: template.block_guidance,
    maskPatterns: template.mask_patterns,
    visibility: template.visibility,
    forkCount: template.fork_count,
    forkedFrom: template.forked_from,
    createdAt: template.created_at,
    updatedAt: template.updated_at,
  };

  return NextResponse.json({ template: transformed });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { supabase, user } = auth.context;
  const userId = user.id;

  const { templateId } = await params;

  // Get template and verify ownership
  const { data: template, error: fetchErr } = await supabase
    .from("render_templates")
    .select("owner_id")
    .eq("id", templateId)
    .single();

  if (fetchErr || !template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  if (template.owner_id !== userId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.name !== undefined) updates.name = body.name;
  if (body.description !== undefined) updates.description = body.description;
  if (body.engagementType !== undefined) updates.engagement_type = body.engagementType;
  if (body.roomSchema !== undefined) updates.room_schema = body.roomSchema;
  if (body.renderIntents !== undefined) updates.render_intents = body.renderIntents;
  if (body.blockGuidance !== undefined) updates.block_guidance = body.blockGuidance;
  if (body.maskPatterns !== undefined) updates.mask_patterns = body.maskPatterns;
  if (body.visibility !== undefined) updates.visibility = body.visibility;

  updates.updated_at = new Date().toISOString();

  const { data: updated, error: updateErr } = await supabase
    .from("render_templates")
    .update(updates)
    .eq("id", templateId)
    .select()
    .single();

  if (updateErr) {
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }

  return NextResponse.json({
    template: {
      id: updated.id,
      ownerId: updated.owner_id,
      name: updated.name,
      description: updated.description,
      engagementType: updated.engagement_type,
      roomSchema: updated.room_schema,
      renderIntents: updated.render_intents,
      visibility: updated.visibility,
      updatedAt: updated.updated_at,
    },
  });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { supabase, user } = auth.context;
  const userId = user.id;

  const { templateId } = await params;

  // Get template and verify ownership
  const { data: template, error: fetchErr } = await supabase
    .from("render_templates")
    .select("owner_id")
    .eq("id", templateId)
    .single();

  if (fetchErr || !template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  if (template.owner_id !== userId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { error } = await supabase
    .from("render_templates")
    .delete()
    .eq("id", templateId);

  if (error) {
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
