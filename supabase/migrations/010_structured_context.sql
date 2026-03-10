-- ════════════════════════════════════════════════════════════════════════════
-- P0 + P1: Standalone Artefacts with Structured Context
-- Combines base tables (P0) with typed blocks and graph edges (P1)
-- ════════════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════════════
-- P0: Base Types and Tables
-- ══════════════════════════════════════════════════════════════════════════

-- Visibility enum for rooms
create type room_visibility as enum ('public', 'private', 'unlisted');

-- Block type enum (includes P1 semantic types)
create type block_type as enum (
  'text', 'image', 'link', 'metric', 'milestone', 'embed',
  'project', 'skill', 'experience', 'education', 'certification', 'relationship'
);

-- Milestone source enum
create type milestone_source as enum ('manual', 'github', 'signal');

-- Room semantic enum (P1)
create type room_semantic as enum (
  'about', 'projects', 'skills', 'experience', 'education',
  'timeline', 'metrics', 'network', 'custom'
);

-- Edge type enum (P1)
create type edge_type as enum (
  'worked_on', 'learned', 'collaborated_with', 'employed_by',
  'studied_at', 'mentored_by', 'uses_tool', 'related_to'
);

-- ── Standalone Artefacts ────────────────────────────────────────────────────

create table standalone_artefacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  slug text unique,
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

create index idx_standalone_artefacts_user_id on standalone_artefacts(user_id);
create index idx_standalone_artefacts_slug on standalone_artefacts(slug);

-- ── Standalone Rooms ────────────────────────────────────────────────────────

create table standalone_rooms (
  id uuid primary key default gen_random_uuid(),
  artefact_id uuid not null references standalone_artefacts(id) on delete cascade,
  key text not null,
  label text not null,
  prompt text,
  semantic room_semantic not null default 'custom',
  visibility room_visibility not null default 'public',
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_standalone_rooms_artefact_id on standalone_rooms(artefact_id);

-- ── Standalone Blocks ───────────────────────────────────────────────────────

create table standalone_blocks (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references standalone_rooms(id) on delete cascade,
  type block_type not null default 'text',
  content jsonb not null default '{}'::jsonb,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_standalone_blocks_room_id on standalone_blocks(room_id);

-- ── Milestones ──────────────────────────────────────────────────────────────

create table milestones (
  id uuid primary key default gen_random_uuid(),
  artefact_id uuid not null references standalone_artefacts(id) on delete cascade,
  title text not null,
  description text,
  date date not null,
  source milestone_source not null default 'manual',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_milestones_artefact_id on milestones(artefact_id);
create index idx_milestones_date on milestones(date desc);

-- ══════════════════════════════════════════════════════════════════════════
-- P1: Graph Edges
-- ══════════════════════════════════════════════════════════════════════════

create table graph_edges (
  id uuid primary key default gen_random_uuid(),
  artefact_id uuid not null references standalone_artefacts(id) on delete cascade,
  edge_type edge_type not null,
  source_type text not null,
  source_id text not null,
  target_type text not null,
  target_id text,
  target_ref text,
  weight float default 1.0,
  context text,
  start_date date,
  end_date date,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_graph_edges_artefact on graph_edges(artefact_id);
create index idx_graph_edges_source on graph_edges(source_type, source_id);
create index idx_graph_edges_target on graph_edges(target_type, target_id);
create index idx_graph_edges_type on graph_edges(edge_type);

-- ══════════════════════════════════════════════════════════════════════════
-- RLS Policies
-- ══════════════════════════════════════════════════════════════════════════

alter table standalone_artefacts enable row level security;
alter table standalone_rooms enable row level security;
alter table standalone_blocks enable row level security;
alter table milestones enable row level security;
alter table graph_edges enable row level security;

-- Artefacts
create policy "Users can manage own artefacts"
  on standalone_artefacts for all
  using (auth.uid() = user_id);

create policy "Public can read artefacts with slug"
  on standalone_artefacts for select
  using (slug is not null);

-- Rooms
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

-- Blocks
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

-- Milestones
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

-- Graph Edges
create policy "Users can manage own graph edges"
  on graph_edges for all
  using (
    exists (
      select 1 from standalone_artefacts
      where id = graph_edges.artefact_id
      and user_id = auth.uid()
    )
  );

create policy "Public can read graph edges for published artefacts"
  on graph_edges for select
  using (
    exists (
      select 1 from standalone_artefacts
      where id = graph_edges.artefact_id
      and slug is not null
    )
  );

-- ══════════════════════════════════════════════════════════════════════════
-- Triggers and Functions
-- ══════════════════════════════════════════════════════════════════════════

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

-- ══════════════════════════════════════════════════════════════════════════
-- Views
-- ══════════════════════════════════════════════════════════════════════════

-- Full artefact with rooms and blocks
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
        'semantic', r.semantic,
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

-- Skills aggregation
create view artefact_skills as
select
  a.id as artefact_id,
  a.slug,
  skill_data.name,
  skill_data.category,
  skill_data.level,
  count(*) as usage_count
from standalone_artefacts a
join standalone_rooms r on r.artefact_id = a.id
join standalone_blocks b on b.room_id = r.id
cross join lateral (
  select
    b.content->>'name' as name,
    b.content->>'category' as category,
    b.content->>'level' as level
  where b.type = 'skill'
  union all
  select
    jsonb_array_elements_text(b.content->'skills') as name,
    'project' as category,
    null as level
  where b.type = 'project' and b.content ? 'skills'
) skill_data
where skill_data.name is not null
group by a.id, a.slug, skill_data.name, skill_data.category, skill_data.level;

-- Timeline aggregation
create view artefact_timeline as
select
  a.id as artefact_id,
  a.slug,
  'milestone' as item_type,
  m.id::text as item_id,
  m.title,
  m.description,
  m.date::text as start_date,
  null::text as end_date,
  m.source::text as source,
  m.metadata
from standalone_artefacts a
join milestones m on m.artefact_id = a.id
union all
select
  a.id as artefact_id,
  a.slug,
  b.type::text as item_type,
  b.id::text as item_id,
  coalesce(b.content->>'title', b.content->>'name', b.content->>'institution') as title,
  b.content->>'description' as description,
  coalesce(b.content->>'startDate', b.content->>'date') as start_date,
  b.content->>'endDate' as end_date,
  'block' as source,
  b.content as metadata
from standalone_artefacts a
join standalone_rooms r on r.artefact_id = a.id
join standalone_blocks b on b.room_id = r.id
where b.type in ('project', 'experience', 'education', 'certification', 'milestone')
  and (b.content->>'startDate' is not null or b.content->>'date' is not null);

-- ══════════════════════════════════════════════════════════════════════════
-- Block Content Schema Documentation
-- ══════════════════════════════════════════════════════════════════════════

comment on column standalone_blocks.content is '
Block content varies by type:

text: { body: string, format?: "markdown"|"html" }
image: { url?: string, storagePath?: string, caption?: string, alt?: string }
link: { url: string, title?: string, description?: string, image?: string }
embed: { url: string, provider?: string, html?: string }
metric: { value: number|string, label: string, unit?: string, change?: number }
milestone: { title: string, date: string, description?: string }
project: { title: string, role?: string, url?: string, skills?: string[], highlights?: string[] }
skill: { name: string, level?: string, years?: number, category?: string }
experience: { title: string, organization: string, startDate: string, endDate?: string, highlights?: string[] }
education: { institution: string, degree?: string, field?: string }
certification: { name: string, issuer: string, date?: string, url?: string }
relationship: { personName: string, relationship: string, context?: string }
';
