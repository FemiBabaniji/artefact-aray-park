-- Artefact Platform Schema
-- Run this in Supabase SQL Editor or via CLI: supabase db push

-- Extensions
create extension if not exists "uuid-ossp";

-- Enums
do $$ begin
  create type stage_enum as enum (
    'pending', 'entry', 'foundation', 'development', 'showcase', 'graduate'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type section_status_enum as enum (
    'empty', 'in_progress', 'submitted', 'reviewed', 'accepted'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type community_tier_enum as enum ('standard', 'pro', 'custom');
exception when duplicate_object then null; end $$;

do $$ begin
  create type member_role_enum as enum ('member', 'mentor', 'admin');
exception when duplicate_object then null; end $$;

-- Communities (root tenant)
create table if not exists communities (
  id             uuid primary key default uuid_generate_v4(),
  slug           text unique not null,
  name           text not null,
  tagline        text,
  accent_color   text not null default '#3b4f42',
  logo_url       text,
  custom_domain  text unique,
  tier           community_tier_enum not null default 'standard',
  created_at     timestamptz not null default now()
);

-- Community branding
create table if not exists community_branding (
  id             uuid primary key default uuid_generate_v4(),
  community_id   uuid not null references communities(id) on delete cascade,
  accent_color   text,
  dark_bg        text,
  light_bg       text,
  logo_url       text,
  font_heading   text,
  font_body      text,
  updated_at     timestamptz not null default now(),
  unique(community_id)
);

-- Programs
create table if not exists programs (
  id             uuid primary key default uuid_generate_v4(),
  community_id   uuid not null references communities(id) on delete cascade,
  name           text not null,
  subtitle       text,
  week           int not null default 1,
  total_weeks    int not null default 20,
  live           boolean not null default false,
  stage_config   jsonb not null default '{
    "pending":     {"label": "Pending",     "color": "rgba(255,255,255,0.18)"},
    "entry":       {"label": "Entry",       "color": "#3b4a3f"},
    "foundation":  {"label": "Foundation",  "color": "#2e3d52"},
    "development": {"label": "Development", "color": "#3d2e52"},
    "showcase":    {"label": "Showcase",    "color": "#52432e"},
    "graduate":    {"label": "Graduate",    "color": "#2e4a3d"}
  }'::jsonb,
  section_schema jsonb not null default '[]'::jsonb,
  created_at     timestamptz not null default now()
);

-- Cohorts
create table if not exists cohorts (
  id             uuid primary key default uuid_generate_v4(),
  program_id     uuid not null references programs(id) on delete cascade,
  name           text not null,
  created_at     timestamptz not null default now()
);

-- Members
create table if not exists members (
  id             uuid primary key default uuid_generate_v4(),
  community_id   uuid not null references communities(id) on delete cascade,
  cohort_id      uuid references cohorts(id) on delete set null,
  user_id        uuid references auth.users(id) on delete set null,
  name           text not null,
  initials       text,
  title          text,
  email          text not null,
  phone          text,
  location       text,
  availability   text,
  color          text not null default '#3b4f42',
  avatar_url     text,
  stage          stage_enum not null default 'pending',
  created_at     timestamptz not null default now(),
  unique(community_id, email)
);

-- Member profiles
create table if not exists member_profiles (
  id             uuid primary key default uuid_generate_v4(),
  member_id      uuid not null references members(id) on delete cascade,
  practice       text,
  focus          text,
  goals          text[] not null default '{}',
  influences     text[] not null default '{}',
  skills         jsonb not null default '{"Primary":[],"Tools":[],"Mediums":[]}',
  projects       jsonb not null default '[]',
  updated_at     timestamptz not null default now(),
  unique(member_id)
);

-- Artefacts (1:1 with members)
create table if not exists artefacts (
  id             uuid primary key default uuid_generate_v4(),
  member_id      uuid not null references members(id) on delete cascade,
  ws_content     text not null default '',
  updated_at     timestamptz not null default now(),
  unique(member_id)
);

-- Sections
create table if not exists sections (
  id             uuid primary key default uuid_generate_v4(),
  artefact_id    uuid not null references artefacts(id) on delete cascade,
  key            text not null,
  label          text not null,
  status         section_status_enum not null default 'empty',
  evidence       text not null default '',
  cp             int not null check (cp in (1, 2)),
  feedback       text,
  feedback_at    timestamptz,
  feedback_by    uuid references members(id) on delete set null,
  updated_at     timestamptz not null default now(),
  unique(artefact_id, key)
);

-- Stage transitions (immutable audit log)
create table if not exists stage_transitions (
  id               uuid primary key default uuid_generate_v4(),
  member_id        uuid not null references members(id) on delete cascade,
  from_stage       stage_enum,
  to_stage         stage_enum not null,
  transitioned_by  uuid references members(id) on delete set null,
  created_at       timestamptz not null default now()
);

-- Community roles
create table if not exists community_roles (
  id             uuid primary key default uuid_generate_v4(),
  community_id   uuid not null references communities(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  role           member_role_enum not null default 'member',
  created_at     timestamptz not null default now(),
  unique(community_id, user_id)
);

-- Application decisions
create table if not exists application_decisions (
  id           uuid primary key default uuid_generate_v4(),
  member_id    uuid not null references members(id) on delete cascade,
  decision     text not null check (decision in ('accepted', 'rejected', 'waitlisted')),
  decided_by   uuid references members(id) on delete set null,
  note         text,
  decided_at   timestamptz not null default now()
);

-- Indexes
create index if not exists idx_members_community     on members(community_id);
create index if not exists idx_members_cohort        on members(cohort_id);
create index if not exists idx_members_user          on members(user_id);
create index if not exists idx_members_stage         on members(stage);
create index if not exists idx_sections_artefact     on sections(artefact_id);
create index if not exists idx_sections_status       on sections(status);
create index if not exists idx_transitions_member    on stage_transitions(member_id);
create index if not exists idx_transitions_created   on stage_transitions(created_at);
create index if not exists idx_programs_community    on programs(community_id);
create index if not exists idx_community_roles_user  on community_roles(user_id);
create index if not exists idx_decisions_member      on application_decisions(member_id);

-- Views (with security_invoker to respect RLS policies)
create or replace view at_risk_members
with (security_invoker = true) as
select
  m.*,
  count(s.id) filter (where s.status = 'accepted') as accepted_count,
  max(s.updated_at)                                 as last_activity,
  (
    count(s.id) filter (where s.status = 'accepted') < 3
    and max(s.updated_at) < now() - interval '10 days'
  ) as at_risk
from members m
join artefacts a on a.member_id  = m.id
join sections  s on s.artefact_id = a.id
group by m.id;

create or replace view member_progress
with (security_invoker = true) as
select
  m.id                                                           as member_id,
  count(s.id)                                                    as total_sections,
  count(s.id) filter (where s.status = 'accepted')               as accepted_sections,
  round(
    count(s.id) filter (where s.status = 'accepted')::numeric
    / nullif(count(s.id), 0) * 100
  )                                                              as pct
from members m
join artefacts a on a.member_id  = m.id
join sections  s on s.artefact_id = a.id
group by m.id;
