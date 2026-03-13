// ════════════════════════════════════════════════════════════════════════════
// Cron Sync Integrations Route
// GET /api/cron/sync-integrations
// Syncs all active integrations (called by Vercel Cron or external scheduler)
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getDemoAdminClient } from "@/lib/supabase/admin";
import { syncAllIntegrations } from "@/lib/integrations/sync";

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
  const maxAge = parseInt(searchParams.get("maxAge") || "15", 10);
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  // Run batch sync
  const result = await syncAllIntegrations(supabase, { maxAge, limit });

  return NextResponse.json({
    success: true,
    stats: {
      synced: result.synced,
      errors: result.errors,
      total: result.results.length,
    },
    results: result.results.map((r) => ({
      integrationId: r.integrationId,
      success: r.result.success,
      itemsFound: r.result.itemsFound,
      itemsQueued: r.result.itemsQueued,
      itemsAutoIngested: r.result.itemsAutoIngested,
      errors: r.result.errors,
    })),
  });
}

// Also support POST for external schedulers
export async function POST(request: NextRequest) {
  return GET(request);
}
