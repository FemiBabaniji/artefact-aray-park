// ════════════════════════════════════════════════════════════════════════════
// Manual Sync API Route
// POST /api/engagements/[id]/integrations/[integrationId]/sync
// Triggers a sync for a specific integration
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { syncIntegration } from "@/lib/integrations/sync";

type Params = {
  params: Promise<{ id: string; integrationId: string }>;
};

export async function POST(request: NextRequest, { params }: Params) {
  const { id: engagementId, integrationId } = await params;

  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { supabase } = auth.context;

  // Verify integration exists and belongs to engagement
  const { data: integration, error: fetchError } = await supabase
    .from("engagement_integrations")
    .select("id, engagement_id, is_enabled, settings")
    .eq("id", integrationId)
    .eq("engagement_id", engagementId)
    .single();

  if (fetchError || !integration) {
    return NextResponse.json(
      { error: "Integration not found" },
      { status: 404 }
    );
  }

  if (!integration.is_enabled) {
    return NextResponse.json(
      { error: "Integration is disabled" },
      { status: 400 }
    );
  }

  // Check connection status
  const settings = integration.settings as { connectionStatus?: string };
  if (settings.connectionStatus !== "connected") {
    return NextResponse.json(
      { error: "Integration is not connected. Please reconnect." },
      { status: 400 }
    );
  }

  // Run sync
  const result = await syncIntegration(supabase, integrationId);

  return NextResponse.json({
    success: result.success,
    sync: {
      itemsFound: result.itemsFound,
      itemsQueued: result.itemsQueued,
      itemsAutoIngested: result.itemsAutoIngested,
      errors: result.errors,
      syncedAt: result.syncedAt,
    },
  });
}
