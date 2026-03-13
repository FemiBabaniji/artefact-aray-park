import { NextRequest, NextResponse } from "next/server";
import { getDemoAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

type Params = {
  params: Promise<{ slug: string }>;
};

// Generate a viewer token from IP + User-Agent for anonymous tracking
function generateViewerToken(request: NextRequest): string {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim()
    || request.headers.get("x-real-ip")
    || "unknown";
  const ua = request.headers.get("user-agent") || "unknown";
  return crypto.createHash("sha256").update(`${ip}:${ua}`).digest("hex").slice(0, 32);
}

// GET /api/portal/[slug] - Get engagement for client portal
export async function GET(request: NextRequest, { params }: Params) {
  const { slug } = await params;
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
      .select("*")
      .eq("slug", slug)
      .eq("share_token", token)
      .single();

    if (engagementError || !engagement) {
      return NextResponse.json(
        { error: "Engagement not found or invalid token" },
        { status: 404 }
      );
    }

    // Check token expiry
    if (engagement.share_token_expires_at) {
      const expiresAt = new Date(engagement.share_token_expires_at);
      if (expiresAt < new Date()) {
        return NextResponse.json(
          { error: "Access token has expired. Please request a new link." },
          { status: 403 }
        );
      }
    }

    // Check token revocation
    if (engagement.share_token_revoked_at) {
      return NextResponse.json(
        { error: "Access has been revoked. Please request a new link." },
        { status: 403 }
      );
    }

    // Fetch client
    let client = null;
    if (engagement.client_id) {
      const { data } = await supabase
        .from("clients")
        .select("id, name, slug, logo_url")
        .eq("id", engagement.client_id)
        .single();
      client = data;
    }

    // Fetch rooms - only client-visible ones
    const { data: rooms } = await supabase
      .from("engagement_rooms")
      .select("*")
      .eq("engagement_id", engagement.id)
      .in("visibility", ["client_view", "client_edit"])
      .order("order_index", { ascending: true });

    // Fetch blocks for visible rooms
    const roomIds = rooms?.map((r) => r.id) ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let blocks: Record<string, any[]> = {};
    if (roomIds.length > 0) {
      const { data: allBlocks } = await supabase
        .from("engagement_blocks")
        .select("*")
        .in("room_id", roomIds)
        .order("order_index", { ascending: true });

      blocks = (allBlocks ?? []).reduce((acc, block) => {
        if (!acc[block.room_id]) acc[block.room_id] = [];
        acc[block.room_id].push(block);
        return acc;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }, {} as Record<string, any[]>);
    }

    // Track portal view and get previous view time for NEW badges
    const viewerToken = generateViewerToken(request);

    // Get previous view time before updating
    const { data: existingView } = await supabase
      .from("portal_views")
      .select("last_viewed_at, view_count")
      .eq("engagement_id", engagement.id)
      .eq("viewer_token", viewerToken)
      .single();

    const previousViewedAt = existingView?.last_viewed_at ?? null;
    const currentViewCount = existingView?.view_count ?? 0;

    // Upsert portal view
    await supabase
      .from("portal_views")
      .upsert(
        {
          engagement_id: engagement.id,
          viewer_token: viewerToken,
          last_viewed_at: new Date().toISOString(),
          view_count: currentViewCount + 1,
        },
        {
          onConflict: "engagement_id,viewer_token",
          ignoreDuplicates: false,
        }
      );

    // Log portal.viewed event using atomic sequence function
    await supabase.rpc("insert_engagement_event", {
      p_engagement_id: engagement.id,
      p_event_type: "portal_viewed",
      p_payload: {
        viewerToken: viewerToken.slice(0, 8), // Truncate for privacy
        isFirstView: !existingView,
      },
      p_actor_id: null,
      p_actor_type: "client",
    });

    // Attach blocks to rooms and transform to camelCase
    const roomsWithBlocks = (rooms ?? []).map((room) => ({
      id: room.id,
      engagementId: room.engagement_id,
      key: room.key,
      label: room.label,
      type: room.type,
      visibility: room.visibility,
      prompt: room.prompt,
      required: room.required,
      orderIndex: room.order_index,
      createdAt: room.created_at,
      updatedAt: room.updated_at,
      blocks: (blocks[room.id] ?? []).map((block) => ({
        id: block.id,
        roomId: block.room_id,
        blockType: block.block_type,
        content: block.content,
        storagePath: block.storage_path,
        caption: block.caption,
        metadata: block.metadata,
        orderIndex: block.order_index,
        version: block.version,
        createdBy: block.created_by,
        createdAt: block.created_at,
        // Mark as new if created after client's previous view
        isNew: previousViewedAt ? new Date(block.created_at) > new Date(previousViewedAt) : false,
      })),
    }));

    return NextResponse.json({
      engagement: {
        id: engagement.id,
        slug: engagement.slug,
        name: engagement.name,
        phase: engagement.phase,
        startDate: engagement.start_date,
        endDate: engagement.end_date,
        updatedAt: engagement.updated_at,
        theme: engagement.theme,
        client: client
          ? {
              id: client.id,
              name: client.name,
              logoUrl: client.logo_url,
            }
          : null,
        rooms: roomsWithBlocks,
      },
      // Include previous view time for client-side NEW badge calculation
      previousViewedAt,
    });
  } catch (error) {
    console.error("Portal fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
