// ============================================================================
// Channel List API
// GET /api/integrations/channels?integrationId=...&type=slack|discord
// Returns available channels from Slack/Discord via Composio
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { getComposioClient } from "@/lib/composio/client";

type Channel = {
  id: string;
  name: string;
};

type DiscordChannel = {
  id: string;
  name: string;
  type?: number;
};

type SlackChannel = {
  id: string;
  name?: string;
  name_normalized?: string;
};

type IntegrationSettings = {
  composioAccountId?: string;
  connectionStatus?: string;
  slackChannelIds?: string[];
  discordChannelIds?: string[];
};

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { supabase } = auth.context;

  const { searchParams } = new URL(request.url);
  const integrationId = searchParams.get("integrationId");
  const type = searchParams.get("type") as "slack" | "discord" | null;

  if (!integrationId) {
    return NextResponse.json(
      { error: "integrationId is required" },
      { status: 400 }
    );
  }

  if (!type || !["slack", "discord"].includes(type)) {
    return NextResponse.json(
      { error: "type must be 'slack' or 'discord'" },
      { status: 400 }
    );
  }

  // Get the integration to find the Composio account ID
  const { data: integration, error } = await supabase
    .from("engagement_integrations")
    .select("*")
    .eq("id", integrationId)
    .single();

  if (error || !integration) {
    return NextResponse.json(
      { error: "Integration not found" },
      { status: 404 }
    );
  }

  const settings = integration.settings as IntegrationSettings | null;
  const composioAccountId = settings?.composioAccountId;
  if (!composioAccountId) {
    return NextResponse.json(
      { error: "Integration not connected to Composio" },
      { status: 400 }
    );
  }

  try {
    const client = getComposioClient();
    let channels: Channel[] = [];

    if (type === "slack") {
      // Use SLACK_LIST_CHANNELS tool
      const result = await client.tools.execute("SLACK_LIST_CHANNELS", {
        connected_account_id: composioAccountId,
        arguments: {},
      });

      if (!result.successful) {
        return NextResponse.json(
          { error: result.error || "Failed to fetch Slack channels" },
          { status: 500 }
        );
      }

      // Parse channels from response
      const data = result.data as { channels?: SlackChannel[] } | SlackChannel[];
      const rawChannels: SlackChannel[] = Array.isArray(data) ? data : data?.channels || [];

      channels = rawChannels.map((ch) => ({
        id: ch.id,
        name: ch.name || ch.name_normalized || ch.id,
      }));
    } else if (type === "discord") {
      // Use DISCORD_GET_GUILD_CHANNELS or similar tool
      // First try to get channels from the connected guild
      const result = await client.tools.execute("DISCORD_GET_GUILD_CHANNELS", {
        connected_account_id: composioAccountId,
        arguments: {},
      });

      if (!result.successful) {
        // Fallback: try DISCORD_LIST_CHANNELS
        const fallbackResult = await client.tools.execute("DISCORD_LIST_CHANNELS", {
          connected_account_id: composioAccountId,
          arguments: {},
        });

        if (!fallbackResult.successful) {
          return NextResponse.json(
            { error: fallbackResult.error || "Failed to fetch Discord channels" },
            { status: 500 }
          );
        }

        const fallbackData = fallbackResult.data as DiscordChannel[] | { channels?: DiscordChannel[] };
        const rawChannels: DiscordChannel[] = Array.isArray(fallbackData) ? fallbackData : fallbackData?.channels || [];

        channels = rawChannels
          .filter((ch) => ch.type === 0 || ch.type === undefined) // Text channels only
          .map((ch) => ({
            id: ch.id,
            name: ch.name || ch.id,
          }));
      } else {
        const data = result.data as DiscordChannel[] | { channels?: DiscordChannel[] };
        const rawChannels: DiscordChannel[] = Array.isArray(data) ? data : data?.channels || [];

        channels = rawChannels
          .filter((ch) => ch.type === 0 || ch.type === undefined) // Text channels only
          .map((ch) => ({
            id: ch.id,
            name: ch.name || ch.id,
          }));
      }
    }

    return NextResponse.json({ channels });
  } catch (err) {
    console.error("Failed to fetch channels:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch channels" },
      { status: 500 }
    );
  }
}
