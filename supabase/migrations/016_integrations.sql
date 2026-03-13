-- ============================================================================
-- 016: Email & Meeting Integration Settings
-- ============================================================================
-- Store integration settings and ingestion preferences per engagement

-- Integration settings per engagement
CREATE TABLE IF NOT EXISTS engagement_integrations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id   UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL CHECK (integration_type IN ('gmail', 'outlook', 'slack', 'discord', 'meeting')),

  -- Connection settings
  is_enabled      BOOLEAN NOT NULL DEFAULT false,
  credentials     JSONB,  -- Encrypted tokens, connection details
  settings        JSONB NOT NULL DEFAULT '{}',  -- Integration-specific settings

  -- For email integrations
  client_domains  TEXT[] DEFAULT '{}',  -- Domains to monitor (e.g., ['acme.com'])
  auto_ingest     BOOLEAN NOT NULL DEFAULT false,  -- Auto-ingest or require approval

  -- Timestamps
  last_sync_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(engagement_id, integration_type)
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_engagement_integrations_engagement
  ON engagement_integrations(engagement_id);

-- Pending ingestion items (for approval workflow)
CREATE TABLE IF NOT EXISTS ingestion_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id   UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  integration_id  UUID NOT NULL REFERENCES engagement_integrations(id) ON DELETE CASCADE,

  -- Source info
  source_type     TEXT NOT NULL CHECK (source_type IN ('email', 'meeting', 'slack', 'discord')),
  source_id       TEXT NOT NULL,  -- External ID (email message ID, meeting ID, etc.)
  source_data     JSONB NOT NULL,  -- Raw data from source

  -- Processed content
  suggested_room  TEXT,  -- Suggested room to add to
  suggested_block JSONB,  -- Suggested block content
  summary         TEXT,  -- AI-generated summary

  -- Status
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'auto_ingested')),
  processed_at    TIMESTAMPTZ,
  processed_by    TEXT,  -- User who approved/rejected

  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(integration_id, source_id)
);

-- Index for queue processing
CREATE INDEX IF NOT EXISTS idx_ingestion_queue_status
  ON ingestion_queue(engagement_id, status)
  WHERE status = 'pending';

-- RLS policies
ALTER TABLE engagement_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_queue ENABLE ROW LEVEL SECURITY;

-- Integration settings accessible by engagement owner
CREATE POLICY "Integration settings accessible by owner"
  ON engagement_integrations FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Ingestion queue accessible by owner"
  ON ingestion_queue FOR ALL
  USING (true)
  WITH CHECK (true);
