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
    const { name, tagline, accent_color, logo_url } = body;

    // Update community
    const { error } = await supabase
      .from("communities")
      .update({
        ...(name !== undefined && { name }),
        ...(tagline !== undefined && { tagline }),
        ...(accent_color !== undefined && { accent_color }),
        ...(logo_url !== undefined && { logo_url }),
      })
      .eq("id", session.community_id);

    if (error) {
      console.error("Failed to update community:", error);
      return NextResponse.json(
        { error: "Failed to update community" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Community update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
