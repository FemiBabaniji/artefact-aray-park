// ════════════════════════════════════════════════════════════════════════════
// Ingestion Queue API
// GET /api/engagements/[id]/ingestion - List queue items
// POST /api/engagements/[id]/ingestion - Add item to queue
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";

type Params = {
  params: Promise<{ id: string }>;
};

// GET: List ingestion queue items
export async function GET(request: NextRequest, { params }: Params) {
  const { id: engagementId } = await params;
  const status = request.nextUrl.searchParams.get("status");
  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "50");

  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { supabase } = auth.context;

  let query = supabase
    .from("ingestion_queue")
    .select("*")
    .eq("engagement_id", engagementId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch ingestion queue:", error);
    return NextResponse.json({ error: "Failed to fetch queue" }, { status: 500 });
  }

  const items = (data || []).map((row) => ({
    id: row.id,
    sourceType: row.source_type,
    sourceId: row.source_id,
    sourceData: row.source_data || {},
    suggestedRoom: row.suggested_room,
    suggestedBlock: row.suggested_block,
    summary: row.summary,
    status: row.status,
    processedAt: row.processed_at,
    processedBy: row.processed_by,
    createdAt: row.created_at,
  }));

  return NextResponse.json({ items });
}

// POST: Add item to ingestion queue
export async function POST(request: NextRequest, { params }: Params) {
  const { id: engagementId } = await params;

  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { supabase } = auth.context;

  let body: {
    integrationId?: string;
    sourceType?: string;
    sourceId?: string;
    sourceData?: Record<string, unknown>;
    suggestedRoom?: string;
    suggestedBlock?: Record<string, unknown>;
    summary?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { integrationId, sourceType, sourceId, sourceData, suggestedRoom, suggestedBlock, summary } = body;

  if (!sourceType || !sourceId) {
    return NextResponse.json({ error: "sourceType and sourceId are required" }, { status: 400 });
  }

  const validTypes = ["email", "meeting", "slack", "discord"];
  if (!validTypes.includes(sourceType)) {
    return NextResponse.json({ error: `sourceType must be one of: ${validTypes.join(", ")}` }, { status: 400 });
  }

  // Map source type to integration type
  const sourceToIntegrationType: Record<string, string> = {
    email: "gmail", // Default to gmail for email
    meeting: "meeting",
    slack: "slack",
    discord: "discord",
  };

  // Get or create a default integration if not provided
  let finalIntegrationId = integrationId;
  if (!finalIntegrationId) {
    // Try to find existing integration for this source type
    const integrationType = sourceToIntegrationType[sourceType] || sourceType;

    // Try gmail first, then outlook for email
    let existingIntegration;
    if (sourceType === "email") {
      const { data: gmailInt } = await supabase
        .from("engagement_integrations")
        .select("id")
        .eq("engagement_id", engagementId)
        .eq("integration_type", "gmail")
        .single();

      if (gmailInt) {
        existingIntegration = gmailInt;
      } else {
        const { data: outlookInt } = await supabase
          .from("engagement_integrations")
          .select("id")
          .eq("engagement_id", engagementId)
          .eq("integration_type", "outlook")
          .single();
        existingIntegration = outlookInt;
      }
    } else {
      const { data } = await supabase
        .from("engagement_integrations")
        .select("id")
        .eq("engagement_id", engagementId)
        .eq("integration_type", integrationType)
        .single();
      existingIntegration = data;
    }

    if (existingIntegration) {
      finalIntegrationId = existingIntegration.id;
    } else {
      // Create a default integration
      const newIntegrationType = sourceToIntegrationType[sourceType] || sourceType;
      const { data: newIntegration } = await supabase
        .from("engagement_integrations")
        .insert({
          engagement_id: engagementId,
          integration_type: newIntegrationType,
          is_enabled: true,
          auto_ingest: false,
        })
        .select("id")
        .single();

      if (newIntegration) {
        finalIntegrationId = newIntegration.id;
      }
    }
  }

  if (!finalIntegrationId) {
    return NextResponse.json({ error: "Failed to resolve integration" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("ingestion_queue")
    .insert({
      engagement_id: engagementId,
      integration_id: finalIntegrationId,
      source_type: sourceType,
      source_id: sourceId,
      source_data: sourceData || {},
      suggested_room: suggestedRoom,
      suggested_block: suggestedBlock,
      summary,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    // Check for duplicate
    if (error.code === "23505") {
      return NextResponse.json({ error: "Item already exists in queue" }, { status: 409 });
    }
    console.error("Failed to add to queue:", error);
    return NextResponse.json({ error: "Failed to add to queue" }, { status: 500 });
  }

  return NextResponse.json({
    item: {
      id: data.id,
      sourceType: data.source_type,
      sourceId: data.source_id,
      status: data.status,
      createdAt: data.created_at,
    },
  }, { status: 201 });
}
