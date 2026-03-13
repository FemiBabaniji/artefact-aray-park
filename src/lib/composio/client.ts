// ════════════════════════════════════════════════════════════════════════════
// Composio Client Wrapper
// Manages OAuth connections and tool execution via Composio's unified API
// ════════════════════════════════════════════════════════════════════════════

import { Composio } from "@composio/client";

// Singleton instance
let composioInstance: Composio | null = null;

/**
 * Get the Composio client instance
 * Requires COMPOSIO_API_KEY environment variable
 */
export function getComposioClient(): Composio {
  if (!composioInstance) {
    const apiKey = process.env.COMPOSIO_API_KEY;
    if (!apiKey) {
      throw new Error("COMPOSIO_API_KEY environment variable is not set");
    }
    composioInstance = new Composio({ apiKey });
  }
  return composioInstance;
}

// Map our integration types to Composio toolkit slugs
export const INTEGRATION_TO_TOOLKIT: Record<string, string> = {
  gmail: "gmail",
  outlook: "outlook",
  slack: "slack",
  discord: "discord",
  zoom: "zoom",
  meetings: "zoom", // Alias for meetings
};

// Map Composio toolkit slugs back to our integration types
export const TOOLKIT_TO_INTEGRATION: Record<string, string> = {
  gmail: "gmail",
  outlook: "outlook",
  slack: "slack",
  discord: "discord",
  zoom: "meetings",
};

// Tools we use for each integration type
export const INTEGRATION_TOOLS: Record<string, string[]> = {
  gmail: ["GMAIL_FETCH_EMAILS", "GMAIL_SEND_EMAIL"],
  outlook: ["OUTLOOK_FETCH_EMAILS", "OUTLOOK_SEND_EMAIL"],
  slack: ["SLACK_LIST_MESSAGES", "SLACK_SEND_MESSAGE"],
  discord: ["DISCORD_GET_MESSAGES", "DISCORD_SEND_MESSAGE"],
  zoom: ["ZOOM_LIST_RECORDINGS", "ZOOM_GET_MEETING_RECORDINGS"],
};

export interface ComposioConnectionResult {
  success: boolean;
  connectedAccountId?: string;
  redirectUrl?: string;
  error?: string;
}

/**
 * Initiate an OAuth connection for a user
 */
export async function initiateConnection(params: {
  userId: string;
  toolkit: string;
  callbackUrl: string;
  engagementId: string;
  integrationId: string;
}): Promise<ComposioConnectionResult> {
  const client = getComposioClient();

  try {
    // First, get the auth config for the toolkit
    const authConfigs = await client.authConfigs.list({
      toolkit_slug: params.toolkit,
    });

    if (!authConfigs.items?.length) {
      return {
        success: false,
        error: `No auth config found for toolkit: ${params.toolkit}`,
      };
    }

    const authConfigId = authConfigs.items[0].id;

    // Create a link session for the user
    const linkResponse = await client.link.create({
      auth_config_id: authConfigId,
      user_id: params.userId,
      callback_url: params.callbackUrl,
    });

    return {
      success: true,
      connectedAccountId: linkResponse.connected_account_id,
      redirectUrl: linkResponse.redirect_url,
    };
  } catch (error) {
    console.error("Composio connection error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to initiate connection",
    };
  }
}

/**
 * Get the status of a connected account
 */
export async function getConnectionStatus(connectedAccountId: string): Promise<{
  isConnected: boolean;
  status: string;
  userInfo?: { email?: string; name?: string };
}> {
  const client = getComposioClient();

  try {
    const account = await client.connectedAccounts.retrieve(connectedAccountId);

    const isConnected = account.status === "ACTIVE";

    // Try to extract user info from state or data fields
    const state = account.state as unknown as Record<string, unknown> | undefined;
    const data = account.data as unknown as Record<string, unknown> | undefined;

    const email = (state?.email || data?.email) as string | undefined;
    const name = (state?.name || data?.name) as string | undefined;

    return {
      isConnected,
      status: account.status,
      userInfo: email || name ? { email, name } : undefined,
    };
  } catch {
    return {
      isConnected: false,
      status: "UNKNOWN",
    };
  }
}

/**
 * List connected accounts for a user
 */
export async function listUserConnections(userId: string): Promise<
  Array<{
    id: string;
    toolkit: string;
    status: string;
    userInfo?: { email?: string };
  }>
> {
  const client = getComposioClient();

  try {
    const connections = await client.connectedAccounts.list({
      user_ids: [userId],
    });

    return (connections.items || []).map((conn) => {
      // Try to extract email from data
      const data = (conn as { data?: Record<string, unknown> }).data;
      const email = data?.email as string | undefined;

      return {
        id: conn.id,
        toolkit: conn.toolkit?.slug || "unknown",
        status: conn.status,
        userInfo: email ? { email } : undefined,
      };
    });
  } catch (error) {
    console.error("Failed to list user connections:", error);
    return [];
  }
}

/**
 * Disconnect an account
 */
export async function disconnectAccount(connectedAccountId: string): Promise<boolean> {
  const client = getComposioClient();

  try {
    await client.connectedAccounts.delete(connectedAccountId);
    return true;
  } catch (error) {
    console.error("Failed to disconnect account:", error);
    return false;
  }
}

/**
 * Execute a Composio tool
 */
export async function executeTool(params: {
  toolSlug: string;
  connectedAccountId: string;
  arguments?: Record<string, unknown>;
}): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const client = getComposioClient();

  try {
    const result = await client.tools.execute(params.toolSlug, {
      connected_account_id: params.connectedAccountId,
      arguments: params.arguments,
    });

    return {
      success: result.successful === true,
      data: result.data,
      error: result.error || undefined,
    };
  } catch (error) {
    console.error(`Tool execution failed (${params.toolSlug}):`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Tool execution failed",
    };
  }
}

/**
 * Fetch emails using Composio Gmail or Outlook tools
 */
export async function fetchEmails(params: {
  connectedAccountId: string;
  toolkit: "gmail" | "outlook";
  query?: string;
  maxResults?: number;
  after?: string;
}): Promise<{
  success: boolean;
  emails?: Array<{
    id: string;
    subject: string;
    from: string;
    to: string;
    date: string;
    snippet: string;
    body?: string;
  }>;
  error?: string;
}> {
  const toolSlug = params.toolkit === "gmail"
    ? "GMAIL_FETCH_EMAILS"
    : "OUTLOOK_FETCH_EMAILS";

  const toolArgs: Record<string, unknown> = {
    max_results: params.maxResults || 20,
  };

  if (params.query) {
    toolArgs.query = params.query;
  }

  if (params.after) {
    toolArgs.query = (toolArgs.query ? `${toolArgs.query} ` : "") + `after:${params.after}`;
  }

  const result = await executeTool({
    toolSlug,
    connectedAccountId: params.connectedAccountId,
    arguments: toolArgs,
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Normalize the response format
  const rawEmails = Array.isArray(result.data) ? result.data : [];
  const emails = rawEmails.map((email: Record<string, unknown>) => ({
    id: String(email.id || email.messageId || ""),
    subject: String(email.subject || ""),
    from: String(email.from || email.sender || ""),
    to: String(email.to || email.recipients || ""),
    date: String(email.date || email.receivedDateTime || ""),
    snippet: String(email.snippet || email.preview || ""),
    body: email.body ? String(email.body) : undefined,
  }));

  return { success: true, emails };
}

/**
 * Fetch Slack messages using Composio
 */
export async function fetchSlackMessages(params: {
  connectedAccountId: string;
  channel?: string;
  limit?: number;
  oldest?: string;
}): Promise<{
  success: boolean;
  messages?: Array<{
    id: string;
    text: string;
    user: string;
    timestamp: string;
    channel: string;
  }>;
  error?: string;
}> {
  const result = await executeTool({
    toolSlug: "SLACK_LIST_MESSAGES",
    connectedAccountId: params.connectedAccountId,
    arguments: {
      channel: params.channel,
      limit: params.limit || 50,
      oldest: params.oldest,
    },
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  const rawMessages = Array.isArray(result.data)
    ? result.data
    : (result.data as Record<string, unknown>)?.messages || [];

  const messages = (rawMessages as Array<Record<string, unknown>>).map((msg) => ({
    id: String(msg.ts || msg.id || ""),
    text: String(msg.text || ""),
    user: String(msg.user || ""),
    timestamp: String(msg.ts || ""),
    channel: String(msg.channel || params.channel || ""),
  }));

  return { success: true, messages };
}

/**
 * Fetch Discord messages using Composio
 */
export async function fetchDiscordMessages(params: {
  connectedAccountId: string;
  channelId: string;
  limit?: number;
  after?: string;
}): Promise<{
  success: boolean;
  messages?: Array<{
    id: string;
    content: string;
    author: string;
    timestamp: string;
  }>;
  error?: string;
}> {
  const result = await executeTool({
    toolSlug: "DISCORD_GET_MESSAGES",
    connectedAccountId: params.connectedAccountId,
    arguments: {
      channel_id: params.channelId,
      limit: params.limit || 50,
      after: params.after,
    },
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  const rawMessages = Array.isArray(result.data) ? result.data : [];
  const messages = (rawMessages as Array<Record<string, unknown>>).map((msg) => ({
    id: String(msg.id || ""),
    content: String(msg.content || ""),
    author: String((msg.author as Record<string, unknown>)?.username || msg.author || ""),
    timestamp: String(msg.timestamp || ""),
  }));

  return { success: true, messages };
}

/**
 * Fetch Zoom recordings using Composio
 */
export async function fetchZoomRecordings(params: {
  connectedAccountId: string;
  from?: string;
  to?: string;
}): Promise<{
  success: boolean;
  recordings?: Array<{
    id: string;
    topic: string;
    startTime: string;
    duration: number;
    downloadUrl?: string;
    transcriptUrl?: string;
  }>;
  error?: string;
}> {
  const result = await executeTool({
    toolSlug: "ZOOM_LIST_RECORDINGS",
    connectedAccountId: params.connectedAccountId,
    arguments: {
      from: params.from,
      to: params.to,
    },
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  const data = result.data as Record<string, unknown>;
  const rawMeetings = Array.isArray(data?.meetings) ? data.meetings : [];

  const recordings = (rawMeetings as Array<Record<string, unknown>>).map((meeting) => {
    const files = Array.isArray(meeting.recording_files) ? meeting.recording_files : [];
    const transcript = (files as Array<Record<string, unknown>>).find(
      (f) => f.file_type === "TRANSCRIPT"
    );
    const video = (files as Array<Record<string, unknown>>).find(
      (f) => f.file_type === "MP4"
    );

    return {
      id: String(meeting.uuid || meeting.id || ""),
      topic: String(meeting.topic || ""),
      startTime: String(meeting.start_time || ""),
      duration: Number(meeting.duration || 0),
      downloadUrl: video ? String(video.download_url || "") : undefined,
      transcriptUrl: transcript ? String(transcript.download_url || "") : undefined,
    };
  });

  return { success: true, recordings };
}

// ════════════════════════════════════════════════════════════════════════════
// Trigger Management (for real-time webhooks)
// ════════════════════════════════════════════════════════════════════════════

// Map integration types to their trigger names
export const INTEGRATION_TRIGGERS: Record<string, string[]> = {
  gmail: ["GMAIL_NEW_EMAIL"],
  outlook: ["OUTLOOK_NEW_EMAIL"],
  slack: ["SLACK_NEW_MESSAGE"],
  discord: ["DISCORD_NEW_MESSAGE"],
  zoom: ["ZOOM_RECORDING_COMPLETED"],
};

export interface TriggerSubscription {
  triggerId: string;
  triggerName: string;
  status: string;
}

/**
 * Subscribe to a trigger for real-time events
 * This sets up a webhook subscription with Composio
 */
export async function subscribeTrigger(params: {
  connectedAccountId: string;
  triggerName: string;
  webhookUrl: string;
  config?: Record<string, unknown>;
}): Promise<{
  success: boolean;
  triggerId?: string;
  error?: string;
}> {
  const client = getComposioClient();

  try {
    // Create trigger subscription
    // Use type assertion for Composio API compatibility
    const triggerParams = {
      connected_account_id: params.connectedAccountId,
      trigger_config: {
        webhook_url: params.webhookUrl,
        ...params.config,
      },
    };

    const result = await client.triggerInstances.upsert(
      params.triggerName,
      triggerParams as Parameters<typeof client.triggerInstances.upsert>[1]
    );

    // Extract trigger ID from result
    const resultObj = result as unknown as Record<string, unknown>;
    const triggerId = resultObj.trigger_id || resultObj.id || resultObj.triggerId;

    return {
      success: true,
      triggerId: triggerId ? String(triggerId) : undefined,
    };
  } catch (error) {
    console.error(`Failed to subscribe trigger ${params.triggerName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to subscribe trigger",
    };
  }
}

/**
 * Unsubscribe from a trigger
 */
export async function unsubscribeTrigger(triggerId: string): Promise<boolean> {
  const client = getComposioClient();

  try {
    // Use type assertion for API compatibility
    const deleteMethod = client.triggerInstances as unknown as {
      delete?: (id: string) => Promise<void>;
      manage?: { delete: (id: string) => Promise<void> };
    };

    if (deleteMethod.delete) {
      await deleteMethod.delete(triggerId);
    } else if (deleteMethod.manage?.delete) {
      await deleteMethod.manage.delete(triggerId);
    }
    return true;
  } catch (error) {
    console.error(`Failed to unsubscribe trigger ${triggerId}:`, error);
    return false;
  }
}

/**
 * List active triggers for a connected account
 */
export async function listTriggers(connectedAccountId: string): Promise<TriggerSubscription[]> {
  const client = getComposioClient();

  try {
    // Use correct parameter name for API
    const triggers = await client.triggerInstances.listActive({
      connected_account_ids: [connectedAccountId],
    });

    const items = (triggers as unknown as { items?: unknown[] }).items || [];
    return items.map((t) => {
      const trigger = t as Record<string, unknown>;
      return {
        triggerId: String(trigger.id || ""),
        triggerName: String(trigger.trigger_name || trigger.name || "unknown"),
        status: trigger.state ? "active" : "unknown",
      };
    });
  } catch (error) {
    console.error("Failed to list triggers:", error);
    return [];
  }
}

/**
 * Set up all relevant triggers for an integration
 * Called after OAuth completes
 */
export async function setupIntegrationTriggers(params: {
  connectedAccountId: string;
  integrationType: string;
  webhookUrl: string;
  config?: {
    slackChannelIds?: string[];
    discordChannelIds?: string[];
  };
}): Promise<{
  success: boolean;
  triggers: Array<{ name: string; triggerId?: string; error?: string }>;
}> {
  const triggerNames = INTEGRATION_TRIGGERS[params.integrationType] || [];
  const results: Array<{ name: string; triggerId?: string; error?: string }> = [];

  for (const triggerName of triggerNames) {
    // Build config based on trigger type
    let triggerConfig: Record<string, unknown> = {};

    if (triggerName.includes("SLACK") && params.config?.slackChannelIds?.length) {
      triggerConfig.channel_ids = params.config.slackChannelIds;
    }

    if (triggerName.includes("DISCORD") && params.config?.discordChannelIds?.length) {
      triggerConfig.channel_ids = params.config.discordChannelIds;
    }

    const result = await subscribeTrigger({
      connectedAccountId: params.connectedAccountId,
      triggerName,
      webhookUrl: params.webhookUrl,
      config: triggerConfig,
    });

    results.push({
      name: triggerName,
      triggerId: result.triggerId,
      error: result.error,
    });
  }

  const allSucceeded = results.every((r) => r.triggerId);

  return {
    success: allSucceeded,
    triggers: results,
  };
}

/**
 * Remove all triggers for an integration (called on disconnect)
 */
export async function removeIntegrationTriggers(triggerIds: string[]): Promise<number> {
  let removed = 0;

  for (const triggerId of triggerIds) {
    const success = await unsubscribeTrigger(triggerId);
    if (success) removed++;
  }

  return removed;
}

// ════════════════════════════════════════════════════════════════════════════
// Channel Listing (for Slack/Discord channel selector)
// ════════════════════════════════════════════════════════════════════════════

export interface Channel {
  id: string;
  name: string;
  isPrivate?: boolean;
  memberCount?: number;
}

/**
 * Fetch Slack channels for channel selector
 */
export async function fetchSlackChannels(params: {
  connectedAccountId: string;
  types?: string; // "public_channel,private_channel"
  limit?: number;
}): Promise<{
  success: boolean;
  channels?: Channel[];
  error?: string;
}> {
  const result = await executeTool({
    toolSlug: "SLACK_LIST_CHANNELS",
    connectedAccountId: params.connectedAccountId,
    arguments: {
      types: params.types || "public_channel,private_channel",
      limit: params.limit || 200,
    },
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  const data = result.data as Record<string, unknown>;
  const rawChannels = Array.isArray(data?.channels)
    ? data.channels
    : Array.isArray(result.data)
    ? result.data
    : [];

  const channels: Channel[] = (rawChannels as Array<Record<string, unknown>>).map((ch) => ({
    id: String(ch.id || ""),
    name: String(ch.name || ""),
    isPrivate: ch.is_private === true,
    memberCount: typeof ch.num_members === "number" ? ch.num_members : undefined,
  }));

  return { success: true, channels };
}

/**
 * Fetch Discord channels for channel selector
 */
export async function fetchDiscordChannels(params: {
  connectedAccountId: string;
  guildId?: string;
}): Promise<{
  success: boolean;
  channels?: Channel[];
  guilds?: Array<{ id: string; name: string }>;
  error?: string;
}> {
  // First get guilds if no guildId specified
  let guilds: Array<{ id: string; name: string }> = [];

  if (!params.guildId) {
    const guildsResult = await executeTool({
      toolSlug: "DISCORD_GET_GUILDS",
      connectedAccountId: params.connectedAccountId,
      arguments: {},
    });

    if (guildsResult.success) {
      const rawGuilds = Array.isArray(guildsResult.data) ? guildsResult.data : [];
      guilds = (rawGuilds as Array<Record<string, unknown>>).map((g) => ({
        id: String(g.id || ""),
        name: String(g.name || ""),
      }));

      if (guilds.length === 0) {
        return { success: true, channels: [], guilds: [] };
      }
    }
  }

  // Get channels for the guild
  const targetGuildId = params.guildId || guilds[0]?.id;
  if (!targetGuildId) {
    return { success: false, error: "No guild ID available" };
  }

  const channelsResult = await executeTool({
    toolSlug: "DISCORD_GET_CHANNELS",
    connectedAccountId: params.connectedAccountId,
    arguments: {
      guild_id: targetGuildId,
    },
  });

  if (!channelsResult.success) {
    return { success: false, error: channelsResult.error, guilds };
  }

  const rawChannels = Array.isArray(channelsResult.data) ? channelsResult.data : [];

  // Filter to text channels (type 0)
  const channels: Channel[] = (rawChannels as Array<Record<string, unknown>>)
    .filter((ch) => ch.type === 0 || ch.type === "GUILD_TEXT")
    .map((ch) => ({
      id: String(ch.id || ""),
      name: String(ch.name || ""),
    }));

  return { success: true, channels, guilds };
}

// ════════════════════════════════════════════════════════════════════════════
// Zoom Transcript Fetching
// ════════════════════════════════════════════════════════════════════════════

/**
 * Fetch Zoom meeting transcript content
 */
export async function fetchZoomTranscript(params: {
  connectedAccountId: string;
  meetingId: string;
}): Promise<{
  success: boolean;
  transcript?: string;
  error?: string;
}> {
  // Try to get recording details with transcript
  const result = await executeTool({
    toolSlug: "ZOOM_GET_RECORDING",
    connectedAccountId: params.connectedAccountId,
    arguments: {
      meeting_id: params.meetingId,
    },
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  const data = result.data as Record<string, unknown>;
  const files = Array.isArray(data?.recording_files) ? data.recording_files : [];

  // Find transcript file
  const transcriptFile = (files as Array<Record<string, unknown>>).find(
    (f) => f.file_type === "TRANSCRIPT" || f.recording_type === "audio_transcript"
  );

  if (!transcriptFile?.download_url) {
    return { success: false, error: "No transcript available for this meeting" };
  }

  // Fetch transcript content using proxy tool
  try {
    const transcriptResult = await executeTool({
      toolSlug: "ZOOM_DOWNLOAD_RECORDING",
      connectedAccountId: params.connectedAccountId,
      arguments: {
        download_url: transcriptFile.download_url,
      },
    });

    if (transcriptResult.success && transcriptResult.data) {
      const content = typeof transcriptResult.data === "string"
        ? transcriptResult.data
        : JSON.stringify(transcriptResult.data);
      return { success: true, transcript: content };
    }
  } catch {
    // Fall back to returning just the URL
  }

  return {
    success: true,
    transcript: `[Transcript available at: ${transcriptFile.download_url}]`,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// Email Thread Grouping
// ════════════════════════════════════════════════════════════════════════════

export interface EmailThread {
  threadId: string;
  subject: string;
  participants: string[];
  messageCount: number;
  latestDate: string;
  messages: Array<{
    id: string;
    from: string;
    date: string;
    snippet: string;
  }>;
}

/**
 * Fetch emails grouped by thread
 */
export async function fetchEmailThreads(params: {
  connectedAccountId: string;
  toolkit: "gmail" | "outlook";
  maxResults?: number;
  after?: string;
}): Promise<{
  success: boolean;
  threads?: EmailThread[];
  error?: string;
}> {
  // For Gmail, use thread-based fetching
  if (params.toolkit === "gmail") {
    const result = await executeTool({
      toolSlug: "GMAIL_LIST_THREADS",
      connectedAccountId: params.connectedAccountId,
      arguments: {
        max_results: params.maxResults || 20,
        query: params.after ? `after:${params.after}` : undefined,
      },
    });

    if (!result.success) {
      // Fall back to regular email fetch and group manually
      return fetchAndGroupEmails(params);
    }

    const data = result.data as Record<string, unknown>;
    const rawThreads = Array.isArray(data?.threads) ? data.threads : [];

    const threads: EmailThread[] = (rawThreads as Array<Record<string, unknown>>).map((t) => {
      const messages = Array.isArray(t.messages) ? t.messages : [];
      const participants = new Set<string>();

      (messages as Array<Record<string, unknown>>).forEach((m) => {
        if (m.from) participants.add(String(m.from));
        if (m.to) participants.add(String(m.to));
      });

      return {
        threadId: String(t.id || t.threadId || ""),
        subject: String(t.subject || (messages[0] as Record<string, unknown>)?.subject || ""),
        participants: Array.from(participants),
        messageCount: messages.length,
        latestDate: String(t.date || (messages[messages.length - 1] as Record<string, unknown>)?.date || ""),
        messages: (messages as Array<Record<string, unknown>>).map((m) => ({
          id: String(m.id || ""),
          from: String(m.from || ""),
          date: String(m.date || ""),
          snippet: String(m.snippet || ""),
        })),
      };
    });

    return { success: true, threads };
  }

  // For Outlook and fallback, fetch and group manually
  return fetchAndGroupEmails(params);
}

/**
 * Helper to fetch emails and group them by conversation/thread
 */
async function fetchAndGroupEmails(params: {
  connectedAccountId: string;
  toolkit: "gmail" | "outlook";
  maxResults?: number;
  after?: string;
}): Promise<{
  success: boolean;
  threads?: EmailThread[];
  error?: string;
}> {
  const emailsResult = await fetchEmails(params);

  if (!emailsResult.success || !emailsResult.emails) {
    return { success: false, error: emailsResult.error };
  }

  // Group by subject (normalized)
  const threadMap = new Map<string, EmailThread>();

  for (const email of emailsResult.emails) {
    // Normalize subject (remove Re:, Fwd:, etc.)
    const normalizedSubject = email.subject
      .replace(/^(re|fwd|fw):\s*/gi, "")
      .trim()
      .toLowerCase();

    const existing = threadMap.get(normalizedSubject);

    if (existing) {
      existing.messageCount++;
      if (!existing.participants.includes(email.from)) {
        existing.participants.push(email.from);
      }
      if (email.date > existing.latestDate) {
        existing.latestDate = email.date;
      }
      existing.messages.push({
        id: email.id,
        from: email.from,
        date: email.date,
        snippet: email.snippet,
      });
    } else {
      threadMap.set(normalizedSubject, {
        threadId: email.id, // Use first email ID as thread ID
        subject: email.subject,
        participants: [email.from],
        messageCount: 1,
        latestDate: email.date,
        messages: [{
          id: email.id,
          from: email.from,
          date: email.date,
          snippet: email.snippet,
        }],
      });
    }
  }

  // Sort threads by latest date
  const threads = Array.from(threadMap.values()).sort(
    (a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime()
  );

  return { success: true, threads };
}
