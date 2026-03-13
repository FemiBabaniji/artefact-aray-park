import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import {
  createEngagementId,
  createEngagementRoomId,
  slugifyEngagementName,
  DEFAULT_ENGAGEMENT_ROOMS,
} from "@/types/engagement";
import { createParticipantId, getDefaultAccess } from "@/types/participant";

// GET /api/engagements - List engagements for the current user
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { user, supabase } = auth.context;

  try {
    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get("clientId");
    const phase = searchParams.get("phase");

    // Always filter by authenticated user's engagements
    let query = supabase
      .from("engagement_summary")
      .select("*")
      .eq("owner_id", user.id);

    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    if (phase) {
      query = query.eq("phase", phase);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch engagements:", error);
      return NextResponse.json(
        { error: "Failed to fetch engagements" },
        { status: 500 }
      );
    }

    return NextResponse.json({ engagements: data ?? [] });
  } catch (error) {
    console.error("Engagements fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/engagements - Create a new engagement
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { user, supabase } = auth.context;

  try {
    const body = await request.json();
    const {
      name,
      clientId,
      ownerName,
      ownerEmail,
      value,
      currency,
      startDate,
      endDate,
      theme,
      rooms,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    // Generate slug from name
    let slug = slugifyEngagementName(name);

    // Check for slug collision
    const { data: existing } = await supabase
      .from("engagements")
      .select("slug")
      .like("slug", `${slug}%`);

    if (existing && existing.length > 0) {
      slug = `${slug}-${existing.length + 1}`;
    }

    const engagementId = createEngagementId();

    // Use provided rooms or defaults
    const roomSchemas = rooms || DEFAULT_ENGAGEMENT_ROOMS;

    // Create engagement with authenticated user as owner
    const { data: engagement, error: engagementError } = await supabase
      .from("engagements")
      .insert({
        id: engagementId,
        name,
        slug,
        client_id: clientId || null,
        owner_id: user.id,
        phase: "intake",
        value: value || null,
        currency: currency || "USD",
        start_date: startDate || null,
        end_date: endDate || null,
        theme: theme || "dark",
        room_schema: roomSchemas,
      })
      .select()
      .single();

    if (engagementError) {
      console.error("Failed to create engagement:", engagementError);
      return NextResponse.json(
        { error: "Failed to create engagement" },
        { status: 500 }
      );
    }

    // Create rooms from schema
    const roomInserts = roomSchemas.map(
      (schema: { key: string; label: string; type: string; visibility: string; prompt?: string; required: boolean; orderIndex: number }) => ({
        id: createEngagementRoomId(),
        engagement_id: engagementId,
        key: schema.key,
        label: schema.label,
        room_type: schema.type,
        visibility: schema.visibility,
        prompt: schema.prompt || null,
        required: schema.required,
        order_index: schema.orderIndex,
      })
    );

    if (roomInserts.length > 0) {
      const { error: roomsError } = await supabase
        .from("engagement_rooms")
        .insert(roomInserts);

      if (roomsError) {
        console.error("Failed to create rooms:", roomsError);
        // Continue anyway, rooms can be added later
      }
    }

    // Add owner as lead consultant
    const participantId = createParticipantId();
    const { error: participantError } = await supabase
      .from("engagement_participants")
      .insert({
        id: participantId,
        engagement_id: engagementId,
        user_id: user.id,
        name: ownerName || user.email?.split("@")[0] || "Owner",
        email: ownerEmail || user.email || "",
        role: "lead_consultant",
        access: getDefaultAccess("lead_consultant"),
        joined_at: new Date().toISOString(),
      });

    if (participantError) {
      console.error("Failed to add owner as participant:", participantError);
    }

    // Record initial phase transition
    await supabase.from("engagement_phase_transitions").insert({
      engagement_id: engagementId,
      from_phase: null,
      to_phase: "intake",
      transitioned_by: user.id,
    });

    // Record creation event
    await supabase.from("engagement_events").insert({
      engagement_id: engagementId,
      event_type: "engagement_created",
      payload: { name, clientId, rooms: roomSchemas, ownerId: user.id },
      actor_id: user.id,
      sequence: 1,
    });

    return NextResponse.json({ engagement }, { status: 201 });
  } catch (error) {
    console.error("Engagement creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
