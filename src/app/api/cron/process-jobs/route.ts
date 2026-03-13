// ════════════════════════════════════════════════════════════════════════════
// Background Jobs Cron Endpoint
// GET /api/cron/process-jobs
// Processes pending background jobs (summarization, block creation)
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { processJobs } from "@/lib/jobs/processor";

// Create admin client for cron job
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing Supabase configuration");
  }

  return createClient(url, serviceKey);
}

// Verify cron secret
function verifyCronSecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // No secret configured, allow in dev
    return process.env.NODE_ENV === "development";
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }

  return authHeader.slice(7) === secret;
}

export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const supabase = getSupabaseAdmin();

    // Parse options from query params
    const { searchParams } = new URL(request.url);
    const maxJobs = parseInt(searchParams.get("maxJobs") || "20");
    const workerId = searchParams.get("workerId") || `cron-${Date.now()}`;

    // Process jobs
    const result = await processJobs(supabase, {
      maxJobs,
      workerId,
    });

    const duration = Date.now() - startTime;

    // Also cleanup stale processing jobs (locked for > 10 minutes)
    const staleTimeout = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    await supabase
      .from("background_jobs")
      .update({
        status: "pending",
        locked_at: null,
        locked_by: null,
        error_message: "Job processing timed out",
      })
      .eq("status", "processing")
      .lt("locked_at", staleTimeout);

    return NextResponse.json({
      success: true,
      processed: result.processed,
      succeeded: result.succeeded,
      failed: result.failed,
      errors: result.errors,
      durationMs: duration,
    });
  } catch (error) {
    console.error("Job processing error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        durationMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

// Also support POST for Vercel Cron
export async function POST(request: NextRequest) {
  return GET(request);
}
