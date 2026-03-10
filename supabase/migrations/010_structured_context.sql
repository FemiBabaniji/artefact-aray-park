-- ════════════════════════════════════════════════════════════════════════════
-- P1: Structured Context
-- Typed blocks, room semantics, and graph edges
-- ════════════════════════════════════════════════════════════════════════════

-- ── Extended Block Types ────────────────────────────────────────────────────
-- Add semantic block types for structured content

alter type block_type add value 'project';
alter type block_type add value 'skill';
alter type block_type add value 'experience';
alter type block_type add value 'education';
alter type block_type add value 'certification';
alter type block_type add value 'relationship';

-- ── Room Semantics ──────────────────────────────────────────────────────────
-- Room types inform output compilation (resume vs portfolio vs context)

create type room_semantic as enum (
  'about',        -- Bio, background
  'projects',     -- Portfolio work
  'skills',       -- Capabilities
  'experience',   -- Work history
  'education',    -- Learning history
  'timeline',     -- Chronological milestones
  'metrics',      -- Quantifiable achievements
  'network',      -- Relationships, collaborators
  'custom'        -- User-defined
);

-- Add semantic type to rooms
alter table standalone_rooms
  add column semantic room_semantic default 'custom';

-- Update default rooms to have proper semantics
-- (Run after migration if rooms exist)

-- ── Graph Edges ─────────────────────────────────────────────────────────────
-- Relationships between entities: worked_on, learned, collaborated_with

create type edge_type as enum (
  'worked_on',        -- Person → Project
  'learned',          -- Person → Skill (via Project or Education)
  'collaborated_with', -- Person → Person
  'employed_by',      -- Person → Organization
  'studied_at',       -- Person → Institution
  'mentored_by',      -- Person → Person
  'uses_tool',        -- Project → Skill/Tool
  'related_to'        -- Generic relationship
);

create table graph_edges (
  id uuid primary key default gen_random_uuid(),
  artefact_id uuid not null references standalone_artefacts(id) on delete cascade,

  -- Edge definition
  edge_type edge_type not null,

  -- Source node (always within this artefact)
  source_type text not null,        -- 'block', 'identity', 'milestone'
  source_id text not null,          -- Block ID, 'self', or milestone ID

  -- Target node (can be internal or external reference)
  target_type text not null,        -- 'block', 'skill', 'project', 'person', 'org'
  target_id text,                   -- Block ID if internal
  target_ref text,                  -- External reference (name, URL, etc.)

  -- Metadata
  weight float default 1.0,         -- Strength of relationship
  context text,                     -- "Senior Engineer", "Lead Developer", etc.
  start_date date,                  -- When relationship started
  end_date date,                    -- When relationship ended (null = ongoing)
  metadata jsonb default '{}'::jsonb,

  created_at timestamptz not null default now()
);

-- Indexes for graph queries
create index idx_graph_edges_artefact on graph_edges(artefact_id);
create index idx_graph_edges_source on graph_edges(source_type, source_id);
create index idx_graph_edges_target on graph_edges(target_type, target_id);
create index idx_graph_edges_type on graph_edges(edge_type);

-- ── RLS for Graph Edges ─────────────────────────────────────────────────────

alter table graph_edges enable row level security;

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

-- ── Typed Block Content Schemas (Documentation) ─────────────────────────────
-- These are enforced at the application layer, documented here for reference

comment on column standalone_blocks.content is '
Block content varies by type:

text: { body: string, format?: "markdown"|"html" }

image: { url?: string, storagePath?: string, caption?: string, alt?: string }

link: { url: string, title?: string, description?: string, image?: string }

embed: { url: string, provider?: string, html?: string }

metric: {
  value: number|string,
  label: string,
  unit?: string,
  change?: number,
  period?: string
}

milestone: {
  title: string,
  date: string,
  description?: string,
  type?: "achievement"|"release"|"event"
}

project: {
  title: string,
  description?: string,
  role?: string,
  url?: string,
  image?: string,
  startDate?: string,
  endDate?: string,
  status?: "completed"|"in_progress"|"planned",
  skills?: string[],
  highlights?: string[]
}

skill: {
  name: string,
  level?: "beginner"|"intermediate"|"advanced"|"expert",
  years?: number,
  category?: string,
  endorsed?: boolean
}

experience: {
  title: string,
  organization: string,
  location?: string,
  startDate: string,
  endDate?: string,
  current?: boolean,
  description?: string,
  highlights?: string[]
}

education: {
  institution: string,
  degree?: string,
  field?: string,
  startDate?: string,
  endDate?: string,
  gpa?: string,
  highlights?: string[]
}

certification: {
  name: string,
  issuer: string,
  date?: string,
  expires?: string,
  credentialId?: string,
  url?: string
}

relationship: {
  personName: string,
  personTitle?: string,
  personOrg?: string,
  relationship: string,
  context?: string,
  url?: string
}
';

-- ── Skills Extraction View ──────────────────────────────────────────────────
-- Aggregate all skills from projects, experience, and skill blocks

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
  -- Extract from skill blocks
  select
    b.content->>'name' as name,
    b.content->>'category' as category,
    b.content->>'level' as level
  where b.type = 'skill'

  union all

  -- Extract from project skills arrays
  select
    jsonb_array_elements_text(b.content->'skills') as name,
    'project' as category,
    null as level
  where b.type = 'project' and b.content ? 'skills'
) skill_data
where skill_data.name is not null
group by a.id, a.slug, skill_data.name, skill_data.category, skill_data.level;

-- ── Timeline View ───────────────────────────────────────────────────────────
-- Unified timeline from milestones, projects, experience, education

create view artefact_timeline as
select
  a.id as artefact_id,
  a.slug,
  'milestone' as item_type,
  m.id as item_id,
  m.title,
  m.description,
  m.date::text as start_date,
  null as end_date,
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
