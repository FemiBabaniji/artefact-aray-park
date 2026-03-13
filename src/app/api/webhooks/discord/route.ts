// ════════════════════════════════════════════════════════════════════════════
// Discord Webhook Handler
// POST /api/webhooks/discord
// Handles Discord interactions and message events
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getDemoAdminClient } from "@/lib/supabase/admin";
import Anthropic from "@anthropic-ai/sdk";
import type { SuggestedBlock } from "@/types/integration";
import { verify } from "crypto";

// ── Types ────────────────────────────────────────────────────────────────────

interface DiscordInteraction {
  type: number; // 1 = PING, 2 = APPLICATION_COMMAND, etc.
  id: string;
  application_id: string;
  guild_id?: string;
  channel_id?: string;
  data?: {
    type: number;
    name: string;
    // Additional command data
  };
}

interface DiscordMessageCreate {
  t: "MESSAGE_CREATE";
  d: {
    id: string;
    channel_id: string;
    guild_id?: string;
    author: {
      id: string;
      username: string;
      discriminator?: string;
      avatar?: string;
    };
    content: string;
    timestamp: string;
    edited_timestamp?: string;
    tts: boolean;
    mention_everyone: boolean;
    mentions: Array<{ id: string; username: string }>;
  };
}

// Discord interaction types
const INTERACTION_TYPE = {
  PING: 1,
  APPLICATION_COMMAND: 2,
  MESSAGE_COMPONENT: 3,
  APPLICATION_COMMAND_AUTOCOMPLETE: 4,
  MODAL_SUBMIT: 5,
} as const;

// ── Signature Verification ───────────────────────────────────────────────────

function verifyDiscordSignature(
  publicKey: string,
  signature: string,
  timestamp: string,
  body: string
): boolean {
  try {
    const message = Buffer.from(timestamp + body);
    const sig = Buffer.from(signature, "hex");
    const key = Buffer.from(publicKey, "hex");

    // Use Node.js crypto verify with Ed25519
    return verify(
      null, // Ed25519 doesn't use a separate hash algorithm
      message,
      {
        key: Buffer.concat([
          // Ed25519 public key DER header
          Buffer.from("302a300506032b6570032100", "hex"),
          key,
        ]),
        format: "der",
        type: "spki",
      },
      sig
    );
  } catch (error) {
    console.error("Discord signature verification error:", error);
    return false;
  }
}

// ── AI Summarization ─────────────────────────────────────────────────────────

async function generateSummary(
  content: string,
  sourceType: "discord"
): Promise<{
  summary: string | null;
  suggestedRoom: string | null;
  suggestedBlock: SuggestedBlock | null;
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      summary: content.slice(0, 500),
      suggestedRoom: "research",
      suggestedBlock: {
        type: "text",
        content: content.slice(0, 2000),
      },
    };
  }

  try {
    const anthropic = new Anthropic({ apiKey });

    const prompt = `Analyze this Discord message and provide:
1. A brief summary (2-3 sentences)
2. Key decisions or action items (if any)
3. Suggested engagement room (one of: research, meetings, strategy, documents)
4. Relevance score (1-10) for a consulting engagement

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

    const responseText =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Parse response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const summary = parsed.summary || content.slice(0, 500);
    const suggestedRoom = parsed.suggestedRoom || "research";

    let blockContent = `## Message Summary\n\n${summary}`;

    if (parsed.decisions?.length) {
      blockContent +=
        "\n\n**Decisions:**\n" +
        parsed.decisions.map((d: string) => `- ${d}`).join("\n");
    }

    if (parsed.actionItems?.length) {
      blockContent +=
        "\n\n**Action Items:**\n" +
        parsed.actionItems.map((a: string) => `- ${a}`).join("\n");
    }

    return {
      summary,
      suggestedRoom,
      suggestedBlock: {
        type: parsed.decisions?.length ? "decision" : "text",
        content: blockContent,
        metadata: {
          sourceType,
          relevanceScore: parsed.relevanceScore,
          ingestedAt: new Date().toISOString(),
        },
      },
    };
  } catch (error) {
    console.error("AI summarization failed:", error);
    return {
      summary: content.slice(0, 500),
      suggestedRoom: "research",
      suggestedBlock: {
        type: "text",
        content: content.slice(0, 2000),
      },
    };
  }
}

// ── Webhook Handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const publicKey = process.env.DISCORD_PUBLIC_KEY;

  // Get raw body for signature verification
  const rawBody = await request.text();

  // Verify signature if configured
  if (publicKey) {
    const signature = request.headers.get("x-signature-ed25519");
    const timestamp = request.headers.get("x-signature-timestamp");

    if (!signature || !timestamp) {
      return NextResponse.json(
        { error: "Missing signature headers" },
        { status: 401 }
      );
    }

    const isValid = await verifyDiscordSignature(
      publicKey,
      signature,
      timestamp,
      rawBody
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }
  }

  let payload: DiscordInteraction | DiscordMessageCreate;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Handle interaction (PING)
  if ("type" in payload && payload.type === INTERACTION_TYPE.PING) {
    // Respond with PONG (type 1)
    return NextResponse.json({ type: 1 });
  }

  // Handle MESSAGE_CREATE events (from Gateway or webhook)
  if ("t" in payload && payload.t === "MESSAGE_CREATE") {
    const message = payload.d;

    // Skip bot messages
    if (!message.author || message.author.id === process.env.DISCORD_BOT_ID) {
      return NextResponse.json({ ok: true });
    }

    const supabase = getDemoAdminClient();
    if (!supabase) {
      console.error("Discord webhook: Database not configured");
      return NextResponse.json({ ok: true });
    }

    // Find matching integration by Discord guild ID
    const { data: integrations, error: findError } = await supabase
      .from("engagement_integrations")
      .select("*")
      .eq("integration_type", "discord")
      .eq("is_enabled", true);

    if (findError) {
      console.error("Discord webhook: Failed to find integrations:", findError);
      return NextResponse.json({ ok: true });
    }

    // Find integration matching this guild and channel
    const matchingIntegration = integrations?.find((integration) => {
      const settings = integration.settings as {
        discordGuildId?: string;
        discordChannelIds?: string[];
      };
      return (
        settings.discordGuildId === message.guild_id &&
        settings.discordChannelIds?.includes(message.channel_id)
      );
    });

    if (!matchingIntegration) {
      return NextResponse.json({ ok: true }); // No matching integration
    }

    // Check if message already exists in queue
    const sourceId = `discord-${message.id}`;
    const { data: existing } = await supabase
      .from("ingestion_queue")
      .select("id")
      .eq("integration_id", matchingIntegration.id)
      .eq("source_id", sourceId)
      .single();

    if (existing) {
      return NextResponse.json({ ok: true }); // Already queued
    }

    // Generate AI summary
    const content = `${message.author.username}: ${message.content}`;
    const { summary, suggestedRoom, suggestedBlock } = await generateSummary(
      content,
      "discord"
    );

    // Determine status
    const status = matchingIntegration.auto_ingest ? "auto_ingested" : "pending";

    // Add to ingestion queue
    const { error: insertError } = await supabase.from("ingestion_queue").insert({
      engagement_id: matchingIntegration.engagement_id,
      integration_id: matchingIntegration.id,
      source_type: "discord",
      source_id: sourceId,
      source_data: {
        channelId: message.channel_id,
        guildId: message.guild_id,
        author: message.author.username,
        authorId: message.author.id,
        timestamp: message.timestamp,
        content: message.content,
        mentions: message.mentions,
      },
      suggested_room: suggestedRoom,
      suggested_block: suggestedBlock,
      summary,
      status,
      processed_at: status === "auto_ingested" ? new Date().toISOString() : null,
    });

    if (insertError) {
      console.error("Discord webhook: Failed to insert queue item:", insertError);
    }

    return NextResponse.json({ ok: true });
  }

  // Handle other interaction types (commands, etc.) - respond with acknowledgment
  if ("type" in payload) {
    // Type 4 = CHANNEL_MESSAGE_WITH_SOURCE (acknowledge and send response)
    // Type 5 = DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE (acknowledge, send later)
    return NextResponse.json({ type: 5 });
  }

  return NextResponse.json({ ok: true });
}
