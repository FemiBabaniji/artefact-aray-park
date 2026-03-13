-- ============================================================================
-- 017: Engagement Checkpoints & Guardrails
-- ============================================================================
-- Track required milestones and control workflow progression

-- Checkpoints table
CREATE TABLE IF NOT EXISTS engagement_checkpoints (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id   UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,

  -- Checkpoint definition
  label           TEXT NOT NULL,
  description     TEXT,
  phase           TEXT NOT NULL,  -- Which phase this checkpoint applies to
  checkpoint_type TEXT NOT NULL CHECK (checkpoint_type IN ('approval', 'delivery', 'decision', 'document', 'review')),

  -- Requirements
  required        BOOLEAN NOT NULL DEFAULT true,  -- Must complete before phase transition
  order_index     INT NOT NULL DEFAULT 0,

  -- Status
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked', 'skipped')),
  completed_at    TIMESTAMPTZ,
  completed_by    TEXT,  -- User who marked complete
  notes           TEXT,  -- Completion notes

  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_engagement_checkpoints_engagement
  ON engagement_checkpoints(engagement_id);
CREATE INDEX IF NOT EXISTS idx_engagement_checkpoints_phase
  ON engagement_checkpoints(engagement_id, phase);

-- Guardrail settings per engagement
CREATE TABLE IF NOT EXISTS engagement_guardrails (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id   UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,

  -- Auto-ingestion settings
  auto_ingest_emails     BOOLEAN NOT NULL DEFAULT false,
  auto_ingest_meetings   BOOLEAN NOT NULL DEFAULT false,
  require_approval       BOOLEAN NOT NULL DEFAULT true,  -- Require approval for auto-ingested content

  -- Client portal settings
  allow_client_uploads   BOOLEAN NOT NULL DEFAULT true,
  allowed_upload_rooms   TEXT[] DEFAULT ARRAY['documents'],  -- Which rooms allow client uploads

  -- Notification triggers
  notify_on_phase_change BOOLEAN NOT NULL DEFAULT true,
  notify_on_client_upload BOOLEAN NOT NULL DEFAULT true,
  notify_on_block_added   BOOLEAN NOT NULL DEFAULT false,

  -- Phase transition rules
  require_checkpoints    BOOLEAN NOT NULL DEFAULT true,  -- Block phase transition if checkpoints incomplete

  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(engagement_id)
);

-- RLS policies
ALTER TABLE engagement_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_guardrails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Checkpoints accessible by owner"
  ON engagement_checkpoints FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Guardrails accessible by owner"
  ON engagement_guardrails FOR ALL
  USING (true)
  WITH CHECK (true);

-- Default guardrails for new engagements
CREATE OR REPLACE FUNCTION create_default_guardrails()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO engagement_guardrails (engagement_id)
  VALUES (NEW.id)
  ON CONFLICT (engagement_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default guardrails
DROP TRIGGER IF EXISTS create_engagement_guardrails ON engagements;
CREATE TRIGGER create_engagement_guardrails
  AFTER INSERT ON engagements
  FOR EACH ROW
  EXECUTE FUNCTION create_default_guardrails();
