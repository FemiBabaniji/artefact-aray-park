-- Migration: Demo sessions table for ephemeral demo communities

CREATE TABLE IF NOT EXISTS demo_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token        VARCHAR(16) UNIQUE NOT NULL,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT now() + interval '2 hours',
  claimed_at   TIMESTAMPTZ,
  claimed_by   UUID REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Index for token lookups (only unclaimed sessions)
CREATE INDEX IF NOT EXISTS idx_demo_sessions_token
  ON demo_sessions(token)
  WHERE claimed_at IS NULL;

-- Index for expiry cleanup queries
CREATE INDEX IF NOT EXISTS idx_demo_sessions_expires
  ON demo_sessions(expires_at)
  WHERE claimed_at IS NULL;

-- RLS policies
ALTER TABLE demo_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can read demo sessions (needed for public demo access)
CREATE POLICY "demo_sessions_public_read" ON demo_sessions
  FOR SELECT
  USING (true);

-- Only service role can insert/update (via API routes)
CREATE POLICY "demo_sessions_service_write" ON demo_sessions
  FOR ALL
  USING (auth.role() = 'service_role');

-- Cleanup function for expired unclaimed sessions
-- Deletes the community row, which cascades to demo_sessions
CREATE OR REPLACE FUNCTION cleanup_expired_demos() RETURNS void AS $$
BEGIN
  DELETE FROM communities
  WHERE id IN (
    SELECT community_id FROM demo_sessions
    WHERE expires_at < now() AND claimed_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
