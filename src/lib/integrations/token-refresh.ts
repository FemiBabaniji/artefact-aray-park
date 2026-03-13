// ════════════════════════════════════════════════════════════════════════════
// Token Refresh Utility
// Handles automatic token refresh before expiry
// ════════════════════════════════════════════════════════════════════════════

import { SupabaseClient } from "@supabase/supabase-js";
import { decryptCredentials, encryptCredentials, type OAuthCredentials } from "./crypto";
import { refreshAccessToken, INTEGRATION_TO_PROVIDER } from "./providers";
import type { IntegrationRow, IntegrationProvider } from "@/types/integration";

// Refresh token if it expires within this many seconds
const REFRESH_THRESHOLD_SECONDS = 300; // 5 minutes

export type TokenRefreshResult = {
  success: boolean;
  credentials?: OAuthCredentials;
  error?: string;
  wasRefreshed: boolean;
};

/**
 * Get valid credentials for an integration, refreshing if needed
 */
export async function getValidCredentials(
  supabase: SupabaseClient,
  integration: IntegrationRow
): Promise<TokenRefreshResult> {
  // Check if credentials exist
  if (!integration.credentials) {
    return {
      success: false,
      error: "No credentials stored",
      wasRefreshed: false,
    };
  }

  // Decrypt credentials
  let credentials: OAuthCredentials;
  try {
    credentials = decryptCredentials(integration.credentials);
  } catch (error) {
    return {
      success: false,
      error: "Failed to decrypt credentials",
      wasRefreshed: false,
    };
  }

  // Check if token is still valid
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = credentials.expiresAt - now;

  if (expiresIn > REFRESH_THRESHOLD_SECONDS) {
    // Token still valid
    return {
      success: true,
      credentials,
      wasRefreshed: false,
    };
  }

  // Token needs refresh
  if (!credentials.refreshToken) {
    return {
      success: false,
      error: "Token expired and no refresh token available",
      wasRefreshed: false,
    };
  }

  // Get provider from integration type
  const provider = INTEGRATION_TO_PROVIDER[integration.integration_type as IntegrationProvider];
  if (!provider) {
    return {
      success: false,
      error: `Unknown provider for type: ${integration.integration_type}`,
      wasRefreshed: false,
    };
  }

  // Refresh the token
  const refreshResult = await refreshAccessToken(provider, credentials.refreshToken);
  if (!refreshResult) {
    // Mark integration as error
    await updateIntegrationError(
      supabase,
      integration.id,
      "Token refresh failed - reconnection required"
    );

    return {
      success: false,
      error: "Token refresh failed",
      wasRefreshed: false,
    };
  }

  // Update credentials with new tokens
  const updatedCredentials: OAuthCredentials = {
    ...credentials,
    accessToken: refreshResult.accessToken,
    // Some providers return a new refresh token
    refreshToken: refreshResult.refreshToken || credentials.refreshToken,
    expiresAt: refreshResult.expiresIn
      ? Math.floor(Date.now() / 1000) + refreshResult.expiresIn
      : Math.floor(Date.now() / 1000) + 3600,
  };

  // Encrypt and save new credentials
  const encryptedCredentials = encryptCredentials(updatedCredentials);

  const { error: updateError } = await supabase
    .from("engagement_integrations")
    .update({
      credentials: encryptedCredentials,
      updated_at: new Date().toISOString(),
    })
    .eq("id", integration.id);

  if (updateError) {
    console.error("Failed to save refreshed credentials:", updateError);
    // Still return success since we have valid credentials in memory
  }

  return {
    success: true,
    credentials: updatedCredentials,
    wasRefreshed: true,
  };
}

/**
 * Update integration with error status
 */
async function updateIntegrationError(
  supabase: SupabaseClient,
  integrationId: string,
  errorMessage: string
): Promise<void> {
  await supabase
    .from("engagement_integrations")
    .update({
      settings: {
        connectionStatus: "error",
        lastError: errorMessage,
        lastErrorAt: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", integrationId);
}

/**
 * Check if credentials need refresh without actually refreshing
 */
export function needsRefresh(credentials: OAuthCredentials): boolean {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = credentials.expiresAt - now;
  return expiresIn <= REFRESH_THRESHOLD_SECONDS;
}

/**
 * Check if credentials are expired
 */
export function isExpired(credentials: OAuthCredentials): boolean {
  const now = Math.floor(Date.now() / 1000);
  return credentials.expiresAt <= now;
}
