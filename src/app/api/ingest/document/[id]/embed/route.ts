import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface DocumentDetails {
  filename: string;
  file_url: string | null;
  thumbnail_url: string | null;
  page_count: number | null;
}

interface StandaloneBlock {
  order_index: number;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    const { roomId } = await req.json();

    if (!roomId) {
      return NextResponse.json(
        { error: "roomId is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get document details
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: doc, error: docError } = await (supabase as any)
      .from("documents")
      .select("filename, file_url, thumbnail_url, page_count")
      .eq("id", documentId)
      .single() as { data: DocumentDetails | null; error: Error | null };

    if (docError || !doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Get current max order_index in room
    const { data: existingBlocks } = await supabase
      .from("standalone_blocks")
      .select("order_index")
      .eq("room_id", roomId)
      .order("order_index", { ascending: false })
      .limit(1) as { data: StandaloneBlock[] | null };

    const nextOrderIndex =
      existingBlocks && existingBlocks.length > 0
        ? existingBlocks[0].order_index + 1
        : 0;

    // Create document block
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: block, error: blockError } = await (supabase as any)
      .from("standalone_blocks")
      .insert({
        room_id: roomId,
        type: "document",
        content: {
          documentId,
          filename: doc.filename,
          fileUrl: doc.file_url,
          thumbnailUrl: doc.thumbnail_url,
          pageCount: doc.page_count,
        },
        order_index: nextOrderIndex,
      })
      .select()
      .single();

    if (blockError) {
      console.error("Failed to create block:", blockError);
      return NextResponse.json(
        { error: "Failed to create block" },
        { status: 500 }
      );
    }

    return NextResponse.json({ block });
  } catch (error) {
    console.error("Embed document error:", error);
    return NextResponse.json(
      { error: "Failed to embed document" },
      { status: 500 }
    );
  }
}
