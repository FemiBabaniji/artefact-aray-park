// ════════════════════════════════════════════════════════════════════════════
// Discord Sync Client
// Fetches messages from Discord channels via Discord API
// Note: Discord OAuth has limited access - typically needs a bot token for full access
// ════════════════════════════════════════════════════════════════════════════

import type { ChatMessage } from "@/types/integration";

const DISCORD_API_BASE = "https://discord.com/api/v10";

type DiscordMessage = {
  id: string;
  channel_id: string;
  content: string;
  timestamp: string;
  author: {
    id: string;
    username: string;
    avatar?: string;
    discriminator: string;
  };
  thread?: {
    id: string;
    message_count: number;
  };
};

type DiscordChannel = {
  id: string;
  name: string;
  type: number;
  guild_id: string;
};

type DiscordGuild = {
  id: string;
  name: string;
  icon?: string;
};

export type DiscordSyncOptions = {
  accessToken: string;
  guildId?: string;
  channelIds: string[];
  lastSyncAt?: string | null;
  maxMessagesPerChannel?: number;
};

export type DiscordSyncResult = {
  success: boolean;
  messages: ChatMessage[];
  errors: string[];
};

/**
 * Fetch messages from Discord channels
 */
export async function fetchDiscordMessages(
  options: DiscordSyncOptions
): Promise<DiscordSyncResult> {
  const {
    accessToken,
    channelIds,
    lastSyncAt,
    maxMessagesPerChannel = 100,
  } = options;

  const errors: string[] = [];
  const messages: ChatMessage[] = [];

  // Convert lastSyncAt to Discord snowflake (approximate)
  const afterSnowflake = lastSyncAt
    ? dateToSnowflake(new Date(lastSyncAt))
    : undefined;

  for (const channelId of channelIds) {
    try {
      const channelMessages = await fetchChannelMessages(
        accessToken,
        channelId,
        afterSnowflake,
        maxMessagesPerChannel
      );

      // Get channel name
      const channelInfo = await getChannelInfo(accessToken, channelId);

      for (const msg of channelMessages) {
        messages.push({
          id: msg.id,
          channelId: msg.channel_id,
          channelName: channelInfo?.name,
          author: {
            id: msg.author.id,
            name: msg.author.username,
            avatar: msg.author.avatar
              ? `https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.png`
              : undefined,
          },
          content: msg.content,
          timestamp: msg.timestamp,
          threadId: msg.thread?.id,
          replyCount: msg.thread?.message_count,
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
 * Fetch messages from a channel
 */
async function fetchChannelMessages(
  accessToken: string,
  channelId: string,
  after?: string,
  limit: number = 100
): Promise<DiscordMessage[]> {
  const url = new URL(`${DISCORD_API_BASE}/channels/${channelId}/messages`);
  url.searchParams.set("limit", String(Math.min(limit, 100)));
  if (after) {
    url.searchParams.set("after", after);
  }

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Discord API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Get channel info
 */
async function getChannelInfo(
  accessToken: string,
  channelId: string
): Promise<DiscordChannel | null> {
  try {
    const response = await fetch(`${DISCORD_API_BASE}/channels/${channelId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

/**
 * List guilds (servers) the user is a member of
 */
export async function listDiscordGuilds(
  accessToken: string
): Promise<DiscordGuild[]> {
  try {
    const response = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) return [];
    return response.json();
  } catch {
    return [];
  }
}

/**
 * List channels in a guild
 * Note: Requires bot token or appropriate OAuth scopes
 */
export async function listGuildChannels(
  accessToken: string,
  guildId: string
): Promise<{ id: string; name: string; type: string }[]> {
  try {
    const response = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/channels`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) return [];

    const channels: DiscordChannel[] = await response.json();

    // Filter to text channels only (type 0 = guild text, type 5 = announcement)
    return channels
      .filter((c) => c.type === 0 || c.type === 5)
      .map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type === 0 ? "text" : "announcement",
      }));
  } catch {
    return [];
  }
}

/**
 * Convert a Date to Discord snowflake (approximate)
 * Discord snowflakes encode timestamp in the first 42 bits
 */
function dateToSnowflake(date: Date): string {
  const DISCORD_EPOCH = 1420070400000; // 2015-01-01 00:00:00 UTC
  const timestamp = date.getTime() - DISCORD_EPOCH;
  // Shift left by 22 bits (worker, process, increment are zeros)
  const snowflake = BigInt(timestamp) << BigInt(22);
  return snowflake.toString();
}

/**
 * Convert Discord snowflake to Date
 */
export function snowflakeToDate(snowflake: string): Date {
  const DISCORD_EPOCH = 1420070400000;
  const timestamp = Number(BigInt(snowflake) >> BigInt(22));
  return new Date(timestamp + DISCORD_EPOCH);
}
