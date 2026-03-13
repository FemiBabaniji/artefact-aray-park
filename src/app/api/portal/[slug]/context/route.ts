import { NextRequest, NextResponse } from "next/server";
import { getDemoAdminClient } from "@/lib/supabase/admin";

type Params = {
  params: Promise<{ slug: string }>;
};

// POST /api/portal/[slug]/context - Client submits context/info
export async function POST(request: NextRequest, { params }: Params) {
  const { slug } = await params;
  const supabase = getDemoAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { roomKey, content, contextType, metadata, token } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Content required" },
        { status: 400 }
      );
    }

    // Token is required for portal access
    if (!token) {
      return NextResponse.json(
        { error: "Access denied. Token required." },
        { status: 401 }
      );
    }

    // Fetch engagement by slug AND validate share_token
    const { data: engagement, error: engagementError } = await supabase
      .from("engagements")
      .select("id, share_token")
      .eq("slug", slug)
      .eq("share_token", token)
      .single();

    if (engagementError || !engagement) {
      return NextResponse.json(
        { error: "Engagement not found or invalid token" },
        { status: 404 }
      );
    }

    // Find target room (default to scope or first client_edit room)
    let targetRoomKey = roomKey;
    if (!targetRoomKey) {
      const { data: editableRoom } = await supabase
        .from("engagement_rooms")
        .select("key")
        .eq("engagement_id", engagement.id)
        .eq("visibility", "client_edit")
        .limit(1)
        .single();

      targetRoomKey = editableRoom?.key || "scope";
    }

    // Get room
    const { data: room } = await supabase
      .from("engagement_rooms")
      .select("id, visibility")
      .eq("engagement_id", engagement.id)
      .eq("key", targetRoomKey)
      .single();

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Verify room allows client edit
    if (room.visibility !== "client_edit") {
      return NextResponse.json(
        { error: "This room does not allow client input" },
        { status: 403 }
      );
    }

    // Get next order index
    const { data: lastBlock } = await supabase
      .from("engagement_blocks")
      .select("order_index")
      .eq("room_id", room.id)
      .order("order_index", { ascending: false })
      .limit(1)
      .single();

    const orderIndex = (lastBlock?.order_index ?? -1) + 1;

    // Create text block with client context
    const { data: block, error: blockError } = await supabase
      .from("engagement_blocks")
      .insert({
        room_id: room.id,
        block_type: "text",
        content,
        caption: contextType ? `Client ${contextType}` : "Client Input",
        metadata: {
          ...metadata,
          contextType: contextType || "general",
          submittedBy: "client",
          submittedAt: new Date().toISOString(),
        },
        order_index: orderIndex,
        created_by: "client",
      })
      .select()
      .single();

    if (blockError) {
      console.error("Block creation error:", blockError);
      return NextResponse.json(
        { error: "Failed to save context" },
        { status: 500 }
      );
    }

    // Log event
    await supabase.rpc("insert_engagement_event", {
      p_engagement_id: engagement.id,
      p_event_type: "client_context_submitted",
      p_payload: {
        roomKey: targetRoomKey,
        blockId: block.id,
        contextType: contextType || "general",
        contentLength: content.length,
      },
      p_actor_id: null,
      p_actor_type: "client",
    });

    return NextResponse.json({
      success: true,
      block: {
        id: block.id,
        content: block.content,
      },
    });
  } catch (error) {
    console.error("Client context error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
