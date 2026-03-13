import { NextRequest, NextResponse } from "next/server";
import { getDemoAdminClient } from "@/lib/supabase/admin";

type Params = {
  params: Promise<{ slug: string }>;
};

// POST /api/portal/[slug]/upload - Client uploads file
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
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const roomKey = formData.get("roomKey") as string | null;
    const caption = formData.get("caption") as string | null;
    const token = formData.get("token") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
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

    // Find a client-editable room or use default "documents" room
    let targetRoomKey = roomKey;
    if (!targetRoomKey) {
      const { data: editableRoom } = await supabase
        .from("engagement_rooms")
        .select("key")
        .eq("engagement_id", engagement.id)
        .eq("visibility", "client_edit")
        .limit(1)
        .single();

      targetRoomKey = editableRoom?.key || "documents";
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
        { error: "This room does not allow client uploads" },
        { status: 403 }
      );
    }

    // Upload file to storage
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `engagements/${engagement.id}/${targetRoomKey}/client-${timestamp}-${sanitizedFileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("engagement-files")
      .upload(storagePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
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

    // Create block
    const { data: block, error: blockError } = await supabase
      .from("engagement_blocks")
      .insert({
        room_id: room.id,
        block_type: "file",
        storage_path: storagePath,
        caption: caption || null,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          uploadedBy: "client",
        },
        order_index: orderIndex,
        created_by: "client",
      })
      .select()
      .single();

    if (blockError) {
      console.error("Block creation error:", blockError);
      return NextResponse.json(
        { error: "Failed to create block" },
        { status: 500 }
      );
    }

    // Log event
    await supabase.rpc("insert_engagement_event", {
      p_engagement_id: engagement.id,
      p_event_type: "client_file_uploaded",
      p_payload: {
        roomKey: targetRoomKey,
        blockId: block.id,
        fileName: file.name,
        fileSize: file.size,
      },
      p_actor_id: null,
      p_actor_type: "client",
    });

    return NextResponse.json({
      success: true,
      block: {
        id: block.id,
        fileName: file.name,
      },
    });
  } catch (error) {
    console.error("Client upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
