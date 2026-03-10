import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

interface DocumentText {
  extracted_text: string | null;
  filename: string;
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
    const { roomId, roomType, roomLabel } = await req.json();

    if (!roomId || !roomLabel) {
      return NextResponse.json(
        { error: "roomId and roomLabel are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get document text
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: doc, error: docError } = await (supabase as any)
      .from("documents")
      .select("extracted_text, filename")
      .eq("id", documentId)
      .single() as { data: DocumentText | null; error: Error | null };

    if (docError || !doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    if (!doc.extracted_text) {
      return NextResponse.json(
        { error: "Document has no extracted text" },
        { status: 400 }
      );
    }

    // Generate content using Claude
    const client = new Anthropic();
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `You are filling the "${roomLabel}" section of a professional profile.

Based on this document (${doc.filename}), write appropriate content for this section.

Document content:
${doc.extracted_text.slice(0, 15000)}

Rules:
- Write in first person if appropriate for this section type
- Be concise but comprehensive
- Format for readability using markdown (headings, bullet points, paragraphs)
- Only include information relevant to "${roomLabel}"
- If the document doesn't contain relevant information for this section, say so briefly
- Do not make up information that isn't in the document

Room type: ${roomType || "custom"}
Section: ${roomLabel}`,
        },
      ],
    });

    const generatedText =
      response.content[0].type === "text" ? response.content[0].text : "";

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

    // Create text block with generated content
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: block, error: blockError } = await (supabase as any)
      .from("standalone_blocks")
      .insert({
        room_id: roomId,
        type: "text",
        content: {
          body: generatedText,
          format: "markdown",
          sourceDocumentId: documentId,
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

    return NextResponse.json({ block, generatedText });
  } catch (error) {
    console.error("AI fill error:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}
