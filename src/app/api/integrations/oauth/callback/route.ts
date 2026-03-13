// ════════════════════════════════════════════════════════════════════════════
// OAuth Callback Handler (DEPRECATED - use Composio callback instead)
// GET /api/integrations/oauth/callback?code=...&state=...
// This route is kept for backwards compatibility but is no longer used.
// New integrations use: /api/integrations/composio/callback
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getDemoAdminClient } from "@/lib/supabase/admin";
import { verifyOAuthState, encryptCredentials } from "@/lib/integrations/crypto";
import {
  exchangeCodeForTokens,
  fetchUserInfo,
} from "@/lib/integrations/providers";
import type { OAuthCredentials } from "@/lib/integrations/crypto";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle OAuth errors from provider
  if (error) {
    console.error(`OAuth error: ${error} - ${errorDescription}`);
    // Redirect with error
    const returnUrl = "/practice";
    return NextResponse.redirect(
      `${getBaseUrl(request)}${returnUrl}?error=oauth_failed&message=${encodeURIComponent(errorDescription || error)}`
    );
  }

  // Validate required params
  if (!code || !state) {
    return NextResponse.json(
      { error: "Missing code or state parameter" },
      { status: 400 }
    );
  }

  // Verify and decode state
  const statePayload = verifyOAuthState(state);
  if (!statePayload) {
    return NextResponse.json(
      { error: "Invalid or expired state parameter" },
      { status: 400 }
    );
  }

  const { provider, engagementId, integrationId, returnUrl } = statePayload;

  // Get database client
  const supabase = getDemoAdminClient();
  if (!supabase) {
    return redirectWithError(request, returnUrl, "Database not configured");
  }

  // Exchange code for tokens
  const tokens = await exchangeCodeForTokens(provider, code);
  if (!tokens) {
    // Update integration status to error
    if (integrationId) {
      await supabase
        .from("engagement_integrations")
        .update({
          settings: {
            connectionStatus: "error",
            lastError: "Failed to exchange authorization code",
            lastErrorAt: new Date().toISOString(),
          },
        })
        .eq("id", integrationId);
    }
    return redirectWithError(request, returnUrl, "Failed to exchange authorization code");
  }

  // Fetch user info
  const userInfo = await fetchUserInfo(provider, tokens.accessToken);

  // Calculate token expiration
  const expiresAt = tokens.expiresIn
    ? Math.floor(Date.now() / 1000) + tokens.expiresIn
    : Math.floor(Date.now() / 1000) + 3600; // Default 1 hour

  // Build credentials object
  const credentials: OAuthCredentials = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt,
    scopes: tokens.scope?.split(/[\s,]+/) || [],
    tokenType: tokens.tokenType,
    userInfo: userInfo || undefined,
  };

  // Encrypt credentials
  const encryptedCredentials = encryptCredentials(credentials);

  // Update integration record
  const updateData = {
    credentials: encryptedCredentials,
    is_enabled: true,
    settings: {
      connectionStatus: "connected",
      connectedEmail: userInfo?.email,
      connectedName: userInfo?.name,
      connectedAt: new Date().toISOString(),
    },
    updated_at: new Date().toISOString(),
  };

  if (integrationId) {
    const { error: updateError } = await supabase
      .from("engagement_integrations")
      .update(updateData)
      .eq("id", integrationId);

    if (updateError) {
      console.error("Failed to update integration:", updateError);
      return redirectWithError(request, returnUrl, "Failed to save connection");
    }
  } else {
    // This shouldn't happen, but handle it
    console.error("No integration ID in state");
    return redirectWithError(request, returnUrl, "Invalid OAuth state");
  }

  // Log successful connection event
  try {
    await supabase.rpc("insert_engagement_event", {
      p_engagement_id: engagementId,
      p_event_type: "integration_connected",
      p_payload: {
        integrationId,
        provider,
        connectedEmail: userInfo?.email,
      },
      p_actor_id: null,
      p_actor_type: "user",
    });
  } catch (e) {
    // Non-critical, don't fail the whole flow
    console.error("Failed to log integration event:", e);
  }

  // Redirect back to the return URL with success
  const successUrl = new URL(returnUrl, getBaseUrl(request));
  successUrl.searchParams.set("integration_connected", provider);

  return NextResponse.redirect(successUrl.toString());
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

function redirectWithError(
  request: NextRequest,
  returnUrl: string,
  message: string
): NextResponse {
  const errorUrl = new URL(returnUrl || "/practice", getBaseUrl(request));
  errorUrl.searchParams.set("error", "oauth_failed");
  errorUrl.searchParams.set("message", message);
  return NextResponse.redirect(errorUrl.toString());
}
