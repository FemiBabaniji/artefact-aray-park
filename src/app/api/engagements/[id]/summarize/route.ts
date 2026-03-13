import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import Anthropic from "@anthropic-ai/sdk";

type Params = {
  params: Promise<{ id: string }>;
};

// POST /api/engagements/[id]/summarize - Generate AI summary
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { user, supabase } = auth.context;

  try {
    const body = await request.json().catch(() => ({}));
    const { saveToOutcomes = false } = body;

    // Fetch engagement with rooms and blocks
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
    let clientName = "the client";
    if (engagement.client_id) {
      const { data: client } = await supabase
        .from("clients")
        .select("name")
        .eq("id", engagement.client_id)
        .single();
      if (client) clientName = client.name;
    }

    // Fetch rooms and blocks
    const { data: rooms } = await supabase
      .from("engagement_rooms")
      .select("*")
      .eq("engagement_id", id)
      .order("order_index", { ascending: true });

    const roomIds = rooms?.map((r) => r.id) ?? [];
    let blocks: Record<string, unknown[]> = {};
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
      }, {} as Record<string, unknown[]>);
    }

    // Build context for summarization
    let context = `Engagement: ${engagement.name}\nClient: ${clientName}\nPhase: ${engagement.phase}\n\n`;

    for (const room of rooms ?? []) {
      const roomBlocks = blocks[room.id] ?? [];
      if (roomBlocks.length === 0) continue;

      context += `## ${room.label}\n`;
      for (const block of roomBlocks) {
        const b = block as { block_type: string; content?: string; metadata?: Record<string, unknown> };
        if (b.block_type === "decision") {
          const meta = b.metadata as { title?: string; rationale?: string; attendees?: string[]; decidedAt?: string } | undefined;
          context += `- Decision: ${meta?.title || "Untitled"}\n`;
          context += `  ${b.content || ""}\n`;
          if (meta?.rationale) context += `  Rationale: ${meta.rationale}\n`;
        } else if (b.block_type === "outcome") {
          const meta = b.metadata as { metric?: string; value?: string | number } | undefined;
          context += `- Outcome: ${b.content || ""}\n`;
          if (meta?.metric && meta?.value) {
            context += `  ${meta.metric}: ${meta.value}\n`;
          }
        } else if (b.content) {
          context += `- ${b.content.slice(0, 500)}${b.content.length > 500 ? "..." : ""}\n`;
        }
      }
      context += "\n";
    }

    // Generate summary with Claude
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({ apiKey });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a consulting engagement summarizer. Based on the following engagement data, provide a concise executive summary (3-5 paragraphs) covering:

1. Key decisions made
2. Major deliverables completed
3. Outcomes and impact achieved
4. Current status and next steps

Be professional and concise. Focus on value delivered to the client.

---

${context}`,
        },
      ],
    });

    const summary = message.content[0].type === "text" ? message.content[0].text : "";

    // Optionally save to outcomes room
    if (saveToOutcomes) {
      const outcomesRoom = rooms?.find((r) => r.key === "outcomes");
      if (outcomesRoom) {
        const { data: lastBlock } = await supabase
          .from("engagement_blocks")
          .select("order_index")
          .eq("room_id", outcomesRoom.id)
          .order("order_index", { ascending: false })
          .limit(1)
          .single();

        await supabase.from("engagement_blocks").insert({
          room_id: outcomesRoom.id,
          block_type: "text",
          content: `## AI-Generated Summary\n\n${summary}`,
          metadata: { generatedAt: new Date().toISOString(), type: "ai_summary" },
          order_index: (lastBlock?.order_index ?? -1) + 1,
          created_by: user.id,
        });
      }
    }

    // Log event
    await supabase.rpc("insert_engagement_event", {
      p_engagement_id: id,
      p_event_type: "summary_generated",
      p_payload: {
        summaryLength: summary.length,
        savedToOutcomes: saveToOutcomes,
      },
      p_actor_id: user.id,
      p_actor_type: "ai",
    });

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Summary generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
