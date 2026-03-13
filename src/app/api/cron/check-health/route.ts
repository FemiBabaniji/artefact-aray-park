// ════════════════════════════════════════════════════════════════════════════
// Cron Health Check Route
// GET /api/cron/check-health
// Checks all integration connections and marks unhealthy ones
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getDemoAdminClient } from "@/lib/supabase/admin";
import { checkAllConnections, getUnhealthyIntegrations } from "@/lib/integrations/health";

export async function GET(request: NextRequest) {
  // Verify cron secret if configured
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("Authorization");
    const providedSecret = authHeader?.replace("Bearer ", "");

    if (providedSecret !== cronSecret) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
  }

  const supabase = getDemoAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  // Get optional params
  const { searchParams } = new URL(request.url);
  const staleMinutes = parseInt(searchParams.get("staleMinutes") || "60", 10);
  const limit = parseInt(searchParams.get("limit") || "100", 10);

  // Run health checks
  const result = await checkAllConnections(supabase, { staleMinutes, limit });

  // Get currently unhealthy integrations for reporting
  const unhealthyIntegrations = await getUnhealthyIntegrations(supabase);

  return NextResponse.json({
    success: true,
    stats: {
      checked: result.checked,
      healthy: result.healthy,
      unhealthy: result.unhealthy,
    },
    unhealthyIntegrations: unhealthyIntegrations.map((i) => ({
      id: i.id,
      engagementId: i.engagementId,
      type: i.integrationType,
      error: i.error,
      lastCheck: i.lastCheck,
    })),
    errors: result.errors.length > 0 ? result.errors : undefined,
    checkedAt: new Date().toISOString(),
  });
}

// Also support POST for external schedulers
export async function POST(request: NextRequest) {
  return GET(request);
}
