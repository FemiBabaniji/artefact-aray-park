-- Rooms v2: Named spaces with freeform blocks
-- Clean migration - run this on a fresh database or after dropping old room tables

-- Drop old views first (they reference old column names)
DROP VIEW IF EXISTS member_progress CASCADE;
DROP VIEW IF EXISTS at_risk_members CASCADE;

-- Drop old room tables if they exist (v1 schema)
DROP TABLE IF EXISTS room_process_images CASCADE;
DROP TABLE IF EXISTS room_content_process CASCADE;
DROP TABLE IF EXISTS room_content_works CASCADE;
DROP TABLE IF EXISTS room_content_media CASCADE;
DROP TABLE IF EXISTS room_content_text CASCADE;
DROP TABLE IF EXISTS room_blocks CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;

-- Drop old enums
DROP TYPE IF EXISTS room_type_enum CASCADE;
DROP TYPE IF EXISTS stage_marker_enum CASCADE;
DROP TYPE IF EXISTS room_status_enum CASCADE;
DROP TYPE IF EXISTS pace_enum CASCADE;
DROP TYPE IF EXISTS room_status_v2_enum CASCADE;
DROP TYPE IF EXISTS block_type_enum CASCADE;

-- ═══════════════════════════════════════════════════════════════════════════
-- v2 Schema: Rooms are named spaces. Members add blocks (furniture) freely.
-- ═══════════════════════════════════════════════════════════════════════════

-- Pace enum (when program expects room to be worked on)
CREATE TYPE pace_enum AS ENUM ('foundation', 'development', 'ongoing');

-- Room status enum
CREATE TYPE room_status_enum AS ENUM ('empty', 'active', 'submitted', 'feedback', 'complete');

-- Block type enum (the furniture members add)
CREATE TYPE block_type_enum AS ENUM ('text', 'image', 'link', 'embed');

-- Rooms table (named spaces)
CREATE TABLE rooms (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artefact_id   uuid NOT NULL REFERENCES artefacts(id) ON DELETE CASCADE,
  key           text NOT NULL,
  label         text NOT NULL,
  prompt        text,
  pace          pace_enum NOT NULL DEFAULT 'foundation',
  status        room_status_enum NOT NULL DEFAULT 'empty',
  order_index   integer NOT NULL DEFAULT 0,
  is_public     boolean NOT NULL DEFAULT true,
  is_structured boolean NOT NULL DEFAULT false,  -- if true, shows form instead of blocks
  feedback      text,
  feedback_at   timestamptz,
  feedback_by   uuid REFERENCES members(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(artefact_id, key)
);

-- Room blocks table (content members add to rooms)
CREATE TABLE room_blocks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id       uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  block_type    block_type_enum NOT NULL,
  content       text,              -- text: markdown/html, link: url, embed: url
  storage_path  text,              -- image uploads
  caption       text,
  metadata      jsonb DEFAULT '{}'::jsonb,  -- og_title, og_image, width, height, etc.
  order_index   integer NOT NULL DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_rooms_artefact ON rooms(artefact_id);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_rooms_pace ON rooms(pace);
CREATE INDEX idx_room_blocks_room ON room_blocks(room_id);
CREATE INDEX idx_room_blocks_order ON room_blocks(room_id, order_index);

-- Add room_schema to programs (if not exists)
ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS room_schema jsonb NOT NULL DEFAULT '[]'::jsonb;

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS Policies
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_blocks ENABLE ROW LEVEL SECURITY;

-- Rooms policies
CREATE POLICY "Members can view own rooms" ON rooms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM artefacts a
      JOIN members m ON m.id = a.member_id
      WHERE a.id = rooms.artefact_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update own rooms" ON rooms
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM artefacts a
      JOIN members m ON m.id = a.member_id
      WHERE a.id = rooms.artefact_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all rooms" ON rooms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM artefacts a
      JOIN members m ON m.id = a.member_id
      JOIN community_roles cr ON cr.community_id = m.community_id
      WHERE a.id = rooms.artefact_id
      AND cr.user_id = auth.uid() AND cr.role = 'admin'
    )
  );

-- Room blocks policies
CREATE POLICY "Members can view own room blocks" ON room_blocks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rooms r
      JOIN artefacts a ON a.id = r.artefact_id
      JOIN members m ON m.id = a.member_id
      WHERE r.id = room_blocks.room_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert own room blocks" ON room_blocks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms r
      JOIN artefacts a ON a.id = r.artefact_id
      JOIN members m ON m.id = a.member_id
      WHERE r.id = room_blocks.room_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update own room blocks" ON room_blocks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM rooms r
      JOIN artefacts a ON a.id = r.artefact_id
      JOIN members m ON m.id = a.member_id
      WHERE r.id = room_blocks.room_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can delete own room blocks" ON room_blocks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM rooms r
      JOIN artefacts a ON a.id = r.artefact_id
      JOIN members m ON m.id = a.member_id
      WHERE r.id = room_blocks.room_id AND m.user_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- Migrate existing sections to rooms (if sections exist)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO rooms (artefact_id, key, label, prompt, pace, status, order_index, is_public)
SELECT
  s.artefact_id,
  s.key,
  s.label,
  NULL,
  CASE WHEN s.cp = 1 THEN 'foundation'::pace_enum ELSE 'development'::pace_enum END,
  CASE s.status
    WHEN 'empty' THEN 'empty'::room_status_enum
    WHEN 'in_progress' THEN 'active'::room_status_enum
    WHEN 'submitted' THEN 'submitted'::room_status_enum
    WHEN 'reviewed' THEN 'feedback'::room_status_enum
    WHEN 'accepted' THEN 'complete'::room_status_enum
    ELSE 'empty'::room_status_enum
  END,
  CASE s.key
    WHEN 'practice' THEN 0 WHEN 'focus' THEN 1 WHEN 'material' THEN 2 WHEN 'influences' THEN 3
    WHEN 'series' THEN 4 WHEN 'exhibition' THEN 5 WHEN 'collab' THEN 6 ELSE 7
  END,
  true
FROM sections s
ON CONFLICT (artefact_id, key) DO NOTHING;

-- Migrate section content to room blocks (as text blocks)
INSERT INTO room_blocks (room_id, block_type, content, order_index)
SELECT r.id, 'text'::block_type_enum, s.evidence, 0
FROM sections s
JOIN rooms r ON r.artefact_id = s.artefact_id AND r.key = s.key
WHERE s.evidence IS NOT NULL AND s.evidence != ''
ON CONFLICT DO NOTHING;

-- Copy feedback to rooms
UPDATE rooms r
SET feedback = s.feedback, feedback_at = s.feedback_at, feedback_by = s.feedback_by
FROM sections s
WHERE r.artefact_id = s.artefact_id AND r.key = s.key AND s.feedback IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- Recreate views with new schema
-- ═══════════════════════════════════════════════════════════════════════════

CREATE VIEW at_risk_members WITH (security_invoker = true) AS
SELECT
  m.*,
  COUNT(r.id) FILTER (WHERE r.status = 'complete') AS accepted_count,
  MAX(r.updated_at) AS last_activity,
  (COUNT(r.id) FILTER (WHERE r.status = 'complete') < 3
   AND MAX(r.updated_at) < now() - interval '10 days') AS at_risk
FROM members m
JOIN artefacts a ON a.member_id = m.id
JOIN rooms r ON r.artefact_id = a.id
WHERE r.pace != 'ongoing'
GROUP BY m.id;

CREATE VIEW member_progress WITH (security_invoker = true) AS
SELECT
  m.id AS member_id,
  COUNT(r.id) FILTER (WHERE r.pace != 'ongoing') AS total_rooms,
  COUNT(r.id) FILTER (WHERE r.status = 'complete') AS complete_rooms,
  ROUND(
    COUNT(r.id) FILTER (WHERE r.status = 'complete')::numeric
    / NULLIF(COUNT(r.id) FILTER (WHERE r.pace != 'ongoing'), 0) * 100
  ) AS pct
FROM members m
JOIN artefacts a ON a.member_id = m.id
JOIN rooms r ON r.artefact_id = a.id
GROUP BY m.id;

-- ═══════════════════════════════════════════════════════════════════════════
-- Documentation
-- ═══════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE rooms IS 'Named spaces in a member artefact. Members add content via blocks.';
COMMENT ON TABLE room_blocks IS 'Content blocks within rooms - members compose freely with text, images, links, embeds';
COMMENT ON COLUMN rooms.pace IS 'When the program expects this room to be worked on: foundation (early), development (mid), ongoing (anytime)';
COMMENT ON COLUMN rooms.is_structured IS 'If true, room shows a specific form (e.g., works list) instead of freeform blocks';
