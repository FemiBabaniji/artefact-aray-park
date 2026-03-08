-- Migration: Add structured room support
-- Adds field definitions and field values for structured rooms

-- Add missing columns to rooms
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;

-- Rename prompt to purpose (if prompt exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'prompt') THEN
    ALTER TABLE rooms RENAME COLUMN prompt TO purpose;
  END IF;
END $$;

-- Room field definitions (on the program schema)
CREATE TABLE IF NOT EXISTS room_fields (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id    uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  room_key      text NOT NULL,
  field_key     text NOT NULL,
  label         text NOT NULL,
  field_type    text NOT NULL CHECK (field_type IN ('text', 'longtext', 'number', 'date', 'file', 'url', 'select', 'boolean')),
  options       jsonb,  -- for select fields: ["Option A", "Option B"]
  required      boolean NOT NULL DEFAULT false,
  order_index   integer NOT NULL DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  UNIQUE(program_id, room_key, field_key)
);

-- Room field values (member responses for structured rooms)
CREATE TABLE IF NOT EXISTS room_field_values (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id       uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  field_key     text NOT NULL,
  value_text    text,
  value_number  numeric,
  value_date    date,
  value_boolean boolean,
  storage_path  text,  -- for file uploads
  updated_at    timestamptz DEFAULT now(),
  UNIQUE(room_id, field_key)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_room_fields_program ON room_fields(program_id);
CREATE INDEX IF NOT EXISTS idx_room_fields_room_key ON room_fields(program_id, room_key);
CREATE INDEX IF NOT EXISTS idx_room_field_values_room ON room_field_values(room_id);
CREATE INDEX IF NOT EXISTS idx_rooms_archived ON rooms(artefact_id) WHERE is_archived = false;

-- RLS policies
ALTER TABLE room_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_field_values ENABLE ROW LEVEL SECURITY;

-- Room fields: admins can manage field definitions for their programs
CREATE POLICY "Admins can manage room fields" ON room_fields
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM programs p
      JOIN community_roles cr ON cr.community_id = p.community_id
      WHERE p.id = room_fields.program_id
        AND cr.user_id = auth.uid()
        AND cr.role = 'admin'
    )
  );

-- Room fields: anyone can read field definitions (needed to render forms)
CREATE POLICY "Anyone can read room fields" ON room_fields
  FOR SELECT USING (true);

-- Room field values: members can manage their own values
CREATE POLICY "Members can manage own field values" ON room_field_values
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM rooms r
      JOIN artefacts a ON a.id = r.artefact_id
      JOIN members m ON m.id = a.member_id
      WHERE r.id = room_field_values.room_id
        AND m.user_id = auth.uid()
    )
  );

-- Room field values: admins can view all values in their community
CREATE POLICY "Admins can view all field values" ON room_field_values
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rooms r
      JOIN artefacts a ON a.id = r.artefact_id
      JOIN members m ON m.id = a.member_id
      JOIN community_roles cr ON cr.community_id = m.community_id
      WHERE r.id = room_field_values.room_id
        AND cr.user_id = auth.uid()
        AND cr.role = 'admin'
    )
  );

-- Comments
COMMENT ON TABLE room_fields IS 'Field definitions for structured rooms - stored at program level';
COMMENT ON TABLE room_field_values IS 'Member responses to structured room fields';
COMMENT ON COLUMN room_fields.field_type IS 'text|longtext|number|date|file|url|select|boolean';
COMMENT ON COLUMN room_fields.options IS 'JSON array of options for select fields';
