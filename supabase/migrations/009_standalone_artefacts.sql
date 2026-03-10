-- ════════════════════════════════════════════════════════════════════════════
-- Standalone Artefacts Schema (P0)
-- 4 tables: artefacts → rooms → blocks, milestones
-- ════════════════════════════════════════════════════════════════════════════

-- Visibility enum for rooms
create type room_visibility as enum ('public', 'private', 'unlisted');

-- Block type enum
create type block_type as enum ('text', 'image', 'link', 'metric', 'milestone', 'embed');

-- Milestone source enum
create type milestone_source as enum ('manual', 'github', 'signal');

-- ── Standalone Artefacts ────────────────────────────────────────────────────
-- The main portfolio/context object owned by a user

create table standalone_artefacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),  -- null = guest, immutable once set
  slug text unique,                         -- public URL slug
  identity jsonb not null default '{
    "name": "",
    "title": "",
    "bio": "",
    "location": "",
    "skills": [],
    "links": []
  }'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for user lookup
create index idx_standalone_artefacts_user_id on standalone_artefacts(user_id);
create index idx_standalone_artefacts_slug on standalone_artefacts(slug);

-- ── Standalone Rooms ────────────────────────────────────────────────────────
-- Sections within an artefact (About, Projects, Skills, etc.)

create table standalone_rooms (
  id uuid primary key default gen_random_uuid(),
  artefact_id uuid not null references standalone_artefacts(id) on delete cascade,
  key text not null,                        -- URL-safe identifier
  label text not null,                      -- Display name
  prompt text,                              -- Helper text for editing
  visibility room_visibility not null default 'public',
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

-- Index for artefact lookup
create index idx_standalone_rooms_artefact_id on standalone_rooms(artefact_id);

-- ── Standalone Blocks ───────────────────────────────────────────────────────
-- Content blocks within a room

create table standalone_blocks (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references standalone_rooms(id) on delete cascade,
  type block_type not null default 'text',
  content jsonb not null default '{}'::jsonb,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

-- Index for room lookup
create index idx_standalone_blocks_room_id on standalone_blocks(room_id);

-- ── Milestones ──────────────────────────────────────────────────────────────
-- Timeline events for the artefact

create table milestones (
  id uuid primary key default gen_random_uuid(),
  artefact_id uuid not null references standalone_artefacts(id) on delete cascade,
  title text not null,
  description text,
  date date not null,
  source milestone_source not null default 'manual',
  metadata jsonb default '{}'::jsonb,       -- For signal/github metadata
  created_at timestamptz not null default now()
);

-- Index for artefact lookup and date ordering
create index idx_milestones_artefact_id on milestones(artefact_id);
create index idx_milestones_date on milestones(date desc);

-- ── RLS Policies ────────────────────────────────────────────────────────────

alter table standalone_artefacts enable row level security;
alter table standalone_rooms enable row level security;
alter table standalone_blocks enable row level security;
alter table milestones enable row level security;

-- Artefacts: owners can do anything, public can read published
create policy "Users can manage own artefacts"
  on standalone_artefacts for all
  using (auth.uid() = user_id);

create policy "Public can read artefacts with slug"
  on standalone_artefacts for select
  using (slug is not null);

-- Rooms: follow artefact ownership, respect visibility
create policy "Users can manage rooms in own artefacts"
  on standalone_rooms for all
  using (
    exists (
      select 1 from standalone_artefacts
      where id = standalone_rooms.artefact_id
      and user_id = auth.uid()
    )
  );

create policy "Public can read public rooms"
  on standalone_rooms for select
  using (
    visibility = 'public'
    and exists (
      select 1 from standalone_artefacts
      where id = standalone_rooms.artefact_id
      and slug is not null
    )
  );

-- Blocks: follow room ownership
create policy "Users can manage blocks in own rooms"
  on standalone_blocks for all
  using (
    exists (
      select 1 from standalone_rooms r
      join standalone_artefacts a on a.id = r.artefact_id
      where r.id = standalone_blocks.room_id
      and a.user_id = auth.uid()
    )
  );

create policy "Public can read blocks in public rooms"
  on standalone_blocks for select
  using (
    exists (
      select 1 from standalone_rooms r
      join standalone_artefacts a on a.id = r.artefact_id
      where r.id = standalone_blocks.room_id
      and r.visibility = 'public'
      and a.slug is not null
    )
  );

-- Milestones: follow artefact ownership
create policy "Users can manage own milestones"
  on milestones for all
  using (
    exists (
      select 1 from standalone_artefacts
      where id = milestones.artefact_id
      and user_id = auth.uid()
    )
  );

create policy "Public can read milestones for published artefacts"
  on milestones for select
  using (
    exists (
      select 1 from standalone_artefacts
      where id = milestones.artefact_id
      and slug is not null
    )
  );

-- ── Updated At Trigger ──────────────────────────────────────────────────────

create or replace function update_standalone_artefact_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger standalone_artefacts_updated_at
  before update on standalone_artefacts
  for each row execute function update_standalone_artefact_timestamp();

-- ── Helper View: Full Artefact with Rooms + Blocks ──────────────────────────

create view artefact_full as
select
  a.id,
  a.user_id,
  a.slug,
  a.identity,
  a.created_at,
  a.updated_at,
  coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', r.id,
        'key', r.key,
        'label', r.label,
        'prompt', r.prompt,
        'visibility', r.visibility,
        'order_index', r.order_index,
        'blocks', (
          select coalesce(jsonb_agg(
            jsonb_build_object(
              'id', b.id,
              'type', b.type,
              'content', b.content,
              'order_index', b.order_index
            ) order by b.order_index
          ), '[]'::jsonb)
          from standalone_blocks b
          where b.room_id = r.id
        )
      ) order by r.order_index
    ) filter (where r.id is not null),
    '[]'::jsonb
  ) as rooms
from standalone_artefacts a
left join standalone_rooms r on r.artefact_id = a.id
group by a.id;
