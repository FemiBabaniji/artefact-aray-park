import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { createParticipantId, getDefaultAccess } from "@/types/participant";
import type { ParticipantRole } from "@/types/participant";

type Params = {
  params: Promise<{ id: string }>;
};

const VALID_ROLES: ParticipantRole[] = [
  "lead_consultant",
  "consultant",
  "client_contact",
  "client_observer",
  "observer",
];

// GET /api/engagements/[id]/participants - List participants
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { supabase } = auth.context;

  try {
    const { data, error } = await supabase
      .from("engagement_participants")
      .select("*")
      .eq("engagement_id", id)
      .order("role", { ascending: true });

    if (error) {
      console.error("Failed to fetch participants:", error);
      return NextResponse.json(
        { error: "Failed to fetch participants" },
        { status: 500 }
      );
    }

    return NextResponse.json({ participants: data ?? [] });
  } catch (error) {
    console.error("Participants fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/engagements/[id]/participants - Invite participant
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { user, supabase } = auth.context;

  try {
    const body = await request.json();
    const { name, email, role, userId, clientContactId } = body;

    if (!name || !email || !role) {
      return NextResponse.json(
        { error: "name, email, and role are required" },
        { status: 400 }
      );
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    // Check if already a participant
    const { data: existing } = await supabase
      .from("engagement_participants")
      .select("id")
      .eq("engagement_id", id)
      .eq("email", email)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Already a participant" },
        { status: 400 }
      );
    }

    const participantId = createParticipantId();
    const access = getDefaultAccess(role);

    const { data, error } = await supabase
      .from("engagement_participants")
      .insert({
        id: participantId,
        engagement_id: id,
        user_id: userId || null,
        client_contact_id: clientContactId || null,
        name,
        email,
        role,
        access,
        invited_by: user.id,
        joined_at: userId ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to add participant:", error);
      return NextResponse.json(
        { error: "Failed to add participant" },
        { status: 500 }
      );
    }

    // Record event
    await supabase.rpc("insert_engagement_event", {
      p_engagement_id: id,
      p_event_type: "participant_invited",
      p_payload: { participantId, name, email, role, invitedBy: user.id },
      p_actor_id: user.id,
      p_actor_type: "user",
    });

    return NextResponse.json({ participant: data }, { status: 201 });
  } catch (error) {
    console.error("Participant invite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/engagements/[id]/participants - Update participant role/access
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { user, supabase } = auth.context;

  try {
    const body = await request.json();
    const { participantId, role, access } = body;

    if (!participantId) {
      return NextResponse.json(
        { error: "participantId is required" },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (role !== undefined) {
      if (!VALID_ROLES.includes(role)) {
        return NextResponse.json(
          { error: "Invalid role" },
          { status: 400 }
        );
      }
      updates.role = role;
    }
    if (access !== undefined) {
      updates.access = access;
    }

    const { data, error } = await supabase
      .from("engagement_participants")
      .update(updates)
      .eq("id", participantId)
      .eq("engagement_id", id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update participant:", error);
      return NextResponse.json(
        { error: "Failed to update participant" },
        { status: 500 }
      );
    }

    // Record event
    if (role !== undefined) {
      await supabase.rpc("insert_engagement_event", {
        p_engagement_id: id,
        p_event_type: "participant_role_changed",
        p_payload: { participantId, toRole: role },
        p_actor_id: user.id,
        p_actor_type: "user",
      });
    }

    return NextResponse.json({ participant: data });
  } catch (error) {
    console.error("Participant update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/engagements/[id]/participants - Remove participant
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { user, supabase } = auth.context;

  try {
    const body = await request.json();
    const { participantId, reason } = body;

    if (!participantId) {
      return NextResponse.json(
        { error: "participantId is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("engagement_participants")
      .delete()
      .eq("id", participantId)
      .eq("engagement_id", id);

    if (error) {
      console.error("Failed to remove participant:", error);
      return NextResponse.json(
        { error: "Failed to remove participant" },
        { status: 500 }
      );
    }

    // Record event
    await supabase.rpc("insert_engagement_event", {
      p_engagement_id: id,
      p_event_type: "participant_removed",
      p_payload: { participantId, removedBy: user.id, reason },
      p_actor_id: user.id,
      p_actor_type: "user",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Participant removal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
