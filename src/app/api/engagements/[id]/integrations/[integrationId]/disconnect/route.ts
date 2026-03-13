// ════════════════════════════════════════════════════════════════════════════
// Disconnect Integration API Route (Composio)
// POST /api/engagements/[id]/integrations/[integrationId]/disconnect
// Disconnects the integration via Composio and cleans up triggers
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { disconnectAccount, removeIntegrationTriggers } from "@/lib/composio/client";

type Params = {
  params: Promise<{ id: string; integrationId: string }>;
};

export async function POST(request: NextRequest, { params }: Params) {
  const { id: engagementId, integrationId } = await params;

  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { user, supabase } = auth.context;

  // Fetch integration
  const { data: integration, error: fetchError } = await supabase
    .from("engagement_integrations")
    .select("*")
    .eq("id", integrationId)
    .eq("engagement_id", engagementId)
    .single();

  if (fetchError || !integration) {
    return NextResponse.json(
      { error: "Integration not found" },
      { status: 404 }
    );
  }

  // Try to disconnect via Composio
  const settings = integration.settings as { composioAccountId?: string };
  let composioAccountId = settings?.composioAccountId;

  // Also check credentials for composioAccountId
  if (!composioAccountId && integration.credentials) {
    try {
      const creds = typeof integration.credentials === "string"
        ? JSON.parse(integration.credentials)
        : integration.credentials;
      composioAccountId = creds.composioAccountId;
    } catch {
      // Ignore parse errors
    }
  }

  if (composioAccountId) {
    try {
      await disconnectAccount(composioAccountId);
    } catch (error) {
      // Log but don't fail - we still want to clear local data
      console.error("Failed to disconnect Composio account:", error);
    }
  }

  // Clean up webhook triggers
  try {
    const { data: triggers } = await supabase
      .from("integration_triggers")
      .select("trigger_id")
      .eq("integration_id", integrationId);

    if (triggers && triggers.length > 0) {
      const triggerIds = triggers.map((t) => t.trigger_id);
      await removeIntegrationTriggers(triggerIds);

      // Delete trigger records
      await supabase
        .from("integration_triggers")
        .delete()
        .eq("integration_id", integrationId);
    }
  } catch (error) {
    console.error("Failed to clean up triggers:", error);
  }

  // Clear credentials and update status
  const { error: updateError } = await supabase
    .from("engagement_integrations")
    .update({
      credentials: null,
      is_enabled: false,
      settings: {
        connectionStatus: "disconnected",
        disconnectedAt: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", integrationId);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to disconnect integration" },
      { status: 500 }
    );
  }

  // Log disconnection event
  try {
    await supabase.rpc("insert_engagement_event", {
      p_engagement_id: engagementId,
      p_event_type: "integration_disconnected",
      p_payload: {
        integrationId,
        integrationType: integration.integration_type,
      },
      p_actor_id: user.id,
      p_actor_type: "user",
    });
  } catch (e) {
    console.error("Failed to log disconnection event:", e);
  }

  return NextResponse.json({
    success: true,
    message: "Integration disconnected",
  });
}
