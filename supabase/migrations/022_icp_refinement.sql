-- ============================================================================
-- 022: ICP Refinement - Better fit for fractional execs and boutique firms
-- ============================================================================
-- Target: 6-16 week engagements, $15K-$100K, strategic advice/org change
-- Primary ICP: Fractional COO/CMO/CFO, Strategy boutiques (2-5 people)

-- ============================================================================
-- 1. Add engagement metadata for value and duration tracking
-- ============================================================================

-- Add typical engagement value range (helps with practice intelligence later)
ALTER TABLE engagements
  ADD COLUMN IF NOT EXISTS engagement_type TEXT,
  ADD COLUMN IF NOT EXISTS estimated_weeks INTEGER,
  ADD COLUMN IF NOT EXISTS billing_model TEXT CHECK (billing_model IN ('project', 'retainer', 'hourly', 'value_based'));

-- Index for filtering by engagement type
CREATE INDEX IF NOT EXISTS idx_engagements_type ON engagements(engagement_type);

-- ============================================================================
-- 2. Add more specific fractional exec templates
-- ============================================================================

INSERT INTO render_templates (
  id, owner_id, name, slug, description, engagement_type,
  room_schema, render_intents, visibility
) VALUES

-- Fractional COO
(
  '00000000-0000-0000-0000-000000000006',
  NULL,
  'Fractional COO',
  'fractional-coo',
  'For fractional Chief Operating Officer roles - ops excellence, process improvement, team scaling',
  'fractional_coo',
  '[
    {"key": "objectives", "label": "Quarterly Objectives", "visibility": "client_view", "required": true},
    {"key": "initiatives", "label": "Active Initiatives", "visibility": "client_view", "required": true},
    {"key": "processes", "label": "Process Improvements", "visibility": "client_view", "required": true},
    {"key": "team", "label": "Team & Hiring", "visibility": "client_view", "required": false},
    {"key": "metrics", "label": "Operational Metrics", "visibility": "client_view", "required": true},
    {"key": "blockers", "label": "Blockers & Escalations", "visibility": "client_view", "required": true}
  ]'::jsonb,
  '{
    "client_portal": {
      "name": "CEO Dashboard",
      "description": "Live view for the CEO/founder",
      "rooms": ["objectives", "initiatives", "metrics", "blockers"],
      "showFeaturedOnly": false
    },
    "weekly_update": {
      "name": "Weekly Ops Update",
      "description": "Quick status for leadership sync",
      "rooms": ["initiatives", "blockers", "metrics"],
      "showFeaturedOnly": true
    },
    "monthly_report": {
      "name": "Monthly Ops Report",
      "description": "Comprehensive monthly review",
      "rooms": ["objectives", "initiatives", "processes", "metrics"],
      "showFeaturedOnly": false
    },
    "board_prep": {
      "name": "Board Prep",
      "description": "Ops section for board deck",
      "rooms": ["objectives", "metrics"],
      "showFeaturedOnly": true
    }
  }'::jsonb,
  'public'
),

-- Fractional CMO
(
  '00000000-0000-0000-0000-000000000007',
  NULL,
  'Fractional CMO',
  'fractional-cmo',
  'For fractional Chief Marketing Officer roles - brand, demand gen, marketing ops',
  'fractional_cmo',
  '[
    {"key": "objectives", "label": "Marketing Objectives", "visibility": "client_view", "required": true},
    {"key": "campaigns", "label": "Campaigns & Programs", "visibility": "client_view", "required": true},
    {"key": "brand", "label": "Brand & Positioning", "visibility": "client_view", "required": false},
    {"key": "metrics", "label": "Marketing Metrics", "visibility": "client_view", "required": true},
    {"key": "budget", "label": "Budget & Spend", "visibility": "client_view", "required": true},
    {"key": "team", "label": "Team & Vendors", "visibility": "consultant_only", "required": false}
  ]'::jsonb,
  '{
    "client_portal": {
      "name": "Marketing Dashboard",
      "description": "Live marketing performance view",
      "rooms": ["objectives", "campaigns", "metrics", "budget"],
      "showFeaturedOnly": false
    },
    "weekly_update": {
      "name": "Weekly Marketing Update",
      "description": "Campaign status and metrics",
      "rooms": ["campaigns", "metrics"],
      "showFeaturedOnly": true
    },
    "monthly_report": {
      "name": "Monthly Marketing Report",
      "description": "Full marketing review with ROI",
      "rooms": ["objectives", "campaigns", "metrics", "budget"],
      "showFeaturedOnly": false
    },
    "board_prep": {
      "name": "Board Prep",
      "description": "Marketing section for board deck",
      "rooms": ["objectives", "metrics"],
      "showFeaturedOnly": true
    }
  }'::jsonb,
  'public'
),

-- Ops Transformation
(
  '00000000-0000-0000-0000-000000000008',
  NULL,
  'Ops Transformation',
  'ops-transformation',
  'For operations improvement projects - process redesign, automation, efficiency gains',
  'ops_transformation',
  '[
    {"key": "scope", "label": "Transformation Scope", "visibility": "client_view", "required": true},
    {"key": "current_state", "label": "Current State Assessment", "visibility": "client_view", "required": true},
    {"key": "future_state", "label": "Future State Design", "visibility": "client_view", "required": true},
    {"key": "roadmap", "label": "Implementation Roadmap", "visibility": "client_view", "required": true},
    {"key": "metrics", "label": "Success Metrics", "visibility": "client_view", "required": true},
    {"key": "change_mgmt", "label": "Change Management", "visibility": "client_view", "required": false}
  ]'::jsonb,
  '{
    "client_portal": {
      "name": "Transformation Hub",
      "description": "Project status and progress",
      "rooms": ["scope", "roadmap", "metrics"],
      "showFeaturedOnly": false
    },
    "steering_update": {
      "name": "Steering Committee Update",
      "description": "Executive progress report",
      "rooms": ["scope", "roadmap", "metrics"],
      "showFeaturedOnly": true
    },
    "handover": {
      "name": "Transformation Handover",
      "description": "Complete documentation for handoff",
      "rooms": ["current_state", "future_state", "roadmap", "change_mgmt"],
      "showFeaturedOnly": false
    }
  }'::jsonb,
  'public'
),

-- Org Design
(
  '00000000-0000-0000-0000-000000000009',
  NULL,
  'Org Design',
  'org-design',
  'For organizational design and restructuring projects',
  'org_design',
  '[
    {"key": "context", "label": "Business Context", "visibility": "client_view", "required": true},
    {"key": "current_org", "label": "Current Organization", "visibility": "consultant_only", "required": true},
    {"key": "design_options", "label": "Design Options", "visibility": "client_view", "required": true},
    {"key": "recommended", "label": "Recommended Structure", "visibility": "client_view", "required": true},
    {"key": "transition", "label": "Transition Plan", "visibility": "client_view", "required": true},
    {"key": "comms", "label": "Communications Plan", "visibility": "client_view", "required": false}
  ]'::jsonb,
  '{
    "client_portal": {
      "name": "Org Design Hub",
      "description": "Design options and recommendations",
      "rooms": ["context", "design_options", "recommended"],
      "showFeaturedOnly": false
    },
    "exec_presentation": {
      "name": "Executive Presentation",
      "description": "Board/exec team presentation",
      "rooms": ["context", "recommended", "transition"],
      "showFeaturedOnly": true
    },
    "implementation_guide": {
      "name": "Implementation Guide",
      "description": "Full implementation documentation",
      "rooms": ["recommended", "transition", "comms"],
      "showFeaturedOnly": false
    }
  }'::jsonb,
  'public'
),

-- Strategic Advisory (lighter than full strategy)
(
  '00000000-0000-0000-0000-000000000010',
  NULL,
  'Strategic Advisory',
  'strategic-advisory',
  'For senior advisory relationships - board seats, strategic counsel, sounding board',
  'strategic_advisory',
  '[
    {"key": "context", "label": "Company Context", "visibility": "client_view", "required": true},
    {"key": "topics", "label": "Advisory Topics", "visibility": "client_view", "required": true},
    {"key": "sessions", "label": "Session Notes", "visibility": "client_view", "required": true},
    {"key": "recommendations", "label": "Recommendations", "visibility": "client_view", "required": true},
    {"key": "resources", "label": "Resources & Intros", "visibility": "client_view", "required": false}
  ]'::jsonb,
  '{
    "client_portal": {
      "name": "Advisory Portal",
      "description": "Session history and recommendations",
      "rooms": ["topics", "sessions", "recommendations"],
      "showFeaturedOnly": false
    },
    "session_recap": {
      "name": "Session Recap",
      "description": "Post-session summary",
      "rooms": ["sessions", "recommendations"],
      "showFeaturedOnly": true
    },
    "relationship_summary": {
      "name": "Relationship Summary",
      "description": "Quarterly advisory relationship review",
      "rooms": ["context", "topics", "recommendations"],
      "showFeaturedOnly": true
    }
  }'::jsonb,
  'public'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  room_schema = EXCLUDED.room_schema,
  render_intents = EXCLUDED.render_intents;

-- ============================================================================
-- 3. Update render intent defaults in types
-- ============================================================================
-- Note: This is handled in code via RENDER_INTENT_DEFAULTS

-- ============================================================================
-- 4. Add engagement_type enum values for filtering
-- ============================================================================

COMMENT ON COLUMN engagements.engagement_type IS 'Type of engagement: strategy, fractional_coo, fractional_cmo, ops_transformation, org_design, strategic_advisory, implementation, advisory, due_diligence, custom';

COMMENT ON COLUMN engagements.estimated_weeks IS 'Expected engagement duration in weeks (typical: 6-16 for ICP)';

COMMENT ON COLUMN engagements.billing_model IS 'How the engagement is billed: project (fixed fee), retainer (monthly), hourly, value_based';
