// ════════════════════════════════════════════════════════════════════════════
// Background Job Processor
// Handles async tasks: AI summarization, block creation, etc.
// ════════════════════════════════════════════════════════════════════════════

import { SupabaseClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

// Job types we handle
type JobType = "summarize" | "summarize_and_ingest" | "create_block";

interface JobPayload {
  queueItemId?: string;
  engagementId?: string;
  integrationId?: string;
  sourceType?: string;
  sourceId?: string;
  content?: string;
  sourceData?: Record<string, unknown>;
  roomKey?: string;
  blockType?: string;
  blockContent?: string;
}

interface ProcessResult {
  processed: number;
  succeeded: number;
  failed: number;
  errors: string[];
}

/**
 * Process pending background jobs
 */
export async function processJobs(
  supabase: SupabaseClient,
  options?: {
    jobTypes?: JobType[];
    maxJobs?: number;
    workerId?: string;
  }
): Promise<ProcessResult> {
  const jobTypes = options?.jobTypes || ["summarize", "summarize_and_ingest", "create_block"];
  const maxJobs = options?.maxJobs || 10;
  const workerId = options?.workerId || `worker-${Date.now()}`;

  const result: ProcessResult = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    errors: [],
  };

  for (let i = 0; i < maxJobs; i++) {
    // Claim a job atomically
    const { data: jobs } = await supabase.rpc("claim_background_job", {
      p_job_types: jobTypes,
      p_worker_id: workerId,
    });

    if (!jobs || jobs.length === 0) {
      break; // No more jobs
    }

    const job = jobs[0];
    result.processed++;

    try {
      await processJob(supabase, job.job_id, job.job_type as JobType, job.payload);
      result.succeeded++;
    } catch (error) {
      result.failed++;
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      result.errors.push(`Job ${job.job_id}: ${errorMsg}`);

      // Mark job as failed with retry
      await supabase.rpc("fail_background_job", {
        p_job_id: job.job_id,
        p_error: errorMsg,
      });
    }
  }

  return result;
}

/**
 * Process a single job based on type
 */
async function processJob(
  supabase: SupabaseClient,
  jobId: string,
  jobType: JobType,
  payload: JobPayload
): Promise<void> {
  switch (jobType) {
    case "summarize":
      await processSummarizeJob(supabase, jobId, payload);
      break;

    case "summarize_and_ingest":
      await processSummarizeAndIngestJob(supabase, jobId, payload);
      break;

    case "create_block":
      await processCreateBlockJob(supabase, jobId, payload);
      break;

    default:
      throw new Error(`Unknown job type: ${jobType}`);
  }
}

/**
 * Process summarization job - updates ingestion queue item with AI summary
 */
async function processSummarizeJob(
  supabase: SupabaseClient,
  jobId: string,
  payload: JobPayload
): Promise<void> {
  const { queueItemId, sourceType, content } = payload;

  if (!queueItemId || !content) {
    throw new Error("Missing queueItemId or content");
  }

  // Generate summary
  const summary = await generateAISummary(content, sourceType || "unknown");

  // Update queue item
  await supabase
    .from("ingestion_queue")
    .update({
      summary: summary.text,
      suggested_room: summary.suggestedRoom,
      suggested_block: summary.suggestedBlock,
    })
    .eq("id", queueItemId);

  // Mark job complete
  await supabase.rpc("complete_background_job", {
    p_job_id: jobId,
    p_result: {
      summary: summary.text,
      suggestedRoom: summary.suggestedRoom,
    },
  });
}

/**
 * Process summarize and auto-ingest job
 * Generates summary, updates queue item, and creates block in engagement room
 */
async function processSummarizeAndIngestJob(
  supabase: SupabaseClient,
  jobId: string,
  payload: JobPayload
): Promise<void> {
  const { queueItemId, engagementId, sourceType, sourceId, content, sourceData } = payload;

  if (!queueItemId || !engagementId || !content) {
    throw new Error("Missing required fields for summarize_and_ingest");
  }

  // Generate summary
  const summary = await generateAISummary(content, sourceType || "unknown");

  // Update queue item
  await supabase
    .from("ingestion_queue")
    .update({
      summary: summary.text,
      suggested_room: summary.suggestedRoom,
      suggested_block: summary.suggestedBlock,
      processed_at: new Date().toISOString(),
    })
    .eq("id", queueItemId);

  // Create block in the suggested room
  const roomKey = summary.suggestedRoom || "meetings";

  // Get room
  const { data: room } = await supabase
    .from("engagement_rooms")
    .select("id")
    .eq("engagement_id", engagementId)
    .eq("key", roomKey)
    .single();

  if (!room) {
    // Try fallback room
    const { data: fallbackRoom } = await supabase
      .from("engagement_rooms")
      .select("id")
      .eq("engagement_id", engagementId)
      .limit(1)
      .single();

    if (!fallbackRoom) {
      throw new Error(`No room found for engagement ${engagementId}`);
    }
  }

  const roomId = room?.id;
  if (!roomId) {
    throw new Error("Room not found");
  }

  // Get next order index atomically
  const { data: nextOrder } = await supabase.rpc("get_next_block_order", {
    p_room_id: roomId,
  });

  // Create block
  const { data: block, error: blockError } = await supabase
    .from("engagement_blocks")
    .insert({
      room_id: roomId,
      block_type: summary.suggestedBlock?.type || "text",
      content: summary.suggestedBlock?.content || summary.text || content.slice(0, 2000),
      metadata: {
        source: sourceType,
        sourceId,
        sourceData,
        summary: summary.text,
        autoIngested: true,
        ingestedAt: new Date().toISOString(),
      },
      order_index: nextOrder ?? 0,
      updated_by_type: "system",
    })
    .select("id")
    .single();

  if (blockError) {
    throw new Error(`Failed to create block: ${blockError.message}`);
  }

  // Log event
  await supabase.rpc("insert_engagement_event", {
    p_engagement_id: engagementId,
    p_event_type: "block_auto_ingested",
    p_payload: {
      blockId: block?.id,
      roomKey,
      sourceType,
      sourceId,
      queueItemId,
    },
    p_actor_id: null,
    p_actor_type: "system",
  });

  // Mark job complete
  await supabase.rpc("complete_background_job", {
    p_job_id: jobId,
    p_result: {
      blockId: block?.id,
      roomKey,
      summary: summary.text,
    },
  });
}

/**
 * Process create block job
 */
async function processCreateBlockJob(
  supabase: SupabaseClient,
  jobId: string,
  payload: JobPayload
): Promise<void> {
  const { engagementId, roomKey, blockType, blockContent } = payload;

  if (!engagementId || !roomKey || !blockContent) {
    throw new Error("Missing required fields for create_block");
  }

  // Get room
  const { data: room } = await supabase
    .from("engagement_rooms")
    .select("id")
    .eq("engagement_id", engagementId)
    .eq("key", roomKey)
    .single();

  if (!room) {
    throw new Error(`Room ${roomKey} not found`);
  }

  // Get next order index atomically
  const { data: nextOrder } = await supabase.rpc("get_next_block_order", {
    p_room_id: room.id,
  });

  // Create block
  const { data: block, error } = await supabase
    .from("engagement_blocks")
    .insert({
      room_id: room.id,
      block_type: blockType || "text",
      content: blockContent,
      order_index: nextOrder ?? 0,
      updated_by_type: "system",
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create block: ${error.message}`);
  }

  // Mark job complete
  await supabase.rpc("complete_background_job", {
    p_job_id: jobId,
    p_result: { blockId: block?.id },
  });
}

// ── AI Summarization ─────────────────────────────────────────────────────────

interface AISummaryResult {
  text: string;
  suggestedRoom: string;
  suggestedBlock: {
    type: string;
    content: string;
    metadata?: Record<string, unknown>;
  };
}

async function generateAISummary(
  content: string,
  sourceType: string
): Promise<AISummaryResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Fallback if no API key
  if (!apiKey) {
    return {
      text: content.slice(0, 500),
      suggestedRoom: getDefaultRoom(sourceType),
      suggestedBlock: {
        type: "text",
        content: content.slice(0, 2000),
      },
    };
  }

  try {
    const anthropic = new Anthropic({ apiKey });

    const typeLabels: Record<string, string> = {
      email: "email",
      meeting: "meeting recording/transcript",
      slack: "Slack message",
      discord: "Discord message",
    };

    const prompt = `Analyze this ${typeLabels[sourceType] || "content"} and provide:
1. A brief summary (2-3 sentences)
2. Key decisions or action items (if any)
3. Suggested engagement room (one of: research, meetings, strategy, documents)
4. Format the summary as professional content suitable for a consulting engagement

Content:
${content.slice(0, 8000)}

Respond in JSON format:
{
  "summary": "...",
  "decisions": ["..."],
  "actionItems": ["..."],
  "suggestedRoom": "meetings|research|strategy|documents",
  "relevanceScore": 8
}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = response.content[0].type === "text" ? response.content[0].text : "";

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Build formatted block content
    let blockContent = `## ${getBlockTitle(sourceType)}\n\n${parsed.summary}`;

    if (parsed.decisions?.length) {
      blockContent += "\n\n**Key Decisions:**\n" + parsed.decisions.map((d: string) => `- ${d}`).join("\n");
    }

    if (parsed.actionItems?.length) {
      blockContent += "\n\n**Action Items:**\n" + parsed.actionItems.map((a: string) => `- [ ] ${a}`).join("\n");
    }

    return {
      text: parsed.summary,
      suggestedRoom: parsed.suggestedRoom || getDefaultRoom(sourceType),
      suggestedBlock: {
        type: parsed.decisions?.length ? "decision" : "text",
        content: blockContent,
        metadata: {
          relevanceScore: parsed.relevanceScore,
          hasDecisions: parsed.decisions?.length > 0,
          hasActionItems: parsed.actionItems?.length > 0,
        },
      },
    };
  } catch (error) {
    console.error("AI summarization failed:", error);
    return {
      text: content.slice(0, 500),
      suggestedRoom: getDefaultRoom(sourceType),
      suggestedBlock: {
        type: "text",
        content: content.slice(0, 2000),
      },
    };
  }
}

function getDefaultRoom(sourceType: string): string {
  switch (sourceType) {
    case "email":
    case "meeting":
      return "meetings";
    case "slack":
    case "discord":
      return "research";
    default:
      return "documents";
  }
}

function getBlockTitle(sourceType: string): string {
  switch (sourceType) {
    case "email":
      return "Email Summary";
    case "meeting":
      return "Meeting Notes";
    case "slack":
      return "Slack Discussion";
    case "discord":
      return "Discord Message";
    default:
      return "Imported Content";
  }
}
