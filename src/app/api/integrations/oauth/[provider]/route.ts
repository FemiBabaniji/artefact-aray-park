// ════════════════════════════════════════════════════════════════════════════
// OAuth Initiation Route (Composio)
// GET /api/integrations/oauth/[provider]?engagementId=...&returnUrl=...
// Initiates OAuth via Composio's managed authentication
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getDemoAdminClient } from "@/lib/supabase/admin";
import { initiateConnection, INTEGRATION_TO_TOOLKIT } from "@/lib/composio/client";
import type { IntegrationProvider } from "@/types/integration";

type Params = {
  params: Promise<{ provider: string }>;
};

const VALID_PROVIDERS = ["gmail", "outlook", "slack", "discord", "zoom", "meetings"];

export async function GET(request: NextRequest, { params }: Params) {
  const { provider } = await params;

  // Normalize provider name
  const normalizedProvider = provider === "meetings" ? "zoom" : provider;

  // Validate provider
  if (!VALID_PROVIDERS.includes(provider)) {
    return NextResponse.json(
      { error: `Invalid provider: ${provider}` },
      { status: 400 }
    );
  }

  // Check if Composio is configured
  if (!process.env.COMPOSIO_API_KEY) {
    return NextResponse.json(
      { error: "Composio API key not configured" },
      { status: 503 }
    );
  }

  // Get query params
  const { searchParams } = new URL(request.url);
  const engagementId = searchParams.get("engagementId");
  const returnUrl = searchParams.get("returnUrl") || "/practice";
  const integrationId = searchParams.get("integrationId");

  if (!engagementId) {
    return NextResponse.json(
      { error: "engagementId is required" },
      { status: 400 }
    );
  }

  // Verify engagement exists and get user
  const supabase = getDemoAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  const { data: engagement, error: engagementError } = await supabase
    .from("engagements")
    .select("id, slug, owner_id")
    .eq("id", engagementId)
    .single();

  if (engagementError || !engagement) {
    return NextResponse.json(
      { error: "Engagement not found" },
      { status: 404 }
    );
  }

  // Get or create integration record
  let finalIntegrationId = integrationId;
  const integrationType = (provider === "meetings" ? "meetings" : provider) as IntegrationProvider;

  if (!finalIntegrationId) {
    // Check if integration already exists
    const { data: existing } = await supabase
      .from("engagement_integrations")
      .select("id")
      .eq("engagement_id", engagementId)
      .eq("integration_type", integrationType)
      .single();

    if (existing) {
      finalIntegrationId = existing.id;
    } else {
      // Create new integration record in pending state
      const { data: created, error: createError } = await supabase
        .from("engagement_integrations")
        .insert({
          engagement_id: engagementId,
          integration_type: integrationType,
          is_enabled: false,
          settings: { connectionStatus: "pending" },
        })
        .select("id")
        .single();

      if (createError) {
        console.error("Failed to create integration:", createError);
        return NextResponse.json(
          { error: "Failed to create integration record" },
          { status: 500 }
        );
      }

      finalIntegrationId = created.id;
    }
  }

  // At this point finalIntegrationId should always be defined
  if (!finalIntegrationId) {
    return NextResponse.json(
      { error: "Failed to resolve integration ID" },
      { status: 500 }
    );
  }

  // Update integration to pending status
  await supabase
    .from("engagement_integrations")
    .update({
      settings: { connectionStatus: "pending" },
    })
    .eq("id", finalIntegrationId);

  // Build callback URL with state info
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const callbackUrl = new URL("/api/integrations/composio/callback", baseUrl);
  callbackUrl.searchParams.set("engagementId", engagementId);
  callbackUrl.searchParams.set("integrationId", finalIntegrationId);
  callbackUrl.searchParams.set("returnUrl", returnUrl);

  // Get Composio toolkit slug
  const toolkit = INTEGRATION_TO_TOOLKIT[normalizedProvider];
  if (!toolkit) {
    return NextResponse.json(
      { error: `No toolkit mapping for provider: ${provider}` },
      { status: 400 }
    );
  }

  // Initiate Composio connection
  // Use engagement owner as user_id for Composio
  const userId = engagement.owner_id || engagementId;

  const result = await initiateConnection({
    userId,
    toolkit,
    callbackUrl: callbackUrl.toString(),
    engagementId,
    integrationId: finalIntegrationId,
  });

  if (!result.success || !result.redirectUrl) {
    // Update integration status to error
    await supabase
      .from("engagement_integrations")
      .update({
        settings: {
          connectionStatus: "error",
          error: result.error || "Failed to initiate connection",
        },
      })
      .eq("id", finalIntegrationId);

    return NextResponse.json(
      { error: result.error || "Failed to initiate OAuth connection" },
      { status: 500 }
    );
  }

  // Store Composio connected account ID for later use
  if (result.connectedAccountId) {
    await supabase
      .from("engagement_integrations")
      .update({
        settings: {
          connectionStatus: "pending",
          composioAccountId: result.connectedAccountId,
        },
      })
      .eq("id", finalIntegrationId);
  }

  // Redirect to Composio OAuth flow
  return NextResponse.redirect(result.redirectUrl);
}
