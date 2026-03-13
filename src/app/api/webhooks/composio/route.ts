// ════════════════════════════════════════════════════════════════════════════
// Composio Webhook Handler
// POST /api/webhooks/composio
// Receives real-time events from Composio triggers (new emails, messages, etc.)
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Types for webhook payloads
interface ComposioWebhookPayload {
  trigger_id: string;
  trigger_name: string;
  connected_account_id: string;
  app_name: string;
  payload: {
    id?: string;
    type?: string;
    data?: Record<string, unknown>;
    [key: string]: unknown;
  };
  timestamp: string;
}

interface NormalizedItem {
  sourceType: "email" | "meeting" | "slack" | "discord";
  sourceId: string;
  sourceData: Record<string, unknown>;
  content: string;
}

// Provider event type to our source type mapping
const EVENT_TYPE_MAP: Record<string, "email" | "meeting" | "slack" | "discord"> = {
  // Gmail
  "GMAIL_NEW_EMAIL": "email",
  "gmail_new_email": "email",
  "gmail.message.received": "email",
  // Outlook
  "OUTLOOK_NEW_EMAIL": "email",
  "outlook_new_email": "email",
  "outlook.message.received": "email",
  // Slack
  "SLACK_NEW_MESSAGE": "slack",
  "slack_new_message": "slack",
  "slack.message": "slack",
  "message.channels": "slack",
  // Discord
  "DISCORD_NEW_MESSAGE": "discord",
  "discord_new_message": "discord",
  "discord.message.create": "discord",
  // Zoom
  "ZOOM_RECORDING_COMPLETED": "meeting",
  "zoom_recording_completed": "meeting",
  "recording.completed": "meeting",
};

// Create admin Supabase client for webhook processing
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing Supabase configuration");
  }

  return createClient(url, serviceKey);
}

// Verify webhook signature from Composio
function verifySignature(payload: string, signature: string | null): boolean {
  const secret = process.env.COMPOSIO_WEBHOOK_SECRET;

  // If no secret configured, skip verification (dev mode)
  if (!secret) {
    console.warn("COMPOSIO_WEBHOOK_SECRET not set - skipping signature verification");
    return true;
  }

  if (!signature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Helper to safely get nested values
function get(obj: unknown, key: string): unknown {
  if (obj && typeof obj === "object" && key in obj) {
    return (obj as Record<string, unknown>)[key];
  }
  return undefined;
}

// Normalize different provider payloads to our format
function normalizePayload(
  appName: string,
  triggerName: string,
  payload: Record<string, unknown>
): NormalizedItem | null {
  const sourceType = EVENT_TYPE_MAP[triggerName] || EVENT_TYPE_MAP[triggerName.toLowerCase()];

  if (!sourceType) {
    console.warn(`Unknown trigger type: ${triggerName}`);
    return null;
  }

  switch (sourceType) {
    case "email": {
      const email = (payload.email || payload.message || payload) as Record<string, unknown>;
      const id = String(get(email, "id") || get(email, "messageId") || payload.id || "");
      if (!id) return null;

      const subject = get(email, "subject") as string | undefined;
      const from = (get(email, "from") || get(email, "sender")) as string | undefined;
      const to = (get(email, "to") || get(email, "recipients")) as string | undefined;
      const date = (get(email, "date") || get(email, "receivedDateTime")) as string | undefined;
      const preview = (get(email, "snippet") || get(email, "bodyPreview")) as string | undefined;
      const body = (get(email, "body") || preview) as string | undefined;

      return {
        sourceType: "email",
        sourceId: id,
        sourceData: {
          subject,
          from,
          to,
          date,
          preview,
          provider: appName,
        },
        content: `Subject: ${subject || "No subject"}\nFrom: ${from || "Unknown"}\nDate: ${date || "Unknown"}\n\n${body || ""}`,
      };
    }

    case "slack": {
      const msg = (payload.message || payload.event || payload) as Record<string, unknown>;
      const id = String(get(msg, "ts") || get(msg, "client_msg_id") || payload.event_ts || "");
      if (!id) return null;

      const channel = get(msg, "channel") as string | undefined;
      const user = get(msg, "user") as string | undefined;
      const ts = get(msg, "ts") as string | undefined;
      const threadTs = get(msg, "thread_ts") as string | undefined;
      const text = get(msg, "text") as string | undefined;

      return {
        sourceType: "slack",
        sourceId: id,
        sourceData: {
          channelId: channel,
          author: user,
          timestamp: ts,
          threadTs,
        },
        content: `[${channel || "channel"}] ${user || "User"}: ${text || ""}`,
      };
    }

    case "discord": {
      const msg = (payload.message || payload.d || payload) as Record<string, unknown>;
      const id = String(get(msg, "id") || payload.id || "");
      if (!id) return null;

      const authorObj = get(msg, "author");
      const author = typeof authorObj === "object" && authorObj
        ? get(authorObj, "username") as string | undefined
        : authorObj as string | undefined;
      const channelId = get(msg, "channel_id") as string | undefined;
      const guildId = get(msg, "guild_id") as string | undefined;
      const timestamp = get(msg, "timestamp") as string | undefined;
      const content = get(msg, "content") as string | undefined;

      return {
        sourceType: "discord",
        sourceId: id,
        sourceData: {
          channelId,
          guildId,
          author,
          timestamp,
        },
        content: `${author || "User"}: ${content || ""}`,
      };
    }

    case "meeting": {
      const recording = (payload.object || payload.recording || payload) as Record<string, unknown>;
      const id = String(get(recording, "uuid") || get(recording, "id") || payload.uuid || "");
      if (!id) return null;

      const topic = get(recording, "topic") as string | undefined;
      const startTime = get(recording, "start_time") as string | undefined;
      const duration = get(recording, "duration") as number | undefined;
      const hostEmail = get(recording, "host_email") as string | undefined;

      return {
        sourceType: "meeting",
        sourceId: id,
        sourceData: {
          topic,
          startTime,
          duration,
          hostEmail,
          hasRecording: true,
          provider: "zoom",
        },
        content: `Meeting: ${topic || "Untitled"}\nDate: ${startTime || "Unknown"}\nDuration: ${duration || 0} minutes`,
      };
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Get raw body for signature verification
  const rawBody = await request.text();
  const signature = request.headers.get("x-composio-signature")
    || request.headers.get("x-webhook-signature");

  // Verify signature
  if (!verifySignature(rawBody, signature)) {
    console.error("Webhook signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Parse payload
  let webhookPayload: ComposioWebhookPayload;
  try {
    webhookPayload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { trigger_id, trigger_name, connected_account_id, app_name, payload, timestamp } = webhookPayload;

  // Generate idempotency key
  const idempotencyKey = `${trigger_id}:${payload?.id || timestamp}`;

  const supabase = getSupabaseAdmin();

  // Check idempotency (prevent duplicate processing)
  const { data: existing } = await supabase
    .from("webhook_events")
    .select("id")
    .eq("idempotency_key", idempotencyKey)
    .single();

  if (existing) {
    // Already processed
    return NextResponse.json({
      status: "duplicate",
      message: "Event already processed"
    });
  }

  // Log webhook event
  const { data: event } = await supabase
    .from("webhook_events")
    .insert({
      provider: "composio",
      event_type: trigger_name,
      trigger_id,
      payload: webhookPayload,
      idempotency_key: idempotencyKey,
    })
    .select("id")
    .single();

  const eventId = event?.id;

  try {
    // Look up the trigger to get integration details
    const { data: trigger } = await supabase
      .from("integration_triggers")
      .select(`
        id,
        integration_id,
        provider,
        engagement_integrations (
          id,
          engagement_id,
          auto_ingest
        )
      `)
      .eq("trigger_id", trigger_id)
      .single();

    if (!trigger) {
      // Try to find by connected_account_id as fallback
      const { data: integration } = await supabase
        .from("engagement_integrations")
        .select("id, engagement_id, auto_ingest, settings")
        .contains("settings", { composioAccountId: connected_account_id })
        .single();

      if (!integration) {
        console.warn(`No integration found for trigger ${trigger_id} or account ${connected_account_id}`);

        // Mark as processed (orphaned event)
        await supabase
          .from("webhook_events")
          .update({
            processed: true,
            processing_result: { status: "orphaned", message: "No matching integration" },
          })
          .eq("id", eventId);

        return NextResponse.json({
          status: "ignored",
          message: "No matching integration found"
        });
      }

      // Process using integration from settings lookup
      return await processWebhookItem(
        supabase,
        integration.id,
        integration.engagement_id,
        integration.auto_ingest,
        app_name,
        trigger_name,
        payload,
        eventId,
        startTime
      );
    }

    // Process webhook item
    // Supabase returns single relations as objects, arrays for many relations
    const integrationData = trigger.engagement_integrations;
    const integration = (Array.isArray(integrationData) ? integrationData[0] : integrationData) as {
      id: string;
      engagement_id: string;
      auto_ingest: boolean;
    } | null;

    if (!integration) {
      console.warn(`No integration found for trigger ${trigger_id}`);
      return NextResponse.json({
        status: "ignored",
        message: "No matching integration found"
      });
    }

    // Update trigger last_event_at
    await supabase
      .from("integration_triggers")
      .update({ last_event_at: new Date().toISOString() })
      .eq("id", trigger.id);

    return await processWebhookItem(
      supabase,
      integration.id,
      integration.engagement_id,
      integration.auto_ingest,
      app_name,
      trigger_name,
      payload,
      eventId,
      startTime
    );

  } catch (error) {
    console.error("Webhook processing error:", error);

    // Mark as processed with error
    await supabase
      .from("webhook_events")
      .update({
        processed: true,
        processing_result: {
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error"
        },
      })
      .eq("id", eventId);

    return NextResponse.json({
      status: "error",
      message: "Processing failed"
    }, { status: 500 });
  }
}

async function processWebhookItem(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  integrationId: string,
  engagementId: string,
  autoIngest: boolean,
  appName: string,
  triggerName: string,
  payload: Record<string, unknown>,
  eventId: string | undefined,
  startTime: number
): Promise<NextResponse> {
  // Normalize the payload
  const normalized = normalizePayload(appName, triggerName, payload);

  if (!normalized) {
    // Mark as processed (unrecognized format)
    if (eventId) {
      await supabase
        .from("webhook_events")
        .update({
          processed: true,
          processing_result: { status: "skipped", message: "Unrecognized payload format" },
        })
        .eq("id", eventId);
    }

    return NextResponse.json({
      status: "skipped",
      message: "Unrecognized payload format"
    });
  }

  // Enqueue the item using atomic function
  const { data: queueId, error: enqueueError } = await supabase.rpc("enqueue_ingestion_item", {
    p_engagement_id: engagementId,
    p_integration_id: integrationId,
    p_source_type: normalized.sourceType,
    p_source_id: normalized.sourceId,
    p_source_data: normalized.sourceData,
    p_content: normalized.content,
    p_auto_ingest: autoIngest,
  });

  if (enqueueError) {
    console.error("Failed to enqueue item:", enqueueError);

    if (eventId) {
      await supabase
        .from("webhook_events")
        .update({
          processed: true,
          processing_result: { status: "error", message: enqueueError.message },
        })
        .eq("id", eventId);
    }

    return NextResponse.json({
      status: "error",
      message: "Failed to enqueue item"
    }, { status: 500 });
  }

  // If item was duplicate (queueId is null), mark success
  if (!queueId) {
    if (eventId) {
      await supabase
        .from("webhook_events")
        .update({
          processed: true,
          processing_result: { status: "duplicate", message: "Item already in queue" },
        })
        .eq("id", eventId);
    }

    return NextResponse.json({
      status: "duplicate",
      message: "Item already in queue"
    });
  }

  // If auto-ingest, create the block immediately
  if (autoIngest) {
    // Create summarization job that will also create block
    await supabase.from("background_jobs").insert({
      job_type: "summarize_and_ingest",
      payload: {
        queueItemId: queueId,
        engagementId,
        integrationId,
        sourceType: normalized.sourceType,
        sourceId: normalized.sourceId,
        content: normalized.content,
        sourceData: normalized.sourceData,
      },
    });
  }

  // Mark webhook as processed
  if (eventId) {
    await supabase
      .from("webhook_events")
      .update({
        processed: true,
        integration_id: integrationId,
        processing_result: {
          status: "success",
          queueItemId: queueId,
          autoIngest,
          processingTimeMs: Date.now() - startTime,
        },
      })
      .eq("id", eventId);
  }

  return NextResponse.json({
    status: "success",
    queueItemId: queueId,
    autoIngest,
  });
}

// Health check / verification endpoint
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "composio-webhook-handler",
    timestamp: new Date().toISOString(),
  });
}
