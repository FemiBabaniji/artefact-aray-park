-- ============================================================================
-- 019: Concurrency & Reliability Fixes
-- ============================================================================
-- Addresses: race conditions, optimistic locking, token security, input validation

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. OPTIMISTIC LOCKING: Add version columns
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE engagement_blocks
ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

ALTER TABLE engagement_blocks
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE engagement_blocks
ADD COLUMN IF NOT EXISTS updated_by_type TEXT NOT NULL DEFAULT 'user';

ALTER TABLE engagement_blocks
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE engagements
ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

ALTER TABLE engagement_rooms
ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. BLOCK VERSION HISTORY: Audit trail for edits
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS engagement_block_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id UUID NOT NULL REFERENCES engagement_blocks(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content TEXT,
  metadata JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_by_type TEXT NOT NULL DEFAULT 'user',
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(block_id, version)
);

CREATE INDEX IF NOT EXISTS idx_block_versions_block_id ON engagement_block_versions(block_id);

-- Trigger: archive old version before update
CREATE OR REPLACE FUNCTION archive_block_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only archive if content or metadata changed
  IF OLD.content IS DISTINCT FROM NEW.content OR OLD.metadata IS DISTINCT FROM NEW.metadata THEN
    INSERT INTO engagement_block_versions (block_id, version, content, metadata, changed_by, changed_by_type, changed_at)
    VALUES (OLD.id, OLD.version, OLD.content, OLD.metadata, OLD.updated_by, OLD.updated_by_type, OLD.updated_at);
  END IF;

  -- Increment version
  NEW.version := OLD.version + 1;
  NEW.updated_at := now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS block_version_archive ON engagement_blocks;
CREATE TRIGGER block_version_archive
BEFORE UPDATE ON engagement_blocks
FOR EACH ROW EXECUTE FUNCTION archive_block_version();

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. ATOMIC SEQUENCE GENERATION: Fix race condition
-- ══════════════════════════════════════════════════════════════════════════════

-- Function to get next sequence atomically
CREATE OR REPLACE FUNCTION get_next_event_sequence(p_engagement_id UUID)
RETURNS INTEGER AS $$
DECLARE
  next_seq INTEGER;
BEGIN
  -- Lock the engagement row to serialize sequence generation
  PERFORM id FROM engagements WHERE id = p_engagement_id FOR UPDATE;

  -- Get next sequence
  SELECT COALESCE(MAX(sequence), 0) + 1 INTO next_seq
  FROM engagement_events
  WHERE engagement_id = p_engagement_id;

  RETURN next_seq;
END;
$$ LANGUAGE plpgsql;

-- Function to insert event with atomic sequence
CREATE OR REPLACE FUNCTION insert_engagement_event(
  p_engagement_id UUID,
  p_event_type TEXT,
  p_payload JSONB,
  p_actor_id UUID DEFAULT NULL,
  p_actor_type TEXT DEFAULT 'user'
)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
  next_seq INTEGER;
BEGIN
  -- Get next sequence atomically
  next_seq := get_next_event_sequence(p_engagement_id);

  -- Insert event
  INSERT INTO engagement_events (engagement_id, event_type, payload, actor_id, actor_type, sequence)
  VALUES (p_engagement_id, p_event_type, p_payload, p_actor_id, p_actor_type, next_seq)
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. SHARE TOKEN SECURITY: Add expiry and revocation
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE engagements
ADD COLUMN IF NOT EXISTS share_token_expires_at TIMESTAMPTZ;

ALTER TABLE engagements
ADD COLUMN IF NOT EXISTS share_token_revoked_at TIMESTAMPTZ;

-- Default: tokens expire in 90 days, can be extended
UPDATE engagements
SET share_token_expires_at = created_at + INTERVAL '90 days'
WHERE share_token_expires_at IS NULL AND share_token IS NOT NULL;

-- Token revocation log
CREATE TABLE IF NOT EXISTS share_token_revocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  old_token TEXT NOT NULL,
  revoked_by UUID REFERENCES auth.users(id),
  reason TEXT,
  revoked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_token_revocations_engagement ON share_token_revocations(engagement_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. FIX portal_views RLS: Restrict to engagement context
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Portal views are publicly accessible" ON portal_views;

-- Portal views can only be written with valid engagement context
-- Read requires engagement ownership or participation
CREATE POLICY "Portal views insert with engagement check" ON portal_views
  FOR INSERT
  WITH CHECK (
    engagement_id IN (SELECT id FROM engagements WHERE share_token IS NOT NULL)
  );

CREATE POLICY "Portal views select for owners" ON portal_views
  FOR SELECT
  USING (
    engagement_id IN (
      SELECT id FROM engagements WHERE owner_id = auth.uid()
      UNION
      SELECT engagement_id FROM engagement_participants WHERE user_id = auth.uid()
    )
  );

-- ══════════════════════════════════════════════════════════════════════════════
-- 6. INPUT VALIDATION: Constrain block_type
-- ══════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE engagement_block_type_enum AS ENUM (
    'text', 'decision', 'file', 'outcome', 'transcript', 'channel_message', 'note', 'summary'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add check constraint (not enum to allow future additions without migration)
ALTER TABLE engagement_blocks
DROP CONSTRAINT IF EXISTS valid_block_type;

ALTER TABLE engagement_blocks
ADD CONSTRAINT valid_block_type CHECK (
  block_type IN ('text', 'decision', 'file', 'outcome', 'transcript', 'channel_message', 'note', 'summary')
);

-- ══════════════════════════════════════════════════════════════════════════════
-- 7. PHASE TRANSITION VALIDATION
-- ══════════════════════════════════════════════════════════════════════════════

-- Valid phase transitions (state machine)
CREATE OR REPLACE FUNCTION validate_phase_transition()
RETURNS TRIGGER AS $$
DECLARE
  valid_transitions JSONB := '{
    "intake": ["qualification", "archived"],
    "qualification": ["intake", "proposal", "archived"],
    "proposal": ["qualification", "negotiation", "signed", "archived"],
    "negotiation": ["proposal", "signed", "archived"],
    "signed": ["delivery", "archived"],
    "delivery": ["completed", "archived"],
    "completed": ["archived"],
    "archived": []
  }'::JSONB;
  allowed_next TEXT[];
BEGIN
  -- Skip if phase didn't change
  IF OLD.phase = NEW.phase THEN
    RETURN NEW;
  END IF;

  -- Get allowed transitions
  SELECT ARRAY(SELECT jsonb_array_elements_text(valid_transitions->OLD.phase::TEXT))
  INTO allowed_next;

  -- Check if transition is valid
  IF NOT (NEW.phase::TEXT = ANY(allowed_next)) THEN
    RAISE EXCEPTION 'Invalid phase transition from % to %', OLD.phase, NEW.phase;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_engagement_phase ON engagements;
CREATE TRIGGER validate_engagement_phase
BEFORE UPDATE ON engagements
FOR EACH ROW EXECUTE FUNCTION validate_phase_transition();

-- ══════════════════════════════════════════════════════════════════════════════
-- 8. ATOMIC ORDER INDEX: Fix race condition on block ordering
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_next_block_order(p_room_id UUID)
RETURNS INTEGER AS $$
DECLARE
  next_order INTEGER;
BEGIN
  -- Lock the room to serialize order index generation
  PERFORM id FROM engagement_rooms WHERE id = p_room_id FOR UPDATE;

  -- Get next order index
  SELECT COALESCE(MAX(order_index), -1) + 1 INTO next_order
  FROM engagement_blocks
  WHERE room_id = p_room_id;

  RETURN next_order;
END;
$$ LANGUAGE plpgsql;

-- ══════════════════════════════════════════════════════════════════════════════
-- 9. INGESTION JOBS: Webhook reliability
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ingestion_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Idempotency
  idempotency_key TEXT UNIQUE NOT NULL,

  -- Source
  source TEXT NOT NULL,
  source_event_id TEXT,
  source_payload JSONB,

  -- Routing
  engagement_id UUID REFERENCES engagements(id),
  matched_by TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending',

  -- Processing
  attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  error_message TEXT,

  -- Results
  created_blocks UUID[],
  transcript_id UUID,

  -- Timestamps
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_ingestion_status CHECK (
    status IN ('pending', 'processing', 'completed', 'failed', 'dead')
  ),
  CONSTRAINT valid_ingestion_source CHECK (
    source IN ('zoom', 'slack', 'email', 'teams', 'meet', 'discord', 'manual')
  )
);

CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_retry
  ON ingestion_jobs (status, next_retry_at)
  WHERE status IN ('pending', 'failed');

CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_engagement
  ON ingestion_jobs (engagement_id);

CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_idempotency
  ON ingestion_jobs (idempotency_key);

-- RLS for ingestion_jobs
ALTER TABLE ingestion_jobs ENABLE ROW LEVEL SECURITY;

-- Owners can see jobs for their engagements
CREATE POLICY "Ingestion jobs select for engagement owners" ON ingestion_jobs
  FOR SELECT USING (
    engagement_id IN (
      SELECT id FROM engagements WHERE owner_id = auth.uid()
    )
  );

-- Update/delete only for matched engagement owners
CREATE POLICY "Ingestion jobs update for owners" ON ingestion_jobs
  FOR UPDATE USING (
    engagement_id IN (
      SELECT id FROM engagements WHERE owner_id = auth.uid()
    )
  );

-- Insert is handled by service role (webhook handlers)
-- No user-facing insert policy needed

-- RLS for share_token_revocations
ALTER TABLE share_token_revocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Token revocations access for engagement owners" ON share_token_revocations
  FOR ALL USING (
    engagement_id IN (
      SELECT id FROM engagements WHERE owner_id = auth.uid()
    )
  );

-- ══════════════════════════════════════════════════════════════════════════════
-- 10. RLS for block versions
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE engagement_block_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Block versions access through block" ON engagement_block_versions
  FOR ALL USING (
    block_id IN (
      SELECT eb.id FROM engagement_blocks eb
      JOIN engagement_rooms er ON eb.room_id = er.id
      JOIN engagements e ON er.engagement_id = e.id
      WHERE e.owner_id = auth.uid()
      UNION
      SELECT eb.id FROM engagement_blocks eb
      JOIN engagement_rooms er ON eb.room_id = er.id
      JOIN engagement_participants ep ON er.engagement_id = ep.engagement_id
      WHERE ep.user_id = auth.uid()
    )
  );
