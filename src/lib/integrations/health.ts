// ════════════════════════════════════════════════════════════════════════════
// Connection Health Checks
// Monitors and validates integration connection health via Composio
// ════════════════════════════════════════════════════════════════════════════

import { SupabaseClient } from "@supabase/supabase-js";
import { getConnectionStatus } from "@/lib/composio/client";

// ── Types ────────────────────────────────────────────────────────────────────

export interface HealthCheckResult {
  healthy: boolean;
  error?: string;
  status?: string;
  checkedAt: string;
}

export interface BatchHealthCheckResult {
  checked: number;
  healthy: number;
  unhealthy: number;
  errors: string[];
}

interface IntegrationSettings {
  connectionStatus?: string;
  composioAccountId?: string;
  healthStatus?: string;
  healthError?: string;
  lastHealthCheck?: string;
  [key: string]: unknown;
}

// ── Single Connection Health Check ───────────────────────────────────────────

/**
 * Check the health of a single integration connection
 *
 * @param supabase - Supabase client instance
 * @param integrationId - The ID of the integration to check
 * @returns Health check result with status and any errors
 */
export async function checkConnectionHealth(
  supabase: SupabaseClient,
  integrationId: string
): Promise<HealthCheckResult> {
  const checkedAt = new Date().toISOString();

  try {
    // Fetch the integration
    const { data: integration, error: fetchError } = await supabase
      .from("engagement_integrations")
      .select("id, settings, credentials, is_enabled")
      .eq("id", integrationId)
      .single();

    if (fetchError || !integration) {
      return {
        healthy: false,
        error: "Integration not found",
        checkedAt,
      };
    }

    // Skip disabled integrations
    if (!integration.is_enabled) {
      return {
        healthy: true,
        status: "disabled",
        checkedAt,
      };
    }

    // Get Composio account ID
    const settings = integration.settings as IntegrationSettings | null;
    let composioAccountId = settings?.composioAccountId;

    // Try parsing credentials if no account ID in settings
    if (!composioAccountId && integration.credentials) {
      try {
        const creds =
          typeof integration.credentials === "string"
            ? JSON.parse(integration.credentials)
            : integration.credentials;
        composioAccountId = creds.composioAccountId;
      } catch {
        // Ignore parse errors
      }
    }

    if (!composioAccountId) {
      const result: HealthCheckResult = {
        healthy: false,
        error: "No Composio account ID found",
        checkedAt,
      };

      // Update integration with health status
      await updateHealthStatus(supabase, integrationId, settings, result);

      return result;
    }

    // Check connection status via Composio
    const connectionStatus = await getConnectionStatus(composioAccountId);

    const result: HealthCheckResult = {
      healthy: connectionStatus.isConnected,
      status: connectionStatus.status,
      error: connectionStatus.isConnected
        ? undefined
        : `Connection inactive: ${connectionStatus.status}`,
      checkedAt,
    };

    // Update integration with health status
    await updateHealthStatus(supabase, integrationId, settings, result);

    return result;
  } catch (error) {
    const result: HealthCheckResult = {
      healthy: false,
      error: error instanceof Error ? error.message : "Health check failed",
      checkedAt,
    };

    // Try to update health status even on error
    try {
      const { data: integration } = await supabase
        .from("engagement_integrations")
        .select("settings")
        .eq("id", integrationId)
        .single();

      if (integration) {
        await updateHealthStatus(
          supabase,
          integrationId,
          integration.settings as IntegrationSettings,
          result
        );
      }
    } catch {
      // Ignore update errors during error handling
    }

    return result;
  }
}

/**
 * Update the health status in integration settings
 */
async function updateHealthStatus(
  supabase: SupabaseClient,
  integrationId: string,
  currentSettings: IntegrationSettings | null,
  result: HealthCheckResult
): Promise<void> {
  const updatedSettings: IntegrationSettings = {
    ...currentSettings,
    healthStatus: result.healthy ? "healthy" : "unhealthy",
    healthError: result.error,
    lastHealthCheck: result.checkedAt,
    connectionStatus: result.healthy ? "connected" : "error",
  };

  await supabase
    .from("engagement_integrations")
    .update({
      settings: updatedSettings,
      updated_at: result.checkedAt,
    })
    .eq("id", integrationId);
}

// ── Batch Health Check ───────────────────────────────────────────────────────

/**
 * Check the health of all enabled integrations
 *
 * @param supabase - Supabase client instance
 * @param options - Optional configuration
 * @returns Summary of health check results
 */
export async function checkAllConnections(
  supabase: SupabaseClient,
  options?: {
    /** Only check integrations not checked in this many minutes */
    staleMinutes?: number;
    /** Maximum number of integrations to check */
    limit?: number;
  }
): Promise<BatchHealthCheckResult> {
  const staleMinutes = options?.staleMinutes || 60;
  const limit = options?.limit || 100;

  // Find integrations to check
  const cutoff = new Date(Date.now() - staleMinutes * 60 * 1000).toISOString();

  // Query for enabled integrations that haven't been checked recently
  // We check settings->lastHealthCheck or fall back to updated_at
  const { data: integrations, error } = await supabase
    .from("engagement_integrations")
    .select("id, settings")
    .eq("is_enabled", true)
    .limit(limit);

  if (error || !integrations) {
    return {
      checked: 0,
      healthy: 0,
      unhealthy: 0,
      errors: [error?.message || "Failed to fetch integrations"],
    };
  }

  // Filter to integrations that need checking
  const needsCheck = integrations.filter((integration) => {
    const settings = integration.settings as IntegrationSettings | null;
    const lastCheck = settings?.lastHealthCheck;

    if (!lastCheck) return true;

    return new Date(lastCheck) < new Date(cutoff);
  });

  // Check each integration
  let healthy = 0;
  let unhealthy = 0;
  const errors: string[] = [];

  for (const integration of needsCheck) {
    try {
      const result = await checkConnectionHealth(supabase, integration.id);

      if (result.healthy) {
        healthy++;
      } else {
        unhealthy++;
        if (result.error) {
          errors.push(`${integration.id}: ${result.error}`);
        }
      }
    } catch (error) {
      unhealthy++;
      errors.push(
        `${integration.id}: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  return {
    checked: needsCheck.length,
    healthy,
    unhealthy,
    errors,
  };
}

/**
 * Get integrations that are currently unhealthy
 */
export async function getUnhealthyIntegrations(
  supabase: SupabaseClient
): Promise<
  Array<{
    id: string;
    engagementId: string;
    integrationType: string;
    error: string;
    lastCheck: string;
  }>
> {
  // Query integrations with unhealthy status in settings
  const { data: integrations, error } = await supabase
    .from("engagement_integrations")
    .select("id, engagement_id, integration_type, settings")
    .eq("is_enabled", true)
    .filter("settings->healthStatus", "eq", "unhealthy");

  if (error || !integrations) {
    return [];
  }

  return integrations.map((integration) => {
    const settings = integration.settings as IntegrationSettings;
    return {
      id: integration.id,
      engagementId: integration.engagement_id,
      integrationType: integration.integration_type,
      error: settings?.healthError || "Unknown error",
      lastCheck: settings?.lastHealthCheck || "Never",
    };
  });
}
