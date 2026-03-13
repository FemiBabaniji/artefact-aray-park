// ============================================================================
// Render Templates API
// GET /api/templates - List all templates (platform + user's own)
// POST /api/templates - Create or fork a template
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import type { RenderTemplate, RoomSchema, IntentDefaults } from "@/types/render";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { supabase, user } = auth.context;
  const userId = user.id;

  const { searchParams } = new URL(request.url);
  const engagementType = searchParams.get("engagementType");
  const visibility = searchParams.get("visibility"); // 'public', 'private', 'all'

  let query = supabase
    .from("render_templates")
    .select("*")
    .order("fork_count", { ascending: false });

  // Filter by visibility
  if (visibility === "public") {
    query = query.eq("visibility", "public");
  } else if (visibility === "private") {
    query = query.eq("owner_id", userId);
  } else {
    // Default: show public + user's own
    query = query.or(`visibility.eq.public,owner_id.eq.${userId}`);
  }

  // Filter by engagement type
  if (engagementType) {
    query = query.eq("engagement_type", engagementType);
  }

  const { data: templates, error } = await query;

  if (error) {
    console.error("Failed to fetch templates:", error);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }

  // Transform to camelCase
  const transformed: RenderTemplate[] = (templates || []).map((t) => ({
    id: t.id,
    ownerId: t.owner_id,
    practiceId: t.practice_id,
    name: t.name,
    slug: t.slug,
    description: t.description,
    engagementType: t.engagement_type,
    roomSchema: t.room_schema as RoomSchema[],
    renderIntents: t.render_intents as Record<string, IntentDefaults>,
    blockGuidance: t.block_guidance,
    maskPatterns: t.mask_patterns,
    visibility: t.visibility,
    forkCount: t.fork_count,
    forkedFrom: t.forked_from,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }));

  return NextResponse.json({ templates: transformed });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { supabase, user } = auth.context;
  const userId = user.id;

  const body = await request.json();
  const {
    name,
    description,
    engagementType,
    roomSchema,
    renderIntents,
    blockGuidance,
    maskPatterns,
    visibility = "private",
    forkedFrom,
  } = body as Partial<RenderTemplate> & { forkedFrom?: string };

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  // Generate slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    + "-" + Date.now().toString(36);

  const { data: template, error } = await supabase
    .from("render_templates")
    .insert({
      owner_id: userId,
      name,
      slug,
      description: description || null,
      engagement_type: engagementType || null,
      room_schema: roomSchema || [],
      render_intents: renderIntents || {},
      block_guidance: blockGuidance || {},
      mask_patterns: maskPatterns || {},
      visibility,
      forked_from: forkedFrom || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create template:", error);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }

  // Increment fork count on source template
  if (forkedFrom) {
    try {
      const { data: sourceTemplate } = await supabase
        .from("render_templates")
        .select("fork_count")
        .eq("id", forkedFrom)
        .single();

      if (sourceTemplate) {
        await supabase
          .from("render_templates")
          .update({ fork_count: (sourceTemplate.fork_count || 0) + 1 })
          .eq("id", forkedFrom);
      }
    } catch {
      // Best effort
    }
  }

  return NextResponse.json({
    template: {
      id: template.id,
      ownerId: template.owner_id,
      name: template.name,
      slug: template.slug,
      description: template.description,
      engagementType: template.engagement_type,
      roomSchema: template.room_schema,
      renderIntents: template.render_intents,
      visibility: template.visibility,
      forkCount: template.fork_count,
      forkedFrom: template.forked_from,
      createdAt: template.created_at,
    },
  });
}
