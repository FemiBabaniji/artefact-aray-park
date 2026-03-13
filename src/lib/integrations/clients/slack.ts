// ════════════════════════════════════════════════════════════════════════════
// Slack Sync Client
// Fetches messages from Slack channels via Slack Web API
// ════════════════════════════════════════════════════════════════════════════

import type { ChatMessage } from "@/types/integration";

const SLACK_API_BASE = "https://slack.com/api";

type SlackConversationsHistoryResponse = {
  ok: boolean;
  messages?: SlackMessage[];
  has_more?: boolean;
  response_metadata?: { next_cursor?: string };
  error?: string;
};

type SlackConversationsListResponse = {
  ok: boolean;
  channels?: SlackChannel[];
  response_metadata?: { next_cursor?: string };
  error?: string;
};

type SlackMessage = {
  type: string;
  user?: string;
  text: string;
  ts: string;
  thread_ts?: string;
  reply_count?: number;
};

type SlackChannel = {
  id: string;
  name: string;
  is_channel: boolean;
  is_group: boolean;
  is_private: boolean;
  is_member: boolean;
};

type SlackUserInfo = {
  ok: boolean;
  user?: {
    id: string;
    name: string;
    real_name?: string;
    profile?: {
      image_72?: string;
      display_name?: string;
    };
  };
  error?: string;
};

export type SlackSyncOptions = {
  accessToken: string;
  channelIds: string[];
  lastSyncAt?: string | null;
  maxMessagesPerChannel?: number;
};

export type SlackSyncResult = {
  success: boolean;
  messages: ChatMessage[];
  errors: string[];
};

// Cache for user info to avoid repeated API calls
const userCache = new Map<string, { name: string; avatar?: string }>();

/**
 * Fetch messages from Slack channels
 */
export async function fetchSlackMessages(
  options: SlackSyncOptions
): Promise<SlackSyncResult> {
  const {
    accessToken,
    channelIds,
    lastSyncAt,
    maxMessagesPerChannel = 100,
  } = options;

  const errors: string[] = [];
  const messages: ChatMessage[] = [];

  // Convert lastSyncAt to Slack timestamp format
  const oldest = lastSyncAt
    ? String(Math.floor(new Date(lastSyncAt).getTime() / 1000))
    : undefined;

  for (const channelId of channelIds) {
    try {
      const channelMessages = await fetchChannelHistory(
        accessToken,
        channelId,
        oldest,
        maxMessagesPerChannel
      );

      // Get channel info for name
      const channelName = await getChannelName(accessToken, channelId);

      // Process each message
      for (const msg of channelMessages) {
        if (msg.type !== "message" || !msg.user) continue;

        // Get user info
        const userInfo = await getUserInfo(accessToken, msg.user);

        messages.push({
          id: msg.ts,
          channelId,
          channelName,
          author: {
            id: msg.user,
            name: userInfo?.name || msg.user,
            avatar: userInfo?.avatar,
          },
          content: msg.text,
          timestamp: new Date(parseFloat(msg.ts) * 1000).toISOString(),
          threadId: msg.thread_ts,
          replyCount: msg.reply_count,
        });
      }
    } catch (error) {
      errors.push(`Failed to fetch channel ${channelId}: ${error}`);
    }
  }

  return {
    success: errors.length === 0,
    messages,
    errors,
  };
}

/**
 * Fetch channel history
 */
async function fetchChannelHistory(
  accessToken: string,
  channelId: string,
  oldest?: string,
  limit: number = 100
): Promise<SlackMessage[]> {
  const url = new URL(`${SLACK_API_BASE}/conversations.history`);
  url.searchParams.set("channel", channelId);
  url.searchParams.set("limit", String(limit));
  if (oldest) {
    url.searchParams.set("oldest", oldest);
  }

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data: SlackConversationsHistoryResponse = await response.json();

  if (!data.ok) {
    throw new Error(data.error || "Failed to fetch channel history");
  }

  return data.messages || [];
}

/**
 * Get channel name by ID
 */
async function getChannelName(
  accessToken: string,
  channelId: string
): Promise<string | undefined> {
  try {
    const url = new URL(`${SLACK_API_BASE}/conversations.info`);
    url.searchParams.set("channel", channelId);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await response.json();
    return data.ok ? data.channel?.name : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Get user info with caching
 */
async function getUserInfo(
  accessToken: string,
  userId: string
): Promise<{ name: string; avatar?: string } | null> {
  // Check cache
  if (userCache.has(userId)) {
    return userCache.get(userId)!;
  }

  try {
    const url = new URL(`${SLACK_API_BASE}/users.info`);
    url.searchParams.set("user", userId);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data: SlackUserInfo = await response.json();

    if (data.ok && data.user) {
      const info = {
        name: data.user.profile?.display_name || data.user.real_name || data.user.name,
        avatar: data.user.profile?.image_72,
      };
      userCache.set(userId, info);
      return info;
    }
  } catch {
    // Ignore errors, return null
  }

  return null;
}

/**
 * List available channels the bot has access to
 */
export async function listSlackChannels(
  accessToken: string
): Promise<{ id: string; name: string; isPrivate: boolean }[]> {
  const channels: { id: string; name: string; isPrivate: boolean }[] = [];
  let cursor: string | undefined;

  do {
    const url = new URL(`${SLACK_API_BASE}/conversations.list`);
    url.searchParams.set("types", "public_channel,private_channel");
    url.searchParams.set("exclude_archived", "true");
    url.searchParams.set("limit", "200");
    if (cursor) {
      url.searchParams.set("cursor", cursor);
    }

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data: SlackConversationsListResponse = await response.json();

    if (!data.ok) {
      console.error("Failed to list Slack channels:", data.error);
      break;
    }

    for (const channel of data.channels || []) {
      if (channel.is_member) {
        channels.push({
          id: channel.id,
          name: channel.name,
          isPrivate: channel.is_private,
        });
      }
    }

    cursor = data.response_metadata?.next_cursor;
  } while (cursor);

  return channels;
}

/**
 * Get team info (workspace name)
 */
export async function getSlackTeamInfo(
  accessToken: string
): Promise<{ id: string; name: string } | null> {
  try {
    const response = await fetch(`${SLACK_API_BASE}/team.info`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await response.json();
    if (data.ok) {
      return { id: data.team.id, name: data.team.name };
    }
  } catch {
    // Ignore
  }
  return null;
}
