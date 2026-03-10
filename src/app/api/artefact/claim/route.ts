// ════════════════════════════════════════════════════════════════════════════
// Artefact Claim API (P0)
// POST /api/artefact/claim - Claim a guest artefact with authenticated user
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ArtefactEvent, EventStore } from "@/types/events";

type ClaimRequest = {
  artefactId: string;
  sessionId: string;
  events: ArtefactEvent[];
  slug?: string;
};

type ClaimResponse = {
  success: boolean;
  artefactId: string;
  ownerId: string;
  slug: string | null;
  message?: string;
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as ClaimRequest;
    const { artefactId, sessionId, events, slug } = body;

    if (!artefactId || !sessionId || !events) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate events have artefact_created as first event
    if (events.length === 0 || events[0].type !== "artefact_created") {
      return NextResponse.json(
        { success: false, message: "Invalid event log" },
        { status: 400 }
      );
    }

    // TODO: Check if slug is available (P1)
    // For now, generate slug from user email or name
    const generatedSlug = slug ?? user.email?.split("@")[0] ?? artefactId.slice(4, 12);

    // TODO: Persist to database (P1)
    // For now, return success response
    // In production:
    // 1. Insert into artefacts table with owner_id = user.id
    // 2. Insert all events into events table
    // 3. Set lifecycle_state = 'claimed'

    const response: ClaimResponse = {
      success: true,
      artefactId,
      ownerId: user.id,
      slug: generatedSlug,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Claim error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/artefact/claim - Check if user has a claimed artefact
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { claimed: false, message: "Not authenticated" },
        { status: 200 }
      );
    }

    // TODO: Query artefacts table for user's artefact (P1)
    // For now, return not claimed
    return NextResponse.json({
      claimed: false,
      userId: user.id,
    });
  } catch (error) {
    console.error("Claim check error:", error);
    return NextResponse.json(
      { claimed: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
