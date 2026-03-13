// ════════════════════════════════════════════════════════════════════════════
// Individual Integration API
// GET /api/engagements/[id]/integrations/[integrationId] - Get integration
// PATCH /api/engagements/[id]/integrations/[integrationId] - Update integration
// DELETE /api/engagements/[id]/integrations/[integrationId] - Delete integration
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";

type Params = {
  params: Promise<{ id: string; integrationId: string }>;
};

// GET: Get single integration
export async function GET(request: NextRequest, { params }: Params) {
  const { id: engagementId, integrationId } = await params;

  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { supabase } = auth.context;

  const { data, error } = await supabase
    .from("engagement_integrations")
    .select("*")
    .eq("id", integrationId)
    .eq("engagement_id", engagementId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Integration not found" }, { status: 404 });
  }

  return NextResponse.json({
    integration: {
      id: data.id,
      type: data.integration_type,
      isEnabled: data.is_enabled,
      autoIngest: data.auto_ingest,
      clientDomains: data.client_domains || [],
      settings: data.settings || {},
      lastSyncAt: data.last_sync_at,
      createdAt: data.created_at,
    },
  });
}

// PATCH: Update integration
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id: engagementId, integrationId } = await params;

  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { supabase } = auth.context;

  let body: {
    isEnabled?: boolean;
    autoIngest?: boolean;
    clientDomains?: string[];
    settings?: Record<string, unknown>;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Build update object
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.isEnabled !== undefined) updates.is_enabled = body.isEnabled;
  if (body.autoIngest !== undefined) updates.auto_ingest = body.autoIngest;
  if (body.clientDomains !== undefined) updates.client_domains = body.clientDomains;
  if (body.settings !== undefined) updates.settings = body.settings;

  const { data, error } = await supabase
    .from("engagement_integrations")
    .update(updates)
    .eq("id", integrationId)
    .eq("engagement_id", engagementId)
    .select()
    .single();

  if (error) {
    console.error("Failed to update integration:", error);
    return NextResponse.json({ error: "Failed to update integration" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Integration not found" }, { status: 404 });
  }

  return NextResponse.json({
    integration: {
      id: data.id,
      type: data.integration_type,
      isEnabled: data.is_enabled,
      autoIngest: data.auto_ingest,
      clientDomains: data.client_domains || [],
      settings: data.settings || {},
      lastSyncAt: data.last_sync_at,
      updatedAt: data.updated_at,
    },
  });
}

// DELETE: Remove integration
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id: engagementId, integrationId } = await params;

  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { supabase } = auth.context;

  const { error } = await supabase
    .from("engagement_integrations")
    .delete()
    .eq("id", integrationId)
    .eq("engagement_id", engagementId);

  if (error) {
    console.error("Failed to delete integration:", error);
    return NextResponse.json({ error: "Failed to delete integration" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
