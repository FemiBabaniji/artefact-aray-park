// ════════════════════════════════════════════════════════════════════════════
// Context Ingestion MCP Tool Handlers
// Handles email, meeting, and document ingestion for engagements
// ════════════════════════════════════════════════════════════════════════════

import { SupabaseClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

export type ContextExecutorResult = {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
};

// ── Email Summarization ─────────────────────────────────────────────────────

export async function handleSummarizeEmail(
  supabase: SupabaseClient,
  args: {
    engagementSlug: string;
    emailContent: string;
    roomKey?: string;
    extractDecisions?: boolean;
  }
): Promise<ContextExecutorResult> {
  const { engagementSlug, emailContent, roomKey = "meetings", extractDecisions = true } = args;

  // Get engagement
  const { data: engagement, error } = await supabase
    .from("engagements")
    .select("id, name")
    .eq("slug", engagementSlug)
    .single();

  if (error || !engagement) {
    return { success: false, message: "Engagement not found" };
  }

  // Get room
  const { data: room } = await supabase
    .from("engagement_rooms")
    .select("id")
    .eq("engagement_id", engagement.id)
    .eq("key", roomKey)
    .single();

  if (!room) {
    return { success: false, message: `Room '${roomKey}' not found` };
  }

  // Use Claude to summarize
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { success: false, message: "AI service not configured" };
  }

  const anthropic = new Anthropic({ apiKey });

  const prompt = extractDecisions
    ? `Summarize this email thread. Extract:
1. Key decisions made (if any)
2. Action items mentioned
3. Important context for the project

For each decision, provide:
- Title: [short descriptive title]
- Decision: [what was decided]
- Rationale: [why, if mentioned]

Email:
${emailContent}`
    : `Provide a brief summary of this email thread, highlighting key points and any action items:

${emailContent}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const summary = message.content[0].type === "text" ? message.content[0].text : "";

  // Add summary as block
  const { data: lastBlock } = await supabase
    .from("engagement_blocks")
    .select("order_index")
    .eq("room_id", room.id)
    .order("order_index", { ascending: false })
    .limit(1)
    .single();

  await supabase.from("engagement_blocks").insert({
    room_id: room.id,
    block_type: "text",
    content: `## Email Summary\n\n${summary}`,
    metadata: {
      source: "email_ingestion",
      ingestedAt: new Date().toISOString(),
    },
    order_index: (lastBlock?.order_index ?? -1) + 1,
    created_by: "ai",
  });

  // Log event
  await supabase.rpc("insert_engagement_event", {
    p_engagement_id: engagement.id,
    p_event_type: "email_ingested",
    p_payload: { roomKey, summaryLength: summary.length },
    p_actor_id: null,
    p_actor_type: "ai",
  });

  return {
    success: true,
    message: "Email summarized and added to engagement",
    data: { roomKey, summaryLength: summary.length },
  };
}

// ── Meeting Summarization ───────────────────────────────────────────────────

export async function handleSummarizeMeeting(
  supabase: SupabaseClient,
  args: {
    engagementSlug: string;
    transcript: string;
    meetingTitle?: string;
    meetingDate?: string;
    attendees?: string[];
  }
): Promise<ContextExecutorResult> {
  const { engagementSlug, transcript, meetingTitle, meetingDate, attendees } = args;

  // Get engagement
  const { data: engagement, error } = await supabase
    .from("engagements")
    .select("id, name")
    .eq("slug", engagementSlug)
    .single();

  if (error || !engagement) {
    return { success: false, message: "Engagement not found" };
  }

  // Get meetings room
  const { data: room } = await supabase
    .from("engagement_rooms")
    .select("id")
    .eq("engagement_id", engagement.id)
    .eq("key", "meetings")
    .single();

  if (!room) {
    return { success: false, message: "Meetings room not found" };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { success: false, message: "AI service not configured" };
  }

  const anthropic = new Anthropic({ apiKey });

  const prompt = `Analyze this meeting transcript and extract:

1. **Summary**: Brief overview of what was discussed (2-3 sentences)
2. **Decisions Made**: Any decisions or agreements reached (list each with rationale if available)
3. **Action Items**: Tasks assigned to people
4. **Key Insights**: Important observations or context mentioned

Meeting: ${meetingTitle || "Untitled Meeting"}
Date: ${meetingDate || "Not specified"}
Attendees: ${attendees?.join(", ") || "Not specified"}

Transcript:
${transcript}

Format your response as JSON with keys: summary, decisions (array of {title, decision, rationale}), actionItems (array of {task, assignee}), insights (array of strings)`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const responseText = message.content[0].type === "text" ? message.content[0].text : "{}";

  // Parse the response
  let parsed: {
    summary?: string;
    decisions?: { title: string; decision: string; rationale?: string }[];
    actionItems?: { task: string; assignee?: string }[];
    insights?: string[];
  } = {};

  try {
    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    }
  } catch {
    // If parsing fails, use the raw text as summary
    parsed = { summary: responseText };
  }

  // Get order index
  const { data: lastBlock } = await supabase
    .from("engagement_blocks")
    .select("order_index")
    .eq("room_id", room.id)
    .order("order_index", { ascending: false })
    .limit(1)
    .single();

  let orderIndex = (lastBlock?.order_index ?? -1) + 1;
  const blocksCreated: string[] = [];

  // Add summary block
  if (parsed.summary) {
    const { data: summaryBlock } = await supabase
      .from("engagement_blocks")
      .insert({
        room_id: room.id,
        block_type: "text",
        content: `## ${meetingTitle || "Meeting Notes"}\n\n${parsed.summary}${
          parsed.actionItems?.length
            ? "\n\n**Action Items:**\n" +
              parsed.actionItems.map((a) => `- ${a.task}${a.assignee ? ` (@${a.assignee})` : ""}`).join("\n")
            : ""
        }`,
        metadata: {
          source: "meeting_transcript",
          meetingDate: meetingDate || new Date().toISOString(),
          attendees,
        },
        order_index: orderIndex++,
        created_by: "ai",
      })
      .select("id")
      .single();

    if (summaryBlock) blocksCreated.push(summaryBlock.id);
  }

  // Add decision blocks
  if (parsed.decisions?.length) {
    for (const decision of parsed.decisions) {
      const { data: decisionBlock } = await supabase
        .from("engagement_blocks")
        .insert({
          room_id: room.id,
          block_type: "decision",
          content: decision.decision,
          metadata: {
            title: decision.title,
            rationale: decision.rationale,
            attendees,
            decidedAt: meetingDate || new Date().toISOString().split("T")[0],
          },
          order_index: orderIndex++,
          created_by: "ai",
        })
        .select("id")
        .single();

      if (decisionBlock) blocksCreated.push(decisionBlock.id);
    }
  }

  // Log event
  await supabase.rpc("insert_engagement_event", {
    p_engagement_id: engagement.id,
    p_event_type: "meeting_ingested",
    p_payload: {
      meetingTitle,
      meetingDate,
      blocksCreated: blocksCreated.length,
      decisionsExtracted: parsed.decisions?.length ?? 0,
    },
    p_actor_id: null,
    p_actor_type: "ai",
  });

  return {
    success: true,
    message: `Meeting processed: ${blocksCreated.length} blocks created, ${parsed.decisions?.length ?? 0} decisions extracted`,
    data: {
      blocksCreated: blocksCreated.length,
      decisionsExtracted: parsed.decisions?.length ?? 0,
    },
  };
}

// ── Document Ingestion ──────────────────────────────────────────────────────

export async function handleIngestDocument(
  supabase: SupabaseClient,
  args: {
    engagementSlug: string;
    documentContent: string;
    documentTitle?: string;
    documentType?: string;
    roomKey?: string;
  }
): Promise<ContextExecutorResult> {
  const {
    engagementSlug,
    documentContent,
    documentTitle = "Document",
    documentType = "other",
    roomKey = "research",
  } = args;

  // Get engagement
  const { data: engagement, error } = await supabase
    .from("engagements")
    .select("id, name")
    .eq("slug", engagementSlug)
    .single();

  if (error || !engagement) {
    return { success: false, message: "Engagement not found" };
  }

  // Get room
  const { data: room } = await supabase
    .from("engagement_rooms")
    .select("id")
    .eq("engagement_id", engagement.id)
    .eq("key", roomKey)
    .single();

  if (!room) {
    return { success: false, message: `Room '${roomKey}' not found` };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { success: false, message: "AI service not configured" };
  }

  const anthropic = new Anthropic({ apiKey });

  const prompt = `Analyze this ${documentType} document and extract key information:

Document Title: ${documentTitle}
Document Type: ${documentType}

Content:
${documentContent.slice(0, 15000)}${documentContent.length > 15000 ? "\n\n[Document truncated...]" : ""}

Provide:
1. Executive summary (2-3 paragraphs)
2. Key points and insights
3. Relevant context for a consulting engagement
4. Any questions or areas that need clarification`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const analysis = message.content[0].type === "text" ? message.content[0].text : "";

  // Add as block
  const { data: lastBlock } = await supabase
    .from("engagement_blocks")
    .select("order_index")
    .eq("room_id", room.id)
    .order("order_index", { ascending: false })
    .limit(1)
    .single();

  await supabase.from("engagement_blocks").insert({
    room_id: room.id,
    block_type: "text",
    content: `## ${documentTitle}\n\n**Document Type:** ${documentType}\n\n${analysis}`,
    metadata: {
      source: "document_ingestion",
      documentType,
      originalLength: documentContent.length,
      ingestedAt: new Date().toISOString(),
    },
    order_index: (lastBlock?.order_index ?? -1) + 1,
    created_by: "ai",
  });

  // Log event
  await supabase.rpc("insert_engagement_event", {
    p_engagement_id: engagement.id,
    p_event_type: "document_ingested",
    p_payload: {
      roomKey,
      documentTitle,
      documentType,
      originalLength: documentContent.length,
    },
    p_actor_id: null,
    p_actor_type: "ai",
  });

  return {
    success: true,
    message: `Document "${documentTitle}" analyzed and added to ${roomKey}`,
    data: { roomKey, documentType },
  };
}
