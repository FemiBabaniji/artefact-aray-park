-- ============================================================================
-- 021: Render Layer - Composable Presentation for Artefacts
-- ============================================================================
-- Adds featured blocks, mask annotations, render templates, and named renders

-- ============================================================================
-- 1. Extend engagement_blocks for featured blocks and masking
-- ============================================================================

-- Add featured flag (one per room, enforced in application)
ALTER TABLE engagement_blocks
  ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

-- Add mask annotations for sensitive data tagging
-- Format: [{ "start": 45, "end": 53, "placeholder": "[team size]" }]
ALTER TABLE engagement_blocks
  ADD COLUMN IF NOT EXISTS mask_annotations JSONB DEFAULT '[]'::jsonb;

-- Ensure updated_at and updated_by exist (may already exist from prior migration)
ALTER TABLE engagement_blocks
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE engagement_blocks
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Index for quick featured block lookups
CREATE INDEX IF NOT EXISTS idx_engagement_blocks_featured
  ON engagement_blocks(room_id, featured)
  WHERE featured = true;

-- ============================================================================
-- 2. Render Templates - Platform and Practice Templates
-- ============================================================================

CREATE TABLE IF NOT EXISTS render_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership (null owner_id = platform template)
  owner_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  practice_id     UUID, -- Future: REFERENCES practices(id)

  -- Identity
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE,
  description     TEXT,
  engagement_type TEXT, -- 'strategy', 'fractional', 'implementation', 'advisory', 'due_diligence'

  -- Configuration
  room_schema     JSONB NOT NULL DEFAULT '[]'::jsonb,  -- Default rooms + visibility
  render_intents  JSONB NOT NULL DEFAULT '{}'::jsonb, -- Named renders with room selections
  block_guidance  JSONB DEFAULT '{}'::jsonb,          -- Suggested block types per room
  mask_patterns   JSONB DEFAULT '{}'::jsonb,          -- Default masking rules

  -- Visibility
  visibility      TEXT NOT NULL DEFAULT 'private'
                  CHECK (visibility IN ('private', 'practice', 'public')),

  -- Community metrics
  fork_count      INTEGER DEFAULT 0,
  forked_from     UUID REFERENCES render_templates(id) ON DELETE SET NULL,

  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for template lookup
CREATE INDEX IF NOT EXISTS idx_render_templates_owner ON render_templates(owner_id);
CREATE INDEX IF NOT EXISTS idx_render_templates_visibility ON render_templates(visibility);
CREATE INDEX IF NOT EXISTS idx_render_templates_engagement_type ON render_templates(engagement_type);
CREATE INDEX IF NOT EXISTS idx_render_templates_slug ON render_templates(slug);

-- ============================================================================
-- 3. Named Renders - Saved render configurations per engagement
-- ============================================================================

CREATE TABLE IF NOT EXISTS engagement_renders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id   UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,

  -- Identity
  name            TEXT NOT NULL,
  intent          TEXT NOT NULL, -- 'client_portal', 'pitch_deck', 'board_summary', 'handover_doc', 'demo_render'

  -- Configuration
  room_selections JSONB NOT NULL DEFAULT '[]'::jsonb, -- Room IDs with their template/preset
  render_config   JSONB NOT NULL DEFAULT '{}'::jsonb, -- Additional config (sequence, masks, etc.)

  -- Sharing
  share_token     TEXT UNIQUE,
  shared_at       TIMESTAMPTZ,
  share_password  TEXT, -- Optional password protection

  -- Forking
  forked_from_template UUID REFERENCES render_templates(id) ON DELETE SET NULL,

  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for render lookups
CREATE INDEX IF NOT EXISTS idx_engagement_renders_engagement ON engagement_renders(engagement_id);
CREATE INDEX IF NOT EXISTS idx_engagement_renders_intent ON engagement_renders(intent);
CREATE INDEX IF NOT EXISTS idx_engagement_renders_share_token ON engagement_renders(share_token);

-- ============================================================================
-- 4. Render Views - Track render views for analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS render_views (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  render_id       UUID NOT NULL REFERENCES engagement_renders(id) ON DELETE CASCADE,

  -- Viewer info
  viewer_type     TEXT NOT NULL CHECK (viewer_type IN ('owner', 'client', 'external', 'anonymous')),
  viewer_id       UUID REFERENCES auth.users(id),

  -- Context
  ip_hash         TEXT, -- Hashed IP for anonymous analytics
  user_agent      TEXT,

  -- Timestamp
  viewed_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_render_views_render ON render_views(render_id);
CREATE INDEX IF NOT EXISTS idx_render_views_viewed_at ON render_views(viewed_at);

-- ============================================================================
-- 5. Platform Starter Templates (seed data)
-- ============================================================================

-- Insert platform templates (owner_id = null)
INSERT INTO render_templates (
  id, owner_id, name, slug, description, engagement_type,
  room_schema, render_intents, visibility
) VALUES
-- Strategy Engagement
(
  '00000000-0000-0000-0000-000000000001',
  NULL,
  'Strategy Engagement',
  'strategy',
  'For strategy consulting engagements with clear discovery, analysis, and recommendations phases',
  'strategy',
  '[
    {"key": "scope", "label": "Scope & Objectives", "visibility": "client_view", "required": true},
    {"key": "research", "label": "Research & Discovery", "visibility": "consultant_only", "required": false},
    {"key": "deliverables", "label": "Deliverables", "visibility": "client_view", "required": true},
    {"key": "meetings", "label": "Meetings & Decisions", "visibility": "client_view", "required": true},
    {"key": "outcomes", "label": "Outcomes & Impact", "visibility": "client_view", "required": true}
  ]'::jsonb,
  '{
    "client_portal": {
      "name": "Client Portal",
      "rooms": ["scope", "deliverables", "meetings", "outcomes"],
      "showFeaturedOnly": false
    },
    "board_summary": {
      "name": "Board Summary",
      "rooms": ["scope", "outcomes", "meetings"],
      "showFeaturedOnly": true
    },
    "pitch_deck": {
      "name": "Pitch Deck",
      "rooms": ["scope", "outcomes"],
      "showFeaturedOnly": true
    }
  }'::jsonb,
  'public'
),

-- Fractional Executive
(
  '00000000-0000-0000-0000-000000000002',
  NULL,
  'Fractional Executive',
  'fractional',
  'For ongoing fractional leadership roles with activity tracking and metrics',
  'fractional',
  '[
    {"key": "objectives", "label": "Objectives", "visibility": "client_view", "required": true},
    {"key": "activities", "label": "Activities", "visibility": "client_view", "required": true},
    {"key": "decisions", "label": "Decisions", "visibility": "client_view", "required": true},
    {"key": "metrics", "label": "Metrics & KPIs", "visibility": "client_view", "required": true}
  ]'::jsonb,
  '{
    "client_portal": {
      "name": "Client Portal",
      "rooms": ["objectives", "activities", "decisions", "metrics"],
      "showFeaturedOnly": false
    },
    "weekly_update": {
      "name": "Weekly Update",
      "rooms": ["activities", "decisions", "metrics"],
      "showFeaturedOnly": true
    },
    "quarterly_review": {
      "name": "Quarterly Review",
      "rooms": ["objectives", "metrics", "decisions"],
      "showFeaturedOnly": true
    }
  }'::jsonb,
  'public'
),

-- Implementation Project
(
  '00000000-0000-0000-0000-000000000003',
  NULL,
  'Implementation Project',
  'implementation',
  'For implementation and transformation projects with milestones and issue tracking',
  'implementation',
  '[
    {"key": "scope", "label": "Scope", "visibility": "client_view", "required": true},
    {"key": "milestones", "label": "Milestones", "visibility": "client_view", "required": true},
    {"key": "issues", "label": "Issues & Risks", "visibility": "client_view", "required": true},
    {"key": "handover", "label": "Handover", "visibility": "client_view", "required": false}
  ]'::jsonb,
  '{
    "client_portal": {
      "name": "Client Portal",
      "rooms": ["scope", "milestones", "issues"],
      "showFeaturedOnly": false
    },
    "project_close": {
      "name": "Project Close",
      "rooms": ["scope", "milestones", "handover"],
      "showFeaturedOnly": true
    }
  }'::jsonb,
  'public'
),

-- Advisory Retainer
(
  '00000000-0000-0000-0000-000000000004',
  NULL,
  'Advisory Retainer',
  'advisory',
  'For ongoing advisory relationships with session-based engagement',
  'advisory',
  '[
    {"key": "topics", "label": "Topics & Agenda", "visibility": "client_view", "required": true},
    {"key": "sessions", "label": "Sessions", "visibility": "client_view", "required": true},
    {"key": "recommendations", "label": "Recommendations", "visibility": "client_view", "required": true}
  ]'::jsonb,
  '{
    "client_portal": {
      "name": "Client Portal",
      "rooms": ["topics", "sessions", "recommendations"],
      "showFeaturedOnly": false
    },
    "session_recap": {
      "name": "Session Recap",
      "rooms": ["sessions", "recommendations"],
      "showFeaturedOnly": true
    }
  }'::jsonb,
  'public'
),

-- Due Diligence
(
  '00000000-0000-0000-0000-000000000005',
  NULL,
  'Due Diligence',
  'due-diligence',
  'For due diligence and assessment engagements with findings and risk tracking',
  'due_diligence',
  '[
    {"key": "scope", "label": "Scope", "visibility": "client_view", "required": true},
    {"key": "findings", "label": "Findings", "visibility": "client_view", "required": true},
    {"key": "risks", "label": "Risk Register", "visibility": "client_view", "required": true},
    {"key": "report", "label": "Final Report", "visibility": "client_view", "required": true}
  ]'::jsonb,
  '{
    "client_portal": {
      "name": "Client Portal",
      "rooms": ["scope", "findings", "risks"],
      "showFeaturedOnly": false
    },
    "final_report": {
      "name": "Final Report",
      "rooms": ["scope", "findings", "risks", "report"],
      "showFeaturedOnly": true
    }
  }'::jsonb,
  'public'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. RLS Policies
-- ============================================================================

ALTER TABLE render_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_renders ENABLE ROW LEVEL SECURITY;
ALTER TABLE render_views ENABLE ROW LEVEL SECURITY;

-- Templates: public can view public templates, owner can manage their own
CREATE POLICY "templates_select_public" ON render_templates
  FOR SELECT USING (
    visibility = 'public'
    OR owner_id = auth.uid()
  );

CREATE POLICY "templates_insert_owner" ON render_templates
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "templates_update_owner" ON render_templates
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "templates_delete_owner" ON render_templates
  FOR DELETE USING (owner_id = auth.uid());

-- Renders: accessible by engagement owner
CREATE POLICY "renders_select_via_engagement" ON engagement_renders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM engagements e
      WHERE e.id = engagement_renders.engagement_id
      AND e.owner_id = auth.uid()
    )
    OR share_token IS NOT NULL -- Shared renders are public via token
  );

CREATE POLICY "renders_insert_via_engagement" ON engagement_renders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM engagements e
      WHERE e.id = engagement_renders.engagement_id
      AND e.owner_id = auth.uid()
    )
  );

CREATE POLICY "renders_update_via_engagement" ON engagement_renders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM engagements e
      WHERE e.id = engagement_renders.engagement_id
      AND e.owner_id = auth.uid()
    )
  );

CREATE POLICY "renders_delete_via_engagement" ON engagement_renders
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM engagements e
      WHERE e.id = engagement_renders.engagement_id
      AND e.owner_id = auth.uid()
    )
  );

-- Views: anyone can insert (for tracking), owner can select
CREATE POLICY "views_insert_all" ON render_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "views_select_via_engagement" ON render_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM engagement_renders er
      JOIN engagements e ON e.id = er.engagement_id
      WHERE er.id = render_views.render_id
      AND e.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 7. Updated_at Triggers
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER render_templates_updated_at
  BEFORE UPDATE ON render_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER engagement_renders_updated_at
  BEFORE UPDATE ON engagement_renders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER engagement_blocks_updated_at
  BEFORE UPDATE ON engagement_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
