// ════════════════════════════════════════════════════════════════════════════
// MCP Tool Executor
// Executes MCP tools against engagements with event logging
// ════════════════════════════════════════════════════════════════════════════

import { SupabaseClient } from "@supabase/supabase-js";
import type { EngagementPhase } from "@/types/engagement";
import {
  handleSummarizeEmail,
  handleSummarizeMeeting,
  handleIngestDocument,
} from "./context-executor";

// ── Types ────────────────────────────────────────────────────────────────────

export type ExecutionResult = {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
};

export type ActorInfo = {
  type: "user" | "ai";
  id?: string;
  model?: string;
};

// ── Tool Handlers ────────────────────────────────────────────────────────────

export async function handleAddBlock(
  supabase: SupabaseClient,
  args: {
    engagementSlug: string;
    roomKey: string;
    blockType: string;
    content: string;
    caption?: string;
    metadata?: Record<string, unknown>;
  },
  actor: ActorInfo
): Promise<ExecutionResult> {
  // Get engagement
  const { data: engagement, error: engagementError } = await supabase
    .from("engagements")
    .select("id")
    .eq("slug", args.engagementSlug)
    .single();

  if (engagementError || !engagement) {
    return { success: false, error: `Engagement not found: ${args.engagementSlug}` };
  }

  // Get room
  const { data: room, error: roomError } = await supabase
    .from("engagement_rooms")
    .select("id")
    .eq("engagement_id", engagement.id)
    .eq("key", args.roomKey)
    .single();

  if (roomError || !room) {
    return { success: false, error: `Room not found: ${args.roomKey}` };
  }

  // Get next order index
  const { data: existingBlocks } = await supabase
    .from("engagement_blocks")
    .select("order_index")
    .eq("room_id", room.id)
    .order("order_index", { ascending: false })
    .limit(1);

  const orderIndex = existingBlocks?.[0]?.order_index != null
    ? existingBlocks[0].order_index + 1
    : 0;

  // Create block
  const blockId = crypto.randomUUID();
  const { error: blockError } = await supabase
    .from("engagement_blocks")
    .insert({
      id: blockId,
      room_id: room.id,
      block_type: args.blockType,
      content: args.content,
      caption: args.caption,
      metadata: args.metadata || {},
      order_index: orderIndex,
      created_by: actor.type === "user" ? actor.id : null,
    });

  if (blockError) {
    return { success: false, error: `Failed to create block: ${blockError.message}` };
  }

  // Log event
  await logEvent(supabase, engagement.id, "block_added", {
    roomId: room.id,
    roomKey: args.roomKey,
    blockId,
    blockType: args.blockType,
    content: args.content.slice(0, 200), // Truncate for event log
  }, actor);

  return {
    success: true,
    data: {
      blockId,
      roomKey: args.roomKey,
      engagementId: engagement.id,
    },
  };
}

export async function handleLogDecision(
  supabase: SupabaseClient,
  args: {
    engagementSlug: string;
    title: string;
    decision: string;
    rationale?: string;
    attendees?: string[];
  },
  actor: ActorInfo
): Promise<ExecutionResult> {
  // Convenience wrapper - adds to meetings room with decision block type
  return handleAddBlock(
    supabase,
    {
      engagementSlug: args.engagementSlug,
      roomKey: "meetings",
      blockType: "decision",
      content: args.decision,
      metadata: {
        title: args.title,
        rationale: args.rationale,
        attendees: args.attendees,
        decidedAt: new Date().toISOString().split("T")[0],
      },
    },
    actor
  );
}

export async function handleAddNote(
  supabase: SupabaseClient,
  args: {
    engagementSlug: string;
    roomKey: string;
    content: string;
  },
  actor: ActorInfo
): Promise<ExecutionResult> {
  return handleAddBlock(
    supabase,
    {
      engagementSlug: args.engagementSlug,
      roomKey: args.roomKey,
      blockType: "text",
      content: args.content,
    },
    actor
  );
}

export async function handleUpdatePhase(
  supabase: SupabaseClient,
  args: {
    engagementSlug: string;
    phase: EngagementPhase;
    reason?: string;
  },
  actor: ActorInfo
): Promise<ExecutionResult> {
  // Get engagement with current phase
  const { data: engagement, error: engagementError } = await supabase
    .from("engagements")
    .select("id, phase")
    .eq("slug", args.engagementSlug)
    .single();

  if (engagementError || !engagement) {
    return { success: false, error: `Engagement not found: ${args.engagementSlug}` };
  }

  const fromPhase = engagement.phase;

  // Update phase
  const { error: updateError } = await supabase
    .from("engagements")
    .update({ phase: args.phase })
    .eq("id", engagement.id);

  if (updateError) {
    return { success: false, error: `Failed to update phase: ${updateError.message}` };
  }

  // Log phase transition
  await supabase
    .from("engagement_phase_transitions")
    .insert({
      engagement_id: engagement.id,
      from_phase: fromPhase,
      to_phase: args.phase,
      transitioned_by: actor.type === "user" ? actor.id : null,
      reason: args.reason,
    });

  // Log event
  await logEvent(supabase, engagement.id, "engagement_phase_changed", {
    fromPhase,
    toPhase: args.phase,
    reason: args.reason,
  }, actor);

  return {
    success: true,
    data: {
      engagementId: engagement.id,
      fromPhase,
      toPhase: args.phase,
    },
  };
}

// ── Event Logging ────────────────────────────────────────────────────────────

async function logEvent(
  supabase: SupabaseClient,
  engagementId: string,
  eventType: string,
  payload: Record<string, unknown>,
  actor: ActorInfo
): Promise<void> {
  // Include actor info in payload for AI tracking
  const enrichedPayload = {
    ...payload,
    actorType: actor.type,
    ...(actor.type === "ai" && actor.model ? { actorModel: actor.model } : {}),
  };

  await supabase.rpc("insert_engagement_event", {
    p_engagement_id: engagementId,
    p_event_type: eventType,
    p_payload: enrichedPayload,
    p_actor_id: actor.type === "user" ? actor.id : null,
    p_actor_type: actor.type,
  });
}

// ── Tool Router ──────────────────────────────────────────────────────────────

export async function executeTool(
  supabase: SupabaseClient,
  toolName: string,
  args: Record<string, unknown>,
  actor: ActorInfo
): Promise<ExecutionResult> {
  switch (toolName) {
    case "engagement.addBlock":
      return handleAddBlock(supabase, args as Parameters<typeof handleAddBlock>[1], actor);
    case "engagement.logDecision":
      return handleLogDecision(supabase, args as Parameters<typeof handleLogDecision>[1], actor);
    case "engagement.addNote":
      return handleAddNote(supabase, args as Parameters<typeof handleAddNote>[1], actor);
    case "engagement.updatePhase":
      return handleUpdatePhase(supabase, args as Parameters<typeof handleUpdatePhase>[1], actor);
    case "context.summarizeEmail":
      return handleSummarizeEmail(supabase, args as Parameters<typeof handleSummarizeEmail>[1]);
    case "context.summarizeMeeting":
      return handleSummarizeMeeting(supabase, args as Parameters<typeof handleSummarizeMeeting>[1]);
    case "context.ingestDocument":
      return handleIngestDocument(supabase, args as Parameters<typeof handleIngestDocument>[1]);
    default:
      return { success: false, error: `Unknown tool: ${toolName}` };
  }
}
