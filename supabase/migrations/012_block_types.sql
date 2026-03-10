-- Migration: Extend block types for structured content
-- Must be applied in separate transaction before using the new enum values

ALTER TYPE block_type_enum ADD VALUE IF NOT EXISTS 'metric';
ALTER TYPE block_type_enum ADD VALUE IF NOT EXISTS 'milestone';
ALTER TYPE block_type_enum ADD VALUE IF NOT EXISTS 'project';
ALTER TYPE block_type_enum ADD VALUE IF NOT EXISTS 'skill';
ALTER TYPE block_type_enum ADD VALUE IF NOT EXISTS 'experience';
ALTER TYPE block_type_enum ADD VALUE IF NOT EXISTS 'education';
ALTER TYPE block_type_enum ADD VALUE IF NOT EXISTS 'certification';
ALTER TYPE block_type_enum ADD VALUE IF NOT EXISTS 'relationship';
ALTER TYPE block_type_enum ADD VALUE IF NOT EXISTS 'document';
