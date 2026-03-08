import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getDemoAdminClient } from "@/lib/supabase/admin";

type Params = {
  params: Promise<{ token: string }>;
};

export async function POST(request: NextRequest, { params }: Params) {
  const { token } = await params;
  const supabase = getDemoAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  try {
    // Parse request body
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    // Verify demo session exists and is valid
    const { data: session } = await supabase
      .from("demo_sessions")
      .select("id, community_id, expires_at, claimed_at")
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

    // Get community name for email subject
    const { data: community } = await supabase
      .from("communities")
      .select("name")
      .eq("id", session.community_id)
      .single();

    const communityName = community?.name || "Your Community";

    // Create a Supabase auth client for sending OTP
    // We need to use the anon key client for auth operations
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Send magic link OTP
    // The callback URL includes the demo token so we can complete the claim
    const redirectUrl = new URL(
      `/auth/callback?demo_token=${token}`,
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    );

    const { error: otpError } = await authClient.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl.toString(),
        data: {
          demo_token: token,
          community_id: session.community_id,
        },
      },
    });

    if (otpError) {
      console.error("Failed to send OTP:", otpError);
      return NextResponse.json(
        { error: "Failed to send magic link" },
        { status: 500 }
      );
    }

    // Store pending claim intent (optional - for verification in callback)
    // The demo_token in the redirect URL and user metadata handles this

    return NextResponse.json({ success: true, message: "Magic link sent" });
  } catch (error) {
    console.error("Claim error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
