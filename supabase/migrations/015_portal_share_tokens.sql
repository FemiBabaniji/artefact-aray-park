-- ============================================================================
-- 015: Portal Share Tokens & View Tracking
-- ============================================================================
-- Add share tokens to engagements and track portal views for NEW badges

-- Add share_token to engagements (auto-generated UUID)
ALTER TABLE engagements
ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE DEFAULT gen_random_uuid()::text;

-- Create index for share token lookups
CREATE INDEX IF NOT EXISTS idx_engagements_share_token ON engagements(share_token);

-- Portal view tracking for NEW badges
CREATE TABLE IF NOT EXISTS portal_views (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id   UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  viewer_token    TEXT NOT NULL,  -- Hash of IP+UA for anonymous tracking
  last_viewed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  view_count      INT NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(engagement_id, viewer_token)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_portal_views_engagement ON portal_views(engagement_id);
CREATE INDEX IF NOT EXISTS idx_portal_views_viewer ON portal_views(viewer_token);

-- Update existing engagements with share tokens if they don't have one
UPDATE engagements
SET share_token = gen_random_uuid()::text
WHERE share_token IS NULL;

-- RLS policies for portal_views
ALTER TABLE portal_views ENABLE ROW LEVEL SECURITY;

-- Portal views can be read/written by anyone (anonymous tracking)
CREATE POLICY "Portal views are publicly accessible"
  ON portal_views FOR ALL
  USING (true)
  WITH CHECK (true);
