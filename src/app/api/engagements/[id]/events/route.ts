import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";

type Params = {
  params: Promise<{ id: string }>;
};

// GET /api/engagements/[id]/events - List events for activity feed
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { supabase } = auth.context;

  try {
    const { searchParams } = new URL(request.url);
    const since = searchParams.get("since");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    // Verify engagement exists
    const { data: engagement } = await supabase
      .from("engagements")
      .select("id")
      .eq("id", id)
      .single();

    if (!engagement) {
      return NextResponse.json(
        { error: "Engagement not found" },
        { status: 404 }
      );
    }

    // Build query
    let query = supabase
      .from("engagement_events")
      .select("*")
      .eq("engagement_id", id)
      .order("sequence", { ascending: false })
      .limit(limit);

    if (since) {
      query = query.gt("created_at", since);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error("Events fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch events" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      events: (events ?? []).map((event) => ({
        id: event.id,
        eventType: event.event_type,
        payload: event.payload,
        actorId: event.actor_id,
        actorType: event.actor_type,
        sequence: event.sequence,
        createdAt: event.created_at,
      })),
    });
  } catch (error) {
    console.error("Events error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/engagements/[id]/events - Log a custom event
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { user, supabase } = auth.context;

  try {
    const body = await request.json();
    const { eventType, payload, actorType = "user" } = body;

    if (!eventType) {
      return NextResponse.json(
        { error: "Event type required" },
        { status: 400 }
      );
    }

    // Verify engagement exists
    const { data: engagement } = await supabase
      .from("engagements")
      .select("id")
      .eq("id", id)
      .single();

    if (!engagement) {
      return NextResponse.json(
        { error: "Engagement not found" },
        { status: 404 }
      );
    }

    // Insert event using atomic RPC
    const { data: event, error } = await supabase.rpc("insert_engagement_event", {
      p_engagement_id: id,
      p_event_type: eventType,
      p_payload: payload ?? {},
      p_actor_id: user.id,
      p_actor_type: actorType,
    });

    if (error) {
      console.error("Event creation error:", error);
      return NextResponse.json(
        { error: "Failed to create event" },
        { status: 500 }
      );
    }

    // Fetch the created event to return full details
    const { data: createdEvent } = await supabase
      .from("engagement_events")
      .select("*")
      .eq("id", event)
      .single();

    if (!createdEvent) {
      return NextResponse.json(
        { error: "Event created but could not be fetched" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      event: {
        id: createdEvent.id,
        eventType: createdEvent.event_type,
        payload: createdEvent.payload,
        actorId: createdEvent.actor_id,
        actorType: createdEvent.actor_type,
        sequence: createdEvent.sequence,
        createdAt: createdEvent.created_at,
      },
    });
  } catch (error) {
    console.error("Event error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
