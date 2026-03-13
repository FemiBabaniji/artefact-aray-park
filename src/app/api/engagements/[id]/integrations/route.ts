// ════════════════════════════════════════════════════════════════════════════
// Engagement Integrations API
// GET /api/engagements/[id]/integrations - List integrations
// POST /api/engagements/[id]/integrations - Create integration
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";

type Params = {
  params: Promise<{ id: string }>;
};

// GET: List integrations for engagement
export async function GET(request: NextRequest, { params }: Params) {
  const { id: engagementId } = await params;

  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { supabase } = auth.context;

  const { data, error } = await supabase
    .from("engagement_integrations")
    .select("*")
    .eq("engagement_id", engagementId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch integrations:", error);
    return NextResponse.json({ error: "Failed to fetch integrations" }, { status: 500 });
  }

  const integrations = (data || []).map((row) => ({
    id: row.id,
    type: row.integration_type,
    isEnabled: row.is_enabled,
    autoIngest: row.auto_ingest,
    clientDomains: row.client_domains || [],
    settings: row.settings || {},
    lastSyncAt: row.last_sync_at,
    createdAt: row.created_at,
  }));

  return NextResponse.json({ integrations });
}

// POST: Create new integration
export async function POST(request: NextRequest, { params }: Params) {
  const { id: engagementId } = await params;

  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { supabase } = auth.context;

  let body: {
    type?: string;
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

  const { type, isEnabled = true, autoIngest = false, clientDomains = [], settings = {} } = body;

  if (!type) {
    return NextResponse.json({ error: "type is required" }, { status: 400 });
  }

  const validTypes = ["gmail", "outlook", "slack", "discord", "meeting"];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: `type must be one of: ${validTypes.join(", ")}` }, { status: 400 });
  }

  // Check if integration already exists
  const { data: existing } = await supabase
    .from("engagement_integrations")
    .select("id")
    .eq("engagement_id", engagementId)
    .eq("integration_type", type)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Integration already exists" }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("engagement_integrations")
    .insert({
      engagement_id: engagementId,
      integration_type: type,
      is_enabled: isEnabled,
      auto_ingest: autoIngest,
      client_domains: clientDomains,
      settings,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create integration:", error);
    return NextResponse.json({ error: "Failed to create integration" }, { status: 500 });
  }

  return NextResponse.json({
    integration: {
      id: data.id,
      type: data.integration_type,
      isEnabled: data.is_enabled,
      autoIngest: data.auto_ingest,
      clientDomains: data.client_domains || [],
      settings: data.settings || {},
      createdAt: data.created_at,
    },
  }, { status: 201 });
}
