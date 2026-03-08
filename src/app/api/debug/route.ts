import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

// GET /api/debug - Check database state
export async function GET() {
  const client = getAdminClient();

  if (!client) {
    return NextResponse.json({
      error: "No admin client - check SUPABASE_SERVICE_ROLE_KEY",
      env: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        useSupabase: process.env.USE_SUPABASE,
      },
    });
  }

  const results: Record<string, unknown> = {};

  // Check if tables exist by querying them
  const tables = ["communities", "members", "artefacts", "sections", "programs"];

  for (const table of tables) {
    const { data, error, count } = await client
      .from(table)
      .select("*", { count: "exact", head: true });

    results[table] = {
      exists: !error || !error.message.includes("does not exist"),
      count: count ?? 0,
      error: error?.message,
    };
  }

  // Check the member_progress view
  const { data: progressData, error: progressError } = await client
    .from("member_progress")
    .select("*")
    .limit(1);

  results["member_progress_view"] = {
    exists: !progressError || !progressError.message.includes("does not exist"),
    error: progressError?.message,
    sample: progressData?.[0],
  };

  // Try to get actual members data
  const { data: members, error: membersError } = await client
    .from("members")
    .select("id, name, email, stage")
    .limit(5);

  results["members_sample"] = {
    data: members,
    error: membersError?.message,
  };

  return NextResponse.json(results);
}
