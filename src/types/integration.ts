// ════════════════════════════════════════════════════════════════════════════
// Integration Types
// Type definitions for OAuth integrations and sync operations
// ════════════════════════════════════════════════════════════════════════════

// ── Provider Types ───────────────────────────────────────────────────────────

export type IntegrationProvider =
  | "gmail"
  | "outlook"
  | "slack"
  | "discord"
  | "zoom"
  | "meeting"; // Generic meeting type in DB

export type ConnectionStatus =
  | "connected"
  | "disconnected"
  | "error"
  | "pending";

// ── Database Row Types ───────────────────────────────────────────────────────

export type IntegrationRow = {
  id: string;
  engagement_id: string;
  integration_type: IntegrationProvider;
  is_enabled: boolean;
  credentials: string | null; // Encrypted JSON string
  settings: IntegrationSettings;
  client_domains: string[];
  auto_ingest: boolean;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
};

export type IngestionQueueRow = {
  id: string;
  engagement_id: string;
  integration_id: string;
  source_type: "email" | "meeting" | "slack" | "discord";
  source_id: string;
  source_data: Record<string, unknown>;
  suggested_room: string | null;
  suggested_block: SuggestedBlock | null;
  summary: string | null;
  status: "pending" | "approved" | "rejected" | "auto_ingested";
  processed_at: string | null;
  processed_by: string | null;
  created_at: string;
};

// ── Settings Types ───────────────────────────────────────────────────────────

export type IntegrationSettings = {
  // Connection status
  connectionStatus?: ConnectionStatus;
  connectedEmail?: string;
  connectedName?: string;
  connectedAt?: string;
  lastError?: string;
  lastErrorAt?: string;

  // Provider-specific settings
  // Slack
  slackTeamId?: string;
  slackTeamName?: string;
  slackChannelIds?: string[];
  slackChannelNames?: Record<string, string>; // channelId -> name

  // Discord
  discordGuildId?: string;
  discordGuildName?: string;
  discordChannelIds?: string[];
  discordChannelNames?: Record<string, string>;

  // Zoom
  zoomUserId?: string;
  zoomAccountId?: string;

  // Sync cursor for incremental sync
  syncCursor?: string;
  lastMessageId?: string;
  lastEmailId?: string;
};

export type SuggestedBlock = {
  type: string;
  content: string;
  metadata?: Record<string, unknown>;
};

// ── Sync Result Types ────────────────────────────────────────────────────────

export type SyncResult = {
  success: boolean;
  itemsFound: number;
  itemsQueued: number;
  itemsAutoIngested: number;
  errors: string[];
  syncedAt: string;
};

// ── Email Types ──────────────────────────────────────────────────────────────

export type EmailMessage = {
  id: string;
  threadId?: string;
  subject: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  date: string;
  snippet: string;
  body: string;
  bodyHtml?: string;
};

export type EmailAddress = {
  email: string;
  name?: string;
};

// ── Chat Message Types ───────────────────────────────────────────────────────

export type ChatMessage = {
  id: string;
  channelId: string;
  channelName?: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  timestamp: string;
  threadId?: string;
  replyCount?: number;
};

// ── Meeting Types ────────────────────────────────────────────────────────────

export type MeetingRecording = {
  id: string;
  meetingId: string;
  topic: string;
  startTime: string;
  duration: number; // minutes
  hostEmail?: string;
  participants?: string[];
  transcript?: string;
  recordingUrl?: string;
};

// ── API Response Types ───────────────────────────────────────────────────────

export type IntegrationResponse = {
  id: string;
  type: IntegrationProvider;
  isEnabled: boolean;
  autoIngest: boolean;
  clientDomains: string[];
  settings: IntegrationSettings;
  lastSyncAt: string | null;
  createdAt: string;
};

export type QueueItemResponse = {
  id: string;
  sourceType: "email" | "meeting" | "slack" | "discord";
  sourceId: string;
  sourceData: {
    subject?: string;
    from?: string;
    preview?: string;
    meetingTitle?: string;
    author?: string;
    channelName?: string;
  };
  suggestedRoom: string | null;
  suggestedBlock: SuggestedBlock | null;
  summary: string | null;
  status: "pending" | "approved" | "rejected" | "auto_ingested";
  createdAt: string;
};

// ── OAuth Provider Config ────────────────────────────────────────────────────

export type OAuthProviderConfig = {
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  clientIdEnv: string;
  clientSecretEnv: string;
  revokeUrl?: string;
  userInfoUrl?: string;
};

// ── Webhook Trigger Types ───────────────────────────────────────────────────

export type TriggerStatus = "active" | "paused" | "error" | "deleted";

export type IntegrationTriggerRow = {
  id: string;
  integration_id: string;
  trigger_id: string;
  trigger_type: string;
  provider: string;
  status: TriggerStatus;
  config: Record<string, unknown>;
  last_event_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

// ── Background Job Types ────────────────────────────────────────────────────

export type JobStatus = "pending" | "processing" | "completed" | "failed";
export type JobType = "summarize" | "summarize_and_ingest" | "create_block" | "sync";

export type BackgroundJobRow = {
  id: string;
  job_type: JobType;
  status: JobStatus;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error_message: string | null;
  attempts: number;
  max_attempts: number;
  locked_at: string | null;
  locked_by: string | null;
  scheduled_for: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

// ── Webhook Event Types ─────────────────────────────────────────────────────

export type WebhookEventRow = {
  id: string;
  provider: string;
  event_type: string;
  trigger_id: string | null;
  integration_id: string | null;
  payload: Record<string, unknown>;
  processed: boolean;
  processing_result: Record<string, unknown> | null;
  idempotency_key: string | null;
  received_at: string;
};

// ── Sync Cursor Types ───────────────────────────────────────────────────────

export type SyncCursor = {
  lastEmailId?: string;
  lastEmailDate?: string;
  lastSlackTs?: string;
  lastDiscordId?: string;
  lastZoomRecordingId?: string;
  lastZoomDate?: string;
};
