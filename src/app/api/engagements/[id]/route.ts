import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";

type Params = {
  params: Promise<{ id: string }>;
};

// GET /api/engagements/[id] - Get engagement with rooms, participants, events
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { supabase } = auth.context;

  try {
    // Fetch engagement
    const { data: engagement, error: engagementError } = await supabase
      .from("engagements")
      .select("*")
      .eq("id", id)
      .single();

    if (engagementError || !engagement) {
      return NextResponse.json(
        { error: "Engagement not found" },
        { status: 404 }
      );
    }

    // Fetch client
    let client = null;
    if (engagement.client_id) {
      const { data } = await supabase
        .from("clients")
        .select("id, name, slug, logo_url, industry")
        .eq("id", engagement.client_id)
        .single();
      client = data;
    }

    // Fetch rooms with blocks
    const { data: rooms } = await supabase
      .from("engagement_rooms")
      .select("*")
      .eq("engagement_id", id)
      .order("order_index", { ascending: true });

    // Fetch blocks for all rooms
    const roomIds = rooms?.map((r) => r.id) ?? [];
    let blocks: Record<string, unknown[]> = {};
    if (roomIds.length > 0) {
      const { data: allBlocks } = await supabase
        .from("engagement_blocks")
        .select("*")
        .in("room_id", roomIds)
        .order("order_index", { ascending: true });

      // Group blocks by room
      blocks = (allBlocks ?? []).reduce((acc, block) => {
        if (!acc[block.room_id]) acc[block.room_id] = [];
        acc[block.room_id].push(block);
        return acc;
      }, {} as Record<string, unknown[]>);
    }

    // Attach blocks to rooms
    const roomsWithBlocks = (rooms ?? []).map((room) => ({
      ...room,
      blocks: blocks[room.id] ?? [],
    }));

    // Fetch participants
    const { data: participants } = await supabase
      .from("engagement_participants")
      .select("*")
      .eq("engagement_id", id)
      .order("role", { ascending: true });

    // Fetch recent events
    const { data: events } = await supabase
      .from("engagement_events")
      .select("*")
      .eq("engagement_id", id)
      .order("sequence", { ascending: false })
      .limit(50);

    // Fetch phase transitions
    const { data: phaseTransitions } = await supabase
      .from("engagement_phase_transitions")
      .select("*")
      .eq("engagement_id", id)
      .order("created_at", { ascending: true });

    return NextResponse.json({
      engagement: {
        ...engagement,
        client,
        rooms: roomsWithBlocks,
        participants: participants ?? [],
        events: events ?? [],
        phaseTransitions: phaseTransitions ?? [],
      },
    });
  } catch (error) {
    console.error("Engagement fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/engagements/[id] - Update engagement
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { user, supabase } = auth.context;

  try {
    const body = await request.json();
    const { name, value, currency, startDate, endDate, theme } = body;

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (value !== undefined) updates.value = value;
    if (currency !== undefined) updates.currency = currency;
    if (startDate !== undefined) updates.start_date = startDate;
    if (endDate !== undefined) updates.end_date = endDate;
    if (theme !== undefined) updates.theme = theme;

    const { data, error } = await supabase
      .from("engagements")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update engagement:", error);
      return NextResponse.json(
        { error: "Failed to update engagement" },
        { status: 500 }
      );
    }

    // Record update event
    await supabase.rpc("insert_engagement_event", {
      p_engagement_id: id,
      p_event_type: "engagement_updated",
      p_payload: updates,
      p_actor_id: user.id,
      p_actor_type: "user",
    });

    return NextResponse.json({ engagement: data });
  } catch (error) {
    console.error("Engagement update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/engagements/[id] - Archive engagement
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { user, supabase } = auth.context;

  try {
    const body = await request.json().catch(() => ({}));
    const { reason } = body;

    // Archive by setting phase to archived
    const { error } = await supabase
      .from("engagements")
      .update({ phase: "archived" })
      .eq("id", id);

    if (error) {
      console.error("Failed to archive engagement:", error);
      return NextResponse.json(
        { error: "Failed to archive engagement" },
        { status: 500 }
      );
    }

    // Record archive event
    await supabase.rpc("insert_engagement_event", {
      p_engagement_id: id,
      p_event_type: "engagement_archived",
      p_payload: { reason },
      p_actor_id: user.id,
      p_actor_type: "user",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Engagement archive error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
