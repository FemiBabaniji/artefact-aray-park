import { NextRequest, NextResponse } from "next/server";
import { getDemoAdminClient } from "@/lib/supabase/admin";

type Params = {
  params: Promise<{ slug: string; roomKey: string }>;
};

// GET /api/portal/[slug]/rooms/[roomKey] - Get room for client portal
export async function GET(request: NextRequest, { params }: Params) {
  const { slug, roomKey } = await params;
  const supabase = getDemoAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  // Get token from query params
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "Access denied. Token required." },
      { status: 401 }
    );
  }

  try {
    // Fetch engagement by slug AND validate share_token
    const { data: engagement, error: engagementError } = await supabase
      .from("engagements")
      .select("id")
      .eq("slug", slug)
      .eq("share_token", token)
      .single();

    if (engagementError || !engagement) {
      return NextResponse.json(
        { error: "Engagement not found or invalid token" },
        { status: 404 }
      );
    }

    // Fetch room - only if client-visible
    const { data: room, error: roomError } = await supabase
      .from("engagement_rooms")
      .select("*")
      .eq("engagement_id", engagement.id)
      .eq("key", roomKey)
      .in("visibility", ["client_view", "client_edit"])
      .single();

    if (roomError || !room) {
      return NextResponse.json(
        { error: "Room not found or access denied" },
        { status: 404 }
      );
    }

    // Fetch blocks
    const { data: blocks } = await supabase
      .from("engagement_blocks")
      .select("*")
      .eq("room_id", room.id)
      .order("order_index", { ascending: true });

    return NextResponse.json({
      room: {
        ...room,
        blocks: blocks ?? [],
      },
    });
  } catch (error) {
    console.error("Portal room fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
