import { NextRequest, NextResponse } from "next/server";
import { getDemoAdminClient } from "@/lib/supabase/admin";

type Params = {
  params: Promise<{ token: string }>;
};

export async function PATCH(request: NextRequest, { params }: Params) {
  const { token } = await params;
  const supabase = getDemoAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  try {
    // Verify demo session exists and is valid
    const { data: session } = await supabase
      .from("demo_sessions")
      .select("community_id, expires_at, claimed_at")
      .eq("token", token)
      .single();

    if (!session) {
      return NextResponse.json(
        { error: "Demo session not found" },
        { status: 404 }
      );
    }

    if (session.claimed_at) {
      return NextResponse.json(
        { error: "Demo session already claimed" },
        { status: 400 }
      );
    }

    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Demo session expired" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { section_schema, stage_config } = body;

    // Update program
    const { error } = await supabase
      .from("programs")
      .update({
        ...(section_schema !== undefined && { section_schema }),
        ...(stage_config !== undefined && { stage_config }),
      })
      .eq("community_id", session.community_id);

    if (error) {
      console.error("Failed to update program:", error);
      return NextResponse.json(
        { error: "Failed to update program" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Program update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
