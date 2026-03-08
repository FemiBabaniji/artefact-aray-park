import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getDemoAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_SECTIONS,
  DEFAULT_STAGES,
  DEFAULT_IDENTITY,
} from "@/context/DemoConfigContext";

export async function POST() {
  const supabase = getDemoAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  try {
    // Generate short URL-safe token
    const token = nanoid(12);
    const slug = `demo-${token}`;

    // Create community with demo tier
    const { data: community, error: communityError } = await supabase
      .from("communities")
      .insert({
        slug,
        name: DEFAULT_IDENTITY.name,
        tagline: DEFAULT_IDENTITY.tagline,
        accent_color: DEFAULT_IDENTITY.accentColor,
        logo_url: DEFAULT_IDENTITY.logoUrl,
        tier: "demo",
      })
      .select()
      .single();

    if (communityError || !community) {
      console.error("Failed to create community:", communityError);
      return NextResponse.json(
        { error: "Failed to create demo community" },
        { status: 500 }
      );
    }

    // Create program with default schema
    const { error: programError } = await supabase.from("programs").insert({
      community_id: community.id,
      name: "Demo Program",
      subtitle: "Spring Cohort 2025",
      week: 1,
      total_weeks: 20,
      live: false,
      section_schema: DEFAULT_SECTIONS,
      stage_config: DEFAULT_STAGES,
    });

    if (programError) {
      console.error("Failed to create program:", programError);
      // Rollback community
      await supabase.from("communities").delete().eq("id", community.id);
      return NextResponse.json(
        { error: "Failed to create demo program" },
        { status: 500 }
      );
    }

    // Create demo session
    const { error: sessionError } = await supabase
      .from("demo_sessions")
      .insert({
        token,
        community_id: community.id,
      });

    if (sessionError) {
      console.error("Failed to create demo session:", sessionError);
      // Rollback community (cascades to program)
      await supabase.from("communities").delete().eq("id", community.id);
      return NextResponse.json(
        { error: "Failed to create demo session" },
        { status: 500 }
      );
    }

    // Redirect to identity setup
    return NextResponse.redirect(
      new URL(`/demo/${token}/setup/identity`, process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
    );
  } catch (error) {
    console.error("Demo creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Also support GET for easy browser navigation
export async function GET() {
  return POST();
}
