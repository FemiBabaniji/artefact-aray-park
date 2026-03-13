import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";

type Params = {
  params: Promise<{ id: string }>;
};

// POST /api/engagements/[id]/files - Upload file
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { user, supabase } = auth.context;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const roomKey = formData.get("roomKey") as string | null;
    const caption = formData.get("caption") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!roomKey) {
      return NextResponse.json({ error: "Room key required" }, { status: 400 });
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

    // Get room
    const { data: room } = await supabase
      .from("engagement_rooms")
      .select("id")
      .eq("engagement_id", id)
      .eq("key", roomKey)
      .single();

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Upload file to storage
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `engagements/${id}/${roomKey}/${timestamp}-${sanitizedFileName}`;

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
        },
        order_index: orderIndex,
        created_by: user.id,
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
      p_engagement_id: id,
      p_event_type: "file_uploaded",
      p_payload: {
        roomKey,
        blockId: block.id,
        fileName: file.name,
        fileSize: file.size,
      },
      p_actor_id: user.id,
      p_actor_type: "user",
    });

    return NextResponse.json({
      block: {
        id: block.id,
        roomId: block.room_id,
        blockType: block.block_type,
        storagePath: block.storage_path,
        caption: block.caption,
        metadata: block.metadata,
        orderIndex: block.order_index,
        createdBy: block.created_by,
        createdAt: block.created_at,
      },
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
