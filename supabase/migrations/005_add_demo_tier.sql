-- Migration: Add demo tier to community_tier_enum
-- NOTE: ALTER TYPE cannot run inside a transaction, so this must be a standalone migration

ALTER TYPE community_tier_enum ADD VALUE IF NOT EXISTS 'demo';
