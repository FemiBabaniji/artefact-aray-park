// ════════════════════════════════════════════════════════════════════════════
// Sync Orchestrator (Composio-powered)
// Coordinates syncing content from integrations to ingestion queue
// Uses Composio's unified API for all provider interactions
// ════════════════════════════════════════════════════════════════════════════

import { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchEmails,
  fetchSlackMessages,
  fetchDiscordMessages,
  fetchZoomRecordings,
  getConnectionStatus,
} from "@/lib/composio/client";
import type { SyncResult, SuggestedBlock } from "@/types/integration";
import Anthropic from "@anthropic-ai/sdk";
import { withRetry } from "./retry";

// ── Types ────────────────────────────────────────────────────────────────────

type SourceItem = {
  sourceType: "email" | "meeting" | "slack" | "discord";
  sourceId: string;
  sourceData: Record<string, unknown>;
  content: string; // Text content for AI summarization
};

interface IntegrationSettings {
  connectionStatus?: string;
  composioAccountId?: string;
  slackChannelIds?: string[];
  discordGuildId?: string;
  discordChannelIds?: string[];
  clientDomains?: string[];
}

// Sync cursors for incremental fetching
interface SyncCursor {
  lastEmailId?: string;
  lastEmailDate?: string;
  lastSlackTs?: string;
  lastDiscordId?: string;
  lastZoomRecordingId?: string;
  lastZoomDate?: string;
}

// ── Main Sync Function ───────────────────────────────────────────────────────

/**
 * Sync an integration - fetch new content and add to ingestion queue
 */
export async function syncIntegration(
  supabase: SupabaseClient,
  integrationId: string
): Promise<SyncResult> {
  const startTime = new Date().toISOString();
  const errors: string[] = [];
  let itemsFound = 0;
  let itemsQueued = 0;
  let itemsAutoIngested = 0;

  // Fetch integration
  const { data: integration, error: fetchError } = await supabase
    .from("engagement_integrations")
    .select("*")
    .eq("id", integrationId)
    .single();

  if (fetchError || !integration) {
    return {
      success: false,
      itemsFound: 0,
      itemsQueued: 0,
      itemsAutoIngested: 0,
      errors: ["Integration not found"],
      syncedAt: startTime,
    };
  }

  // Check if enabled
  if (!integration.is_enabled) {
    return {
      success: false,
      itemsFound: 0,
      itemsQueued: 0,
      itemsAutoIngested: 0,
      errors: ["Integration is disabled"],
      syncedAt: startTime,
    };
  }

  // Get Composio account ID from credentials or settings
  const settings = integration.settings as IntegrationSettings;
  let composioAccountId = settings?.composioAccountId;

  // Try parsing credentials if no account ID in settings
  if (!composioAccountId && integration.credentials) {
    try {
      const creds = typeof integration.credentials === "string"
        ? JSON.parse(integration.credentials)
        : integration.credentials;
      composioAccountId = creds.composioAccountId;
    } catch {
      // Ignore parse errors
    }
  }

  if (!composioAccountId) {
    return {
      success: false,
      itemsFound: 0,
      itemsQueued: 0,
      itemsAutoIngested: 0,
      errors: ["No Composio account ID found. Please reconnect the integration."],
      syncedAt: startTime,
    };
  }

  // Verify connection is still active
  const connectionStatus = await getConnectionStatus(composioAccountId);
  if (!connectionStatus.isConnected) {
    // Update integration status
    await supabase
      .from("engagement_integrations")
      .update({
        settings: {
          ...settings,
          connectionStatus: "error",
          error: `Connection inactive: ${connectionStatus.status}`,
        },
      })
      .eq("id", integrationId);

    return {
      success: false,
      itemsFound: 0,
      itemsQueued: 0,
      itemsAutoIngested: 0,
      errors: [`Connection is not active (status: ${connectionStatus.status}). Please reconnect.`],
      syncedAt: startTime,
    };
  }

  // Fetch items based on integration type using Composio
  let items: SourceItem[] = [];

  // Retry options for Composio API calls
  const retryOptions = { maxRetries: 3, baseDelay: 1000 };

  try {
    switch (integration.integration_type) {
      case "gmail": {
        const result = await withRetry(
          () => fetchEmails({
            connectedAccountId: composioAccountId,
            toolkit: "gmail",
            maxResults: 50,
            after: integration.last_sync_at?.split("T")[0], // Date format: YYYY-MM-DD
          }),
          retryOptions
        );
        if (!result.success) {
          errors.push(result.error || "Failed to fetch Gmail emails");
        } else if (result.emails) {
          items = result.emails.map((email) => emailToSourceItem(email));
        }
        break;
      }

      case "outlook": {
        const result = await withRetry(
          () => fetchEmails({
            connectedAccountId: composioAccountId,
            toolkit: "outlook",
            maxResults: 50,
            after: integration.last_sync_at?.split("T")[0],
          }),
          retryOptions
        );
        if (!result.success) {
          errors.push(result.error || "Failed to fetch Outlook emails");
        } else if (result.emails) {
          items = result.emails.map((email) => emailToSourceItem(email));
        }
        break;
      }

      case "slack": {
        const channelIds = settings.slackChannelIds || [];
        if (channelIds.length === 0) {
          errors.push("No Slack channels configured");
          break;
        }

        for (const channelId of channelIds) {
          const result = await withRetry(
            () => fetchSlackMessages({
              connectedAccountId: composioAccountId,
              channel: channelId,
              limit: 50,
              oldest: integration.last_sync_at,
            }),
            retryOptions
          );
          if (!result.success) {
            errors.push(result.error || `Failed to fetch messages from channel ${channelId}`);
          } else if (result.messages) {
            items.push(...result.messages.map((msg) => chatToSourceItem(msg, "slack")));
          }
        }
        break;
      }

      case "discord": {
        const channelIds = settings.discordChannelIds || [];
        if (channelIds.length === 0) {
          errors.push("No Discord channels configured");
          break;
        }

        for (const channelId of channelIds) {
          const result = await withRetry(
            () => fetchDiscordMessages({
              connectedAccountId: composioAccountId,
              channelId,
              limit: 50,
            }),
            retryOptions
          );
          if (!result.success) {
            errors.push(result.error || `Failed to fetch messages from channel ${channelId}`);
          } else if (result.messages) {
            items.push(...result.messages.map((msg) => chatToSourceItem(msg, "discord")));
          }
        }
        break;
      }

      case "meeting":
      case "meetings":
      case "zoom": {
        const from = integration.last_sync_at?.split("T")[0];
        const result = await withRetry(
          () => fetchZoomRecordings({
            connectedAccountId: composioAccountId,
            from,
          }),
          retryOptions
        );
        if (!result.success) {
          errors.push(result.error || "Failed to fetch Zoom recordings");
        } else if (result.recordings) {
          items = result.recordings.map((rec) => meetingToSourceItem(rec));
        }
        break;
      }

      default:
        errors.push(`Unknown integration type: ${integration.integration_type}`);
    }
  } catch (error) {
    errors.push(`Sync failed: ${error}`);
  }

  itemsFound = items.length;

  // Process each item
  for (const item of items) {
    try {
      // Check if already in queue
      const { data: existing } = await supabase
        .from("ingestion_queue")
        .select("id")
        .eq("integration_id", integrationId)
        .eq("source_id", item.sourceId)
        .single();

      if (existing) {
        continue; // Already queued
      }

      // Generate AI summary and suggestions
      const { summary, suggestedRoom, suggestedBlock } = await generateSummaryAndSuggestions(
        item
      );

      // Determine initial status
      const status = integration.auto_ingest ? "auto_ingested" : "pending";

      // Add to queue
      const { error: insertError } = await supabase.from("ingestion_queue").insert({
        engagement_id: integration.engagement_id,
        integration_id: integrationId,
        source_type: item.sourceType,
        source_id: item.sourceId,
        source_data: item.sourceData,
        suggested_room: suggestedRoom,
        suggested_block: suggestedBlock,
        summary,
        status,
        processed_at: status === "auto_ingested" ? new Date().toISOString() : null,
      });

      if (insertError) {
        errors.push(`Failed to queue item ${item.sourceId}: ${insertError.message}`);
        continue;
      }

      if (status === "auto_ingested") {
        // Auto-ingest: add block to engagement room
        await autoIngestItem(
          supabase,
          integration.engagement_id,
          suggestedRoom || "meetings",
          suggestedBlock || { type: "text", content: summary || item.content }
        );
        itemsAutoIngested++;
      } else {
        itemsQueued++;
      }
    } catch (error) {
      errors.push(`Failed to process item ${item.sourceId}: ${error}`);
    }
  }

  // Build sync cursor from fetched items for incremental sync
  const newCursor = buildSyncCursor(items, integration.integration_type);
  const existingCursor = (integration.sync_cursor || {}) as SyncCursor;
  const mergedCursor = { ...existingCursor, ...newCursor };

  // Update last_sync_at, connection status, and sync cursor
  await supabase
    .from("engagement_integrations")
    .update({
      last_sync_at: startTime,
      sync_cursor: mergedCursor,
      settings: {
        ...settings,
        connectionStatus: "connected",
        lastSyncAt: startTime,
      },
      updated_at: startTime,
    })
    .eq("id", integrationId);

  return {
    success: errors.length === 0,
    itemsFound,
    itemsQueued,
    itemsAutoIngested,
    errors,
    syncedAt: startTime,
  };
}

/**
 * Build sync cursor from fetched items to track position for next sync
 */
function buildSyncCursor(items: SourceItem[], integrationType: string): SyncCursor {
  if (items.length === 0) return {};

  const cursor: SyncCursor = {};

  switch (integrationType) {
    case "gmail":
    case "outlook": {
      // Find the latest email by date
      const latestEmail = items.reduce((latest, item) => {
        const itemDate = (item.sourceData.date as string) || "";
        const latestDate = (latest.sourceData.date as string) || "";
        return itemDate > latestDate ? item : latest;
      }, items[0]);
      cursor.lastEmailId = latestEmail.sourceId;
      cursor.lastEmailDate = latestEmail.sourceData.date as string;
      break;
    }

    case "slack": {
      // Find the latest message by timestamp
      const latestMsg = items.reduce((latest, item) => {
        const itemTs = (item.sourceData.timestamp as string) || "0";
        const latestTs = (latest.sourceData.timestamp as string) || "0";
        return parseFloat(itemTs) > parseFloat(latestTs) ? item : latest;
      }, items[0]);
      cursor.lastSlackTs = latestMsg.sourceData.timestamp as string;
      break;
    }

    case "discord": {
      // Discord IDs are snowflakes (time-sortable)
      const latestMsg = items.reduce((latest, item) => {
        return BigInt(item.sourceId) > BigInt(latest.sourceId) ? item : latest;
      }, items[0]);
      cursor.lastDiscordId = latestMsg.sourceId;
      break;
    }

    case "meeting":
    case "meetings":
    case "zoom": {
      // Find the latest recording
      const latestRec = items.reduce((latest, item) => {
        const itemDate = (item.sourceData.startTime as string) || "";
        const latestDate = (latest.sourceData.startTime as string) || "";
        return itemDate > latestDate ? item : latest;
      }, items[0]);
      cursor.lastZoomRecordingId = latestRec.sourceId;
      cursor.lastZoomDate = latestRec.sourceData.startTime as string;
      break;
    }
  }

  return cursor;
}

// ── Content Conversion ───────────────────────────────────────────────────────

interface EmailData {
  id: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  body?: string;
}

interface SlackMessageData {
  id: string;
  text: string;
  user: string;
  timestamp: string;
  channel: string;
}

interface DiscordMessageData {
  id: string;
  content: string;
  author: string;
  timestamp: string;
}

interface ZoomRecordingData {
  id: string;
  topic: string;
  startTime: string;
  duration: number;
  downloadUrl?: string;
  transcriptUrl?: string;
}

function emailToSourceItem(email: EmailData): SourceItem {
  return {
    sourceType: "email",
    sourceId: email.id,
    sourceData: {
      subject: email.subject,
      from: email.from,
      to: email.to,
      date: email.date,
      preview: email.snippet,
    },
    content: `Subject: ${email.subject}\nFrom: ${email.from}\nDate: ${email.date}\n\n${email.body || email.snippet}`,
  };
}

function chatToSourceItem(
  msg: SlackMessageData | DiscordMessageData,
  platform: "slack" | "discord"
): SourceItem {
  if (platform === "slack") {
    const slackMsg = msg as SlackMessageData;
    return {
      sourceType: "slack",
      sourceId: slackMsg.id,
      sourceData: {
        channelId: slackMsg.channel,
        author: slackMsg.user,
        timestamp: slackMsg.timestamp,
      },
      content: `[${slackMsg.channel}] ${slackMsg.user}: ${slackMsg.text}`,
    };
  } else {
    const discordMsg = msg as DiscordMessageData;
    return {
      sourceType: "discord",
      sourceId: discordMsg.id,
      sourceData: {
        author: discordMsg.author,
        timestamp: discordMsg.timestamp,
      },
      content: `${discordMsg.author}: ${discordMsg.content}`,
    };
  }
}

function meetingToSourceItem(recording: ZoomRecordingData): SourceItem {
  return {
    sourceType: "meeting",
    sourceId: recording.id,
    sourceData: {
      meetingTitle: recording.topic,
      startTime: recording.startTime,
      duration: recording.duration,
      hasDownload: !!recording.downloadUrl,
      hasTranscript: !!recording.transcriptUrl,
    },
    content: `Meeting: ${recording.topic}\nDate: ${recording.startTime}\nDuration: ${recording.duration} minutes`,
  };
}

// ── AI Summarization ─────────────────────────────────────────────────────────

async function generateSummaryAndSuggestions(item: SourceItem): Promise<{
  summary: string | null;
  suggestedRoom: string | null;
  suggestedBlock: SuggestedBlock | null;
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // No AI available, use basic extraction
    return {
      summary: item.content.slice(0, 500),
      suggestedRoom: getSuggestedRoom(item.sourceType),
      suggestedBlock: {
        type: "text",
        content: item.content.slice(0, 2000),
      },
    };
  }

  try {
    const anthropic = new Anthropic({ apiKey });

    const prompt = buildSummaryPrompt(item);

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Parse response
    return parseSummaryResponse(responseText, item);
  } catch (error) {
    console.error("AI summarization failed:", error);
    return {
      summary: item.content.slice(0, 500),
      suggestedRoom: getSuggestedRoom(item.sourceType),
      suggestedBlock: {
        type: "text",
        content: item.content.slice(0, 2000),
      },
    };
  }
}

function buildSummaryPrompt(item: SourceItem): string {
  const typeLabels = {
    email: "email",
    meeting: "meeting transcript",
    slack: "Slack message",
    discord: "Discord message",
  };

  return `Analyze this ${typeLabels[item.sourceType]} and provide:
1. A brief summary (2-3 sentences)
2. Key decisions or action items (if any)
3. Suggested engagement room (one of: research, meetings, strategy, documents)
4. Relevance score (1-10) for a consulting engagement

Content:
${item.content.slice(0, 8000)}

Respond in JSON format:
{
  "summary": "...",
  "decisions": ["..."],
  "actionItems": ["..."],
  "suggestedRoom": "meetings|research|strategy|documents",
  "relevanceScore": 8
}`;
}

function parseSummaryResponse(
  response: string,
  item: SourceItem
): {
  summary: string | null;
  suggestedRoom: string | null;
  suggestedBlock: SuggestedBlock | null;
} {
  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const summary = parsed.summary || item.content.slice(0, 500);
    const suggestedRoom = parsed.suggestedRoom || getSuggestedRoom(item.sourceType);

    // Build block content
    let blockContent = `## ${item.sourceType === "email" ? "Email Summary" : item.sourceType === "meeting" ? "Meeting Notes" : "Message Summary"}\n\n${summary}`;

    if (parsed.decisions?.length) {
      blockContent += "\n\n**Decisions:**\n" + parsed.decisions.map((d: string) => `- ${d}`).join("\n");
    }

    if (parsed.actionItems?.length) {
      blockContent += "\n\n**Action Items:**\n" + parsed.actionItems.map((a: string) => `- ${a}`).join("\n");
    }

    return {
      summary,
      suggestedRoom,
      suggestedBlock: {
        type: parsed.decisions?.length ? "decision" : "text",
        content: blockContent,
        metadata: {
          sourceType: item.sourceType,
          sourceId: item.sourceId,
          relevanceScore: parsed.relevanceScore,
          ingestedAt: new Date().toISOString(),
        },
      },
    };
  } catch {
    return {
      summary: item.content.slice(0, 500),
      suggestedRoom: getSuggestedRoom(item.sourceType),
      suggestedBlock: {
        type: "text",
        content: item.content.slice(0, 2000),
      },
    };
  }
}

function getSuggestedRoom(sourceType: "email" | "meeting" | "slack" | "discord"): string {
  switch (sourceType) {
    case "email":
      return "meetings";
    case "meeting":
      return "meetings";
    case "slack":
    case "discord":
      return "research";
    default:
      return "documents";
  }
}

// ── Auto-Ingestion ───────────────────────────────────────────────────────────

async function autoIngestItem(
  supabase: SupabaseClient,
  engagementId: string,
  roomKey: string,
  block: SuggestedBlock
): Promise<void> {
  // Get room
  let roomId: string | null = null;

  const { data: room } = await supabase
    .from("engagement_rooms")
    .select("id")
    .eq("engagement_id", engagementId)
    .eq("key", roomKey)
    .single();

  if (room) {
    roomId = room.id;
  } else {
    // Try fallback to 'meetings' room
    const { data: fallbackRoom } = await supabase
      .from("engagement_rooms")
      .select("id")
      .eq("engagement_id", engagementId)
      .eq("key", "meetings")
      .single();

    if (fallbackRoom) {
      roomId = fallbackRoom.id;
    }
  }

  if (!roomId) {
    console.error(`Room ${roomKey} not found for engagement ${engagementId}`);
    return;
  }

  // Get next order index atomically (prevents race conditions)
  const { data: nextOrder } = await supabase.rpc("get_next_block_order", {
    p_room_id: roomId,
  });

  // Insert block
  await supabase.from("engagement_blocks").insert({
    room_id: roomId,
    block_type: block.type,
    content: block.content,
    metadata: block.metadata || {},
    order_index: nextOrder ?? 0,
    updated_by_type: "system",
  });
}

// ── Batch Sync ───────────────────────────────────────────────────────────────

/**
 * Sync all active integrations (for cron job)
 */
export async function syncAllIntegrations(
  supabase: SupabaseClient,
  options?: {
    maxAge?: number; // Only sync integrations not synced in this many minutes
    limit?: number; // Max integrations to sync
  }
): Promise<{
  synced: number;
  errors: number;
  results: Array<{ integrationId: string; result: SyncResult }>;
}> {
  const maxAge = options?.maxAge || 15; // Default 15 minutes
  const limit = options?.limit || 50;

  // Find integrations to sync
  const cutoff = new Date(Date.now() - maxAge * 60 * 1000).toISOString();

  const { data: integrations, error } = await supabase
    .from("engagement_integrations")
    .select("id")
    .eq("is_enabled", true)
    .or(`last_sync_at.is.null,last_sync_at.lt.${cutoff}`)
    .limit(limit);

  if (error || !integrations) {
    return { synced: 0, errors: 1, results: [] };
  }

  const results: Array<{ integrationId: string; result: SyncResult }> = [];
  let synced = 0;
  let errorCount = 0;

  // Sync each integration
  for (const integration of integrations) {
    const result = await syncIntegration(supabase, integration.id);
    results.push({ integrationId: integration.id, result });

    if (result.success) {
      synced++;
    } else {
      errorCount++;
    }
  }

  return { synced, errors: errorCount, results };
}
