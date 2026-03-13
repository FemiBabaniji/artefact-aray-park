-- ════════════════════════════════════════════════════════════════════════════
-- Migration 020: Webhooks and Background Jobs
-- Adds webhook trigger tracking and async job processing for automatic sync
-- ════════════════════════════════════════════════════════════════════════════

-- ── Webhook Triggers Table ──────────────────────────────────────────────────
-- Tracks Composio trigger subscriptions for real-time data sync

CREATE TABLE IF NOT EXISTS integration_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES engagement_integrations(id) ON DELETE CASCADE,
  trigger_id TEXT NOT NULL,               -- Composio trigger/subscription ID
  trigger_type TEXT NOT NULL,             -- e.g., 'gmail_new_email', 'slack_new_message'
  provider TEXT NOT NULL,                 -- e.g., 'gmail', 'slack', 'zoom'
  status TEXT NOT NULL DEFAULT 'active',  -- 'active', 'paused', 'error', 'deleted'
  config JSONB DEFAULT '{}',              -- Provider-specific config (channel IDs, filters)
  last_event_at TIMESTAMPTZ,              -- Last webhook event received
  error_message TEXT,                     -- Last error if status = 'error'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(integration_id, trigger_type)
);

-- Index for looking up triggers by Composio trigger ID (webhook handler)
CREATE INDEX IF NOT EXISTS idx_integration_triggers_trigger_id ON integration_triggers(trigger_id);
CREATE INDEX IF NOT EXISTS idx_integration_triggers_integration_id ON integration_triggers(integration_id);

-- ── Background Jobs Table ───────────────────────────────────────────────────
-- Queue for async processing (AI summarization, block creation)

CREATE TABLE IF NOT EXISTS background_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,                 -- 'summarize', 'create_block', 'sync'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  payload JSONB NOT NULL,                 -- Job-specific data
  result JSONB,                           -- Result after completion
  error_message TEXT,                     -- Error if failed
  attempts INT NOT NULL DEFAULT 0,        -- Retry count
  max_attempts INT NOT NULL DEFAULT 3,
  locked_at TIMESTAMPTZ,                  -- Processing lock
  locked_by TEXT,                         -- Worker ID holding lock
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),  -- When to run
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for job processing
CREATE INDEX IF NOT EXISTS idx_background_jobs_status ON background_jobs(status) WHERE status IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_background_jobs_scheduled ON background_jobs(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_background_jobs_locked ON background_jobs(locked_at) WHERE status = 'processing';

-- ── Webhook Events Log ──────────────────────────────────────────────────────
-- Audit trail for incoming webhooks (debugging + replay)

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,                 -- 'composio', 'gmail', 'slack', etc.
  event_type TEXT NOT NULL,               -- Provider event type
  trigger_id TEXT,                        -- Associated trigger ID
  integration_id UUID REFERENCES engagement_integrations(id) ON DELETE SET NULL,
  payload JSONB NOT NULL,                 -- Raw webhook payload
  processed BOOLEAN NOT NULL DEFAULT false,
  processing_result JSONB,                -- Result/error from processing
  idempotency_key TEXT,                   -- Prevent duplicate processing
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for idempotency and lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_idempotency ON webhook_events(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_webhook_events_trigger ON webhook_events(trigger_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_unprocessed ON webhook_events(received_at) WHERE processed = false;

-- ── Add sync cursors to ingestion settings ──────────────────────────────────
-- Track incremental sync position per integration

ALTER TABLE engagement_integrations
  ADD COLUMN IF NOT EXISTS sync_cursor JSONB DEFAULT '{}';

COMMENT ON COLUMN engagement_integrations.sync_cursor IS 'Incremental sync cursors: {lastEmailId, lastMessageTs, lastRecordingId}';

-- ── Atomic Job Claim Function ───────────────────────────────────────────────
-- Prevents race conditions when workers claim jobs

CREATE OR REPLACE FUNCTION claim_background_job(
  p_job_types TEXT[],
  p_worker_id TEXT,
  p_lock_duration INTERVAL DEFAULT '5 minutes'
)
RETURNS TABLE (
  job_id UUID,
  job_type TEXT,
  payload JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
  claimed_job RECORD;
BEGIN
  -- Select and lock a single pending job
  SELECT * INTO claimed_job
  FROM background_jobs
  WHERE status = 'pending'
    AND job_type = ANY(p_job_types)
    AND scheduled_for <= now()
    AND attempts < max_attempts
  ORDER BY scheduled_for ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF claimed_job.id IS NULL THEN
    RETURN;
  END IF;

  -- Update to processing
  UPDATE background_jobs
  SET
    status = 'processing',
    locked_at = now(),
    locked_by = p_worker_id,
    attempts = attempts + 1,
    updated_at = now()
  WHERE id = claimed_job.id;

  job_id := claimed_job.id;
  job_type := claimed_job.job_type;
  payload := claimed_job.payload;
  RETURN NEXT;
END;
$$;

-- ── Complete Job Function ───────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION complete_background_job(
  p_job_id UUID,
  p_result JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE background_jobs
  SET
    status = 'completed',
    result = p_result,
    completed_at = now(),
    locked_at = NULL,
    locked_by = NULL,
    updated_at = now()
  WHERE id = p_job_id;
END;
$$;

-- ── Fail Job Function ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fail_background_job(
  p_job_id UUID,
  p_error TEXT,
  p_retry_delay INTERVAL DEFAULT '1 minute'
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  job_record RECORD;
BEGIN
  SELECT * INTO job_record FROM background_jobs WHERE id = p_job_id;

  IF job_record.attempts >= job_record.max_attempts THEN
    -- Max retries reached, mark as failed
    UPDATE background_jobs
    SET
      status = 'failed',
      error_message = p_error,
      locked_at = NULL,
      locked_by = NULL,
      updated_at = now()
    WHERE id = p_job_id;
  ELSE
    -- Schedule retry
    UPDATE background_jobs
    SET
      status = 'pending',
      error_message = p_error,
      locked_at = NULL,
      locked_by = NULL,
      scheduled_for = now() + p_retry_delay * attempts,
      updated_at = now()
    WHERE id = p_job_id;
  END IF;
END;
$$;

-- ── Atomic Block Order Function ─────────────────────────────────────────────
-- Get next block order index atomically (prevents race conditions)

CREATE OR REPLACE FUNCTION get_next_block_order(p_room_id UUID)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  next_order INT;
BEGIN
  SELECT COALESCE(MAX(order_index), -1) + 1 INTO next_order
  FROM engagement_blocks
  WHERE room_id = p_room_id
  FOR UPDATE;

  RETURN next_order;
END;
$$;

-- ── Enqueue Ingestion Job Function ──────────────────────────────────────────
-- Atomically add item to queue and create summarization job

CREATE OR REPLACE FUNCTION enqueue_ingestion_item(
  p_engagement_id UUID,
  p_integration_id UUID,
  p_source_type TEXT,
  p_source_id TEXT,
  p_source_data JSONB,
  p_content TEXT,
  p_auto_ingest BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  new_queue_id UUID;
BEGIN
  -- Insert into ingestion queue (or ignore if duplicate)
  INSERT INTO ingestion_queue (
    engagement_id,
    integration_id,
    source_type,
    source_id,
    source_data,
    status
  )
  VALUES (
    p_engagement_id,
    p_integration_id,
    p_source_type,
    p_source_id,
    p_source_data,
    CASE WHEN p_auto_ingest THEN 'auto_ingested' ELSE 'pending' END
  )
  ON CONFLICT (integration_id, source_id) DO NOTHING
  RETURNING id INTO new_queue_id;

  -- If successfully inserted and not auto-ingest, create summarization job
  IF new_queue_id IS NOT NULL AND NOT p_auto_ingest THEN
    INSERT INTO background_jobs (job_type, payload)
    VALUES ('summarize', jsonb_build_object(
      'queueItemId', new_queue_id,
      'engagementId', p_engagement_id,
      'sourceType', p_source_type,
      'content', p_content
    ));
  END IF;

  RETURN new_queue_id;
END;
$$;

-- ── RLS Policies ────────────────────────────────────────────────────────────

-- Integration triggers: only accessible via engagement ownership
ALTER TABLE integration_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "triggers_select_via_engagement" ON integration_triggers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM engagement_integrations ei
      JOIN engagements e ON e.id = ei.engagement_id
      WHERE ei.id = integration_triggers.integration_id
        AND e.owner_id = auth.uid()
    )
  );

CREATE POLICY "triggers_insert_via_engagement" ON integration_triggers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM engagement_integrations ei
      JOIN engagements e ON e.id = ei.engagement_id
      WHERE ei.id = integration_triggers.integration_id
        AND e.owner_id = auth.uid()
    )
  );

CREATE POLICY "triggers_update_via_engagement" ON integration_triggers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM engagement_integrations ei
      JOIN engagements e ON e.id = ei.engagement_id
      WHERE ei.id = integration_triggers.integration_id
        AND e.owner_id = auth.uid()
    )
  );

CREATE POLICY "triggers_delete_via_engagement" ON integration_triggers
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM engagement_integrations ei
      JOIN engagements e ON e.id = ei.engagement_id
      WHERE ei.id = integration_triggers.integration_id
        AND e.owner_id = auth.uid()
    )
  );

-- Background jobs: service role only (no direct user access)
ALTER TABLE background_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jobs_service_only" ON background_jobs
  FOR ALL USING (false);

-- Webhook events: service role only
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_events_service_only" ON webhook_events
  FOR ALL USING (false);

-- ── Trigger for updated_at ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER integration_triggers_updated_at
  BEFORE UPDATE ON integration_triggers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER background_jobs_updated_at
  BEFORE UPDATE ON background_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
