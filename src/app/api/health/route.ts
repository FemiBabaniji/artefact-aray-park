import { NextResponse } from "next/server";

// GET /api/health
// Health check endpoint for monitoring
export async function GET() {
  const status = {
    status: "ok",
    timestamp: new Date().toISOString(),
    env: {
      supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      useSupabase: process.env.USE_SUPABASE === "true",
    },
  };

  return NextResponse.json(status);
}
