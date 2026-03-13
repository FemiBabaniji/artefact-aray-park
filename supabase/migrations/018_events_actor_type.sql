-- ============================================================================
-- 018: Add actor_type to engagement_events
-- ============================================================================
-- Support tracking whether an event was triggered by user, ai, client, or system

-- Add actor_type column if it doesn't exist
ALTER TABLE engagement_events
ADD COLUMN IF NOT EXISTS actor_type TEXT NOT NULL DEFAULT 'user';

-- Add index for filtering by actor_type
CREATE INDEX IF NOT EXISTS idx_engagement_events_actor_type ON engagement_events(actor_type);

-- Update any null actor_type values (shouldn't be any, but safety)
UPDATE engagement_events SET actor_type = 'user' WHERE actor_type IS NULL;
