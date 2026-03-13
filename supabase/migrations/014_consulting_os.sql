-- Consulting OS Schema
-- Engagement-centric architecture for professional services

-- Using gen_random_uuid() which is built into PostgreSQL 13+

-- ══════════════════════════════════════════════════════════════════════════════
-- Enums
-- ══════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE engagement_phase_enum AS ENUM (
    'intake', 'qualification', 'proposal', 'negotiation',
    'signed', 'delivery', 'completed', 'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE participant_role_enum AS ENUM (
    'lead_consultant', 'consultant', 'client_contact', 'client_observer', 'observer'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE engagement_room_visibility_enum AS ENUM (
    'consultant_only', 'client_view', 'client_edit'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE client_type_enum AS ENUM ('organization', 'individual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════════════════════
-- Clients
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS clients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type          client_type_enum NOT NULL DEFAULT 'organization',
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  industry      TEXT,
  website       TEXT,
  logo_url      TEXT,
  notes         TEXT,
  tags          TEXT[] DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS clients_owner_id_idx ON clients(owner_id);
CREATE INDEX IF NOT EXISTS clients_slug_idx ON clients(slug);

-- Client contacts
CREATE TABLE IF NOT EXISTS client_contacts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT,
  title         TEXT,
  is_primary    BOOLEAN NOT NULL DEFAULT false,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS client_contacts_client_id_idx ON client_contacts(client_id);
CREATE INDEX IF NOT EXISTS client_contacts_email_idx ON client_contacts(email);

-- ══════════════════════════════════════════════════════════════════════════════
-- Engagements
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS engagements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_id     UUID REFERENCES clients(id) ON DELETE SET NULL,
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  phase         engagement_phase_enum NOT NULL DEFAULT 'intake',
  start_date    DATE,
  end_date      DATE,
  value         NUMERIC(12,2),
  currency      TEXT NOT NULL DEFAULT 'USD',
  theme         TEXT NOT NULL DEFAULT 'dark',
  room_schema   JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS engagements_owner_id_idx ON engagements(owner_id);
CREATE INDEX IF NOT EXISTS engagements_client_id_idx ON engagements(client_id);
CREATE INDEX IF NOT EXISTS engagements_slug_idx ON engagements(slug);
CREATE INDEX IF NOT EXISTS engagements_phase_idx ON engagements(phase);

-- ══════════════════════════════════════════════════════════════════════════════
-- Participants
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS engagement_participants (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id     UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_contact_id UUID REFERENCES client_contacts(id) ON DELETE SET NULL,
  name              TEXT NOT NULL,
  email             TEXT NOT NULL,
  role              participant_role_enum NOT NULL,
  access            JSONB NOT NULL DEFAULT '{}'::jsonb,
  invited_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  invited_by        UUID REFERENCES auth.users(id),
  joined_at         TIMESTAMPTZ,
  last_active_at    TIMESTAMPTZ,
  CONSTRAINT participant_identity CHECK (
    user_id IS NOT NULL OR client_contact_id IS NOT NULL OR email IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS engagement_participants_engagement_id_idx ON engagement_participants(engagement_id);
CREATE INDEX IF NOT EXISTS engagement_participants_user_id_idx ON engagement_participants(user_id);
CREATE INDEX IF NOT EXISTS engagement_participants_email_idx ON engagement_participants(email);

-- Participant invitations (for email invites)
CREATE TABLE IF NOT EXISTS participant_invitations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id   UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  name            TEXT NOT NULL,
  role            participant_role_enum NOT NULL,
  invited_by      UUID REFERENCES auth.users(id),
  invited_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at     TIMESTAMPTZ,
  token           TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text
);

CREATE INDEX IF NOT EXISTS participant_invitations_token_idx ON participant_invitations(token);
CREATE INDEX IF NOT EXISTS participant_invitations_engagement_id_idx ON participant_invitations(engagement_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- Engagement Rooms
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS engagement_rooms (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id   UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  key             TEXT NOT NULL,
  label           TEXT NOT NULL,
  room_type       TEXT NOT NULL DEFAULT 'custom',
  visibility      engagement_room_visibility_enum NOT NULL DEFAULT 'consultant_only',
  prompt          TEXT,
  required        BOOLEAN NOT NULL DEFAULT false,
  order_index     INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(engagement_id, key)
);

CREATE INDEX IF NOT EXISTS engagement_rooms_engagement_id_idx ON engagement_rooms(engagement_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- Engagement Blocks
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS engagement_blocks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id         UUID NOT NULL REFERENCES engagement_rooms(id) ON DELETE CASCADE,
  block_type      TEXT NOT NULL,
  content         TEXT,
  storage_path    TEXT,
  caption         TEXT,
  metadata        JSONB DEFAULT '{}'::jsonb,
  order_index     INT NOT NULL DEFAULT 0,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS engagement_blocks_room_id_idx ON engagement_blocks(room_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- Event Sourcing
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS engagement_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id   UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL,
  payload         JSONB NOT NULL,
  actor_id        UUID REFERENCES auth.users(id),
  sequence        INT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS engagement_events_seq_idx ON engagement_events(engagement_id, sequence);
CREATE INDEX IF NOT EXISTS engagement_events_engagement_id_idx ON engagement_events(engagement_id);
CREATE INDEX IF NOT EXISTS engagement_events_type_idx ON engagement_events(event_type);

-- ══════════════════════════════════════════════════════════════════════════════
-- Phase Transitions (audit trail)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS engagement_phase_transitions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id   UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  from_phase      engagement_phase_enum,
  to_phase        engagement_phase_enum NOT NULL,
  transitioned_by UUID REFERENCES auth.users(id),
  reason          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS engagement_phase_transitions_engagement_id_idx ON engagement_phase_transitions(engagement_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- Views
-- ══════════════════════════════════════════════════════════════════════════════

-- Engagement with client and counts
CREATE OR REPLACE VIEW engagement_summary AS
SELECT
  e.id,
  e.slug,
  e.name,
  e.phase,
  e.value,
  e.currency,
  e.start_date,
  e.end_date,
  e.owner_id,
  e.created_at,
  e.updated_at,
  c.id AS client_id,
  c.name AS client_name,
  c.logo_url AS client_logo_url,
  (SELECT COUNT(*) FROM engagement_rooms er WHERE er.engagement_id = e.id) AS room_count,
  (SELECT COUNT(*) FROM engagement_participants ep WHERE ep.engagement_id = e.id) AS participant_count,
  (SELECT MAX(ee.created_at) FROM engagement_events ee WHERE ee.engagement_id = e.id) AS last_activity_at
FROM engagements e
LEFT JOIN clients c ON e.client_id = c.id;

-- Client with engagement stats
CREATE OR REPLACE VIEW client_summary AS
SELECT
  c.id,
  c.name,
  c.slug,
  c.type,
  c.industry,
  c.logo_url,
  c.owner_id,
  c.created_at,
  (SELECT COUNT(*) FROM engagements e WHERE e.client_id = c.id) AS engagement_count,
  (SELECT COUNT(*) FROM engagements e WHERE e.client_id = c.id AND e.phase IN ('signed', 'delivery')) AS active_engagements,
  (SELECT MAX(e.updated_at) FROM engagements e WHERE e.client_id = c.id) AS last_engagement_date,
  (SELECT COALESCE(SUM(e.value), 0) FROM engagements e WHERE e.client_id = c.id AND e.phase = 'completed') AS total_value
FROM clients c;

-- ══════════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_phase_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_invitations ENABLE ROW LEVEL SECURITY;

-- Clients: owners can see their clients
CREATE POLICY clients_owner_access ON clients
  FOR ALL USING (owner_id = auth.uid());

-- Client contacts: access through client ownership
CREATE POLICY client_contacts_access ON client_contacts
  FOR ALL USING (
    client_id IN (SELECT id FROM clients WHERE owner_id = auth.uid())
  );

-- Engagements: owners and participants can access
CREATE POLICY engagements_access ON engagements
  FOR ALL USING (
    owner_id = auth.uid() OR
    id IN (SELECT engagement_id FROM engagement_participants WHERE user_id = auth.uid())
  );

-- Participants: engagement access
CREATE POLICY engagement_participants_access ON engagement_participants
  FOR ALL USING (
    engagement_id IN (
      SELECT id FROM engagements WHERE owner_id = auth.uid()
      UNION
      SELECT engagement_id FROM engagement_participants WHERE user_id = auth.uid()
    )
  );

-- Rooms: engagement access
CREATE POLICY engagement_rooms_access ON engagement_rooms
  FOR ALL USING (
    engagement_id IN (
      SELECT id FROM engagements WHERE owner_id = auth.uid()
      UNION
      SELECT engagement_id FROM engagement_participants WHERE user_id = auth.uid()
    )
  );

-- Blocks: room access (through engagement)
CREATE POLICY engagement_blocks_access ON engagement_blocks
  FOR ALL USING (
    room_id IN (
      SELECT er.id FROM engagement_rooms er
      JOIN engagements e ON er.engagement_id = e.id
      WHERE e.owner_id = auth.uid()
      UNION
      SELECT er.id FROM engagement_rooms er
      JOIN engagement_participants ep ON er.engagement_id = ep.engagement_id
      WHERE ep.user_id = auth.uid()
    )
  );

-- Events: engagement access
CREATE POLICY engagement_events_access ON engagement_events
  FOR ALL USING (
    engagement_id IN (
      SELECT id FROM engagements WHERE owner_id = auth.uid()
      UNION
      SELECT engagement_id FROM engagement_participants WHERE user_id = auth.uid()
    )
  );

-- Phase transitions: engagement access
CREATE POLICY engagement_phase_transitions_access ON engagement_phase_transitions
  FOR ALL USING (
    engagement_id IN (
      SELECT id FROM engagements WHERE owner_id = auth.uid()
      UNION
      SELECT engagement_id FROM engagement_participants WHERE user_id = auth.uid()
    )
  );

-- Invitations: engagement owners and invitees
CREATE POLICY participant_invitations_access ON participant_invitations
  FOR ALL USING (
    engagement_id IN (SELECT id FROM engagements WHERE owner_id = auth.uid()) OR
    email = auth.email()
  );

-- ══════════════════════════════════════════════════════════════════════════════
-- Triggers
-- ══════════════════════════════════════════════════════════════════════════════

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_engagements_updated_at ON engagements;
CREATE TRIGGER update_engagements_updated_at
  BEFORE UPDATE ON engagements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_engagement_rooms_updated_at ON engagement_rooms;
CREATE TRIGGER update_engagement_rooms_updated_at
  BEFORE UPDATE ON engagement_rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
