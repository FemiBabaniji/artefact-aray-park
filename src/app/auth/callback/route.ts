import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDemoAdminClient } from "@/lib/supabase/admin";

// GET /auth/callback
// Handles magic link and OAuth redirects from Supabase
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/portal";
  const demoToken = searchParams.get("demo_token");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if this is a demo claim callback
      if (demoToken) {
        const claimResult = await completeDemoClaim(demoToken, data.user.id);
        if (claimResult.success) {
          // Redirect to admin after successful claim
          return NextResponse.redirect(`${origin}/admin`);
        }
        // Claim failed but auth succeeded - still redirect to portal
        console.error("Demo claim failed:", claimResult.error);
      }

      // Successful auth - redirect to intended destination
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth failed - redirect to error page or login
  return NextResponse.redirect(`${origin}/auth/error`);
}

// Complete the demo claim process
async function completeDemoClaim(
  token: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getDemoAdminClient();

  if (!supabase) {
    return { success: false, error: "Database not configured" };
  }

  try {
    // Verify demo session exists and is valid
    const { data: session } = await supabase
      .from("demo_sessions")
      .select("id, community_id, expires_at, claimed_at")
      .eq("token", token)
      .single();

    if (!session) {
      return { success: false, error: "Demo session not found" };
    }

    if (session.claimed_at) {
      return { success: false, error: "Demo session already claimed" };
    }

    if (new Date(session.expires_at) < new Date()) {
      return { success: false, error: "Demo session expired" };
    }

    // Insert community_roles as admin
    const { error: roleError } = await supabase
      .from("community_roles")
      .insert({
        community_id: session.community_id,
        user_id: userId,
        role: "admin",
      });

    if (roleError) {
      console.error("Failed to insert community role:", roleError);
      // Continue anyway - role might already exist
    }

    // Update community tier from 'demo' to 'standard'
    const { error: tierError } = await supabase
      .from("communities")
      .update({ tier: "standard" })
      .eq("id", session.community_id);

    if (tierError) {
      console.error("Failed to update community tier:", tierError);
    }

    // Mark demo session as claimed
    const { error: claimError } = await supabase
      .from("demo_sessions")
      .update({
        claimed_at: new Date().toISOString(),
        claimed_by: userId,
      })
      .eq("token", token);

    if (claimError) {
      console.error("Failed to mark session claimed:", claimError);
    }

    return { success: true };
  } catch (error) {
    console.error("Demo claim error:", error);
    return { success: false, error: "Internal error" };
  }
}
