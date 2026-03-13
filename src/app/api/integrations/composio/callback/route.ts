// ════════════════════════════════════════════════════════════════════════════
// Composio OAuth Callback Route
// GET /api/integrations/composio/callback
// Handles the OAuth callback from Composio and updates the integration status
// Sets up real-time webhook triggers for automatic data sync
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getConnectionStatus, setupIntegrationTriggers } from "@/lib/composio/client";

// Use admin client for callback (no user session during OAuth redirect)
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Get state params we passed in the callback URL
  const engagementId = searchParams.get("engagementId");
  const integrationId = searchParams.get("integrationId");
  const returnUrl = searchParams.get("returnUrl") || "/practice";

  // Composio may pass additional params
  const status = searchParams.get("status"); // success or error
  const error = searchParams.get("error");
  const connectedAccountId = searchParams.get("connected_account_id");

  if (!engagementId || !integrationId) {
    return NextResponse.redirect(
      `${returnUrl}?error=missing_state_params`
    );
  }

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.redirect(
      `${returnUrl}?error=database_error`
    );
  }

  // Handle error from Composio
  if (status === "error" || error) {
    await supabase
      .from("engagement_integrations")
      .update({
        settings: {
          connectionStatus: "error",
          error: error || "OAuth failed",
        },
        is_enabled: false,
      })
      .eq("id", integrationId);

    return NextResponse.redirect(
      `${returnUrl}?error=oauth_failed&message=${encodeURIComponent(error || "OAuth failed")}`
    );
  }

  // Get the integration record to retrieve composioAccountId
  const { data: integration } = await supabase
    .from("engagement_integrations")
    .select("settings")
    .eq("id", integrationId)
    .single();

  const composioAccountIdFromSettings = (integration?.settings as Record<string, unknown>)?.composioAccountId as string | undefined;
  const finalComposioAccountId = connectedAccountId || composioAccountIdFromSettings;

  if (!finalComposioAccountId) {
    await supabase
      .from("engagement_integrations")
      .update({
        settings: {
          connectionStatus: "error",
          error: "No connected account ID returned",
        },
        is_enabled: false,
      })
      .eq("id", integrationId);

    return NextResponse.redirect(
      `${returnUrl}?error=no_account_id`
    );
  }

  // Verify connection status with Composio
  const connectionStatus = await getConnectionStatus(finalComposioAccountId);

  if (!connectionStatus.isConnected) {
    await supabase
      .from("engagement_integrations")
      .update({
        settings: {
          connectionStatus: "error",
          composioAccountId: finalComposioAccountId,
          error: `Connection not active: ${connectionStatus.status}`,
        },
        is_enabled: false,
      })
      .eq("id", integrationId);

    return NextResponse.redirect(
      `${returnUrl}?error=connection_not_active`
    );
  }

  // Get integration type for trigger setup
  const { data: integrationData } = await supabase
    .from("engagement_integrations")
    .select("integration_type, settings")
    .eq("id", integrationId)
    .single();

  const integrationType = integrationData?.integration_type || "unknown";
  const existingSettings = (integrationData?.settings || {}) as Record<string, unknown>;

  // Connection successful - update integration
  const { error: updateError } = await supabase
    .from("engagement_integrations")
    .update({
      // Store the Composio account ID as credentials (no encryption needed - Composio manages tokens)
      credentials: JSON.stringify({
        composioAccountId: finalComposioAccountId,
        provider: "composio",
      }),
      is_enabled: true,
      settings: {
        ...existingSettings,
        connectionStatus: "connected",
        composioAccountId: finalComposioAccountId,
        connectedAt: new Date().toISOString(),
        userEmail: connectionStatus.userInfo?.email,
        userName: connectionStatus.userInfo?.name,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", integrationId);

  if (updateError) {
    console.error("Failed to update integration:", updateError);
    return NextResponse.redirect(
      `${returnUrl}?error=database_update_failed`
    );
  }

  // Set up real-time webhook triggers for automatic sync
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhooks/composio`;

  try {
    const triggerResult = await setupIntegrationTriggers({
      connectedAccountId: finalComposioAccountId,
      integrationType,
      webhookUrl,
      config: {
        slackChannelIds: existingSettings.slackChannelIds as string[] | undefined,
        discordChannelIds: existingSettings.discordChannelIds as string[] | undefined,
      },
    });

    // Store trigger IDs in database for management
    for (const trigger of triggerResult.triggers) {
      if (trigger.triggerId) {
        await supabase.from("integration_triggers").upsert({
          integration_id: integrationId,
          trigger_id: trigger.triggerId,
          trigger_type: trigger.name,
          provider: integrationType,
          status: "active",
          config: {},
        }, {
          onConflict: "integration_id,trigger_type",
        });
      }
    }

    console.log(`Set up ${triggerResult.triggers.length} triggers for integration ${integrationId}`);
  } catch (triggerError) {
    // Log but don't fail - triggers are optional enhancement
    console.error("Failed to set up triggers:", triggerError);
  }

  // Log connection event
  try {
    const { data: engagement } = await supabase
      .from("engagements")
      .select("owner_id")
      .eq("id", engagementId)
      .single();

    if (engagement?.owner_id) {
      await supabase.rpc("insert_engagement_event", {
        p_engagement_id: engagementId,
        p_event_type: "integration_connected",
        p_payload: {
          integrationId,
          integrationType,
          provider: "composio",
          userEmail: connectionStatus.userInfo?.email,
          triggersEnabled: true,
        },
        p_actor_id: engagement.owner_id,
        p_actor_type: "user",
      });
    }
  } catch (e) {
    console.error("Failed to log connection event:", e);
  }

  // Redirect back to the return URL with success
  const redirectUrl = new URL(returnUrl, process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
  redirectUrl.searchParams.set("oauth", "success");
  redirectUrl.searchParams.set("integration", integrationId);

  return NextResponse.redirect(redirectUrl.toString());
}
