# Data Migration Guide
## Artefact Platform — Seed to Supabase

You have the scaffold. The app runs on stub data from `lib/data/seed.ts`.
This guide takes you from zero database to a live multi-tenant Supabase instance
in five stages. Run each stage completely before moving to the next.

---

## Stage 0 — Prerequisites

```bash
npm install @supabase/supabase-js @supabase/ssr
```

Create a new Supabase project at supabase.com. Copy your project URL and anon key.

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The `SUPABASE_SERVICE_ROLE_KEY` is only used in migration scripts — never expose
it to the browser. Keep it server-side only.

Create two Supabase client files:

**`src/lib/supabase/server.ts`**
```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options: object) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: object) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );
}
```

**`src/lib/supabase/client.ts`**
```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**`src/lib/supabase/admin.ts`** — service role client for migration scripts only
```ts
import { createClient } from "@supabase/supabase-js";

// Never import this in components or route handlers.
// Migration scripts only.
export const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

---

## Stage 1 — Schema

Run the entire block below in the Supabase SQL editor (Database → SQL Editor → New query).
Run it once. It is idempotent — safe to rerun if something fails partway.

```sql
-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Enums ───────────────────────────────────────────────────────────────────
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

-- ─── Communities (root tenant) ───────────────────────────────────────────────
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

-- ─── Community branding (separate from identity — swappable per tier) ────────
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

-- ─── Programs ────────────────────────────────────────────────────────────────
create table if not exists programs (
  id             uuid primary key default uuid_generate_v4(),
  community_id   uuid not null references communities(id) on delete cascade,
  name           text not null,
  subtitle       text,
  week           int not null default 1,
  total_weeks    int not null default 20,
  live           boolean not null default false,
  -- Stage display names are configurable per program
  stage_config   jsonb not null default '{
    "pending":     {"label": "Pending",     "color": "rgba(255,255,255,0.18)"},
    "entry":       {"label": "Entry",       "color": "#3b4a3f"},
    "foundation":  {"label": "Foundation",  "color": "#2e3d52"},
    "development": {"label": "Development", "color": "#3d2e52"},
    "showcase":    {"label": "Showcase",    "color": "#52432e"},
    "graduate":    {"label": "Graduate",    "color": "#2e4a3d"}
  }'::jsonb,
  -- Section schema configurable per program (labels, checkpoint assignments)
  section_schema jsonb not null default '[]'::jsonb,
  created_at     timestamptz not null default now()
);

-- ─── Cohorts ─────────────────────────────────────────────────────────────────
create table if not exists cohorts (
  id             uuid primary key default uuid_generate_v4(),
  program_id     uuid not null references programs(id) on delete cascade,
  name           text not null,
  created_at     timestamptz not null default now()
);

-- ─── Members ─────────────────────────────────────────────────────────────────
create table if not exists members (
  id             uuid primary key default uuid_generate_v4(),
  community_id   uuid not null references communities(id) on delete cascade,
  cohort_id      uuid references cohorts(id) on delete set null,
  -- auth.users link — null until they log in for the first time
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

-- ─── Member profiles ─────────────────────────────────────────────────────────
create table if not exists member_profiles (
  id             uuid primary key default uuid_generate_v4(),
  member_id      uuid not null references members(id) on delete cascade,
  practice       text,
  focus          text,
  goals          text[] not null default '{}',
  influences     text[] not null default '{}',
  -- jsonb for flexibility — skills and projects change shape per community
  skills         jsonb not null default '{"Primary":[],"Tools":[],"Mediums":[]}',
  projects       jsonb not null default '[]',
  updated_at     timestamptz not null default now(),
  unique(member_id)
);

-- ─── Artefacts (1:1 with members) ────────────────────────────────────────────
create table if not exists artefacts (
  id             uuid primary key default uuid_generate_v4(),
  member_id      uuid not null references members(id) on delete cascade,
  ws_content     text not null default '',
  updated_at     timestamptz not null default now(),
  unique(member_id)
);

-- ─── Sections (rows, not JSON — queryable individually) ──────────────────────
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

-- ─── Stage transitions — immutable event log, never delete rows ──────────────
create table if not exists stage_transitions (
  id               uuid primary key default uuid_generate_v4(),
  member_id        uuid not null references members(id) on delete cascade,
  from_stage       stage_enum,
  to_stage         stage_enum not null,
  transitioned_by  uuid references members(id) on delete set null,
  created_at       timestamptz not null default now()
);

-- ─── Community role memberships ──────────────────────────────────────────────
-- Maps auth.users to their role within a community.
-- A user can be a mentor in one community and a member in another.
create table if not exists community_roles (
  id             uuid primary key default uuid_generate_v4(),
  community_id   uuid not null references communities(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  role           member_role_enum not null default 'member',
  created_at     timestamptz not null default now(),
  unique(community_id, user_id)
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
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
```

### Additional tables — application decisions and progress view

Run this block immediately after the main schema block, before enabling RLS.

```sql
-- ─── Application decisions — intake gate audit trail ─────────────────────────
create table if not exists application_decisions (
  id           uuid primary key default uuid_generate_v4(),
  member_id    uuid not null references members(id) on delete cascade,
  decision     text not null check (decision in ('accepted', 'rejected', 'waitlisted')),
  decided_by   uuid references members(id) on delete set null,
  note         text,
  decided_at   timestamptz not null default now()
);

create index if not exists idx_decisions_member on application_decisions(member_id);

-- ─── at_risk_members view — derives risk from section activity ────────────────
-- Replaces the stored `risk` boolean on members.
-- Query this view wherever AdminView previously read members.risk.
create or replace view at_risk_members as
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

-- ─── member_progress view — derives accepted/total from sections ──────────────
-- Replaces hardcoded sections:7, accepted:0 in mapMember.
create or replace view member_progress as
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
```


Verify in the Supabase Table Editor that all 10 tables appear before continuing.

---

## Stage 2 — Row Level Security

Enable RLS on every table, then define policies.
Run this block in the SQL editor immediately after Stage 1.

```sql
-- Enable RLS on all tables
alter table communities        enable row level security;
alter table community_branding enable row level security;
alter table programs           enable row level security;
alter table cohorts            enable row level security;
alter table members            enable row level security;
alter table member_profiles    enable row level security;
alter table artefacts          enable row level security;
alter table sections           enable row level security;
alter table stage_transitions  enable row level security;
alter table community_roles    enable row level security;

-- ── Helper function: get current user's role in a community ──────────────────
create or replace function current_community_role(cid uuid)
returns text language sql security definer as $$
  select role::text from community_roles
  where community_id = cid and user_id = auth.uid()
  limit 1;
$$;

-- ── Helper function: get current user's member id ────────────────────────────
create or replace function current_member_id()
returns uuid language sql security definer as $$
  select id from members where user_id = auth.uid() limit 1;
$$;

-- ── Communities: readable by authenticated users, writable by platform admin ──
create policy "communities readable by all authed"
  on communities for select to authenticated using (true);

-- ── Community branding: readable by all, writable by community admin ──────────
create policy "branding readable by all authed"
  on community_branding for select to authenticated using (true);

create policy "branding writable by community admin"
  on community_branding for all to authenticated
  using (current_community_role(community_id) = 'admin');

-- ── Programs: readable within community, writable by admin ───────────────────
create policy "programs readable within community"
  on programs for select to authenticated
  using (
    community_id in (
      select community_id from community_roles where user_id = auth.uid()
    )
  );

create policy "programs writable by admin"
  on programs for all to authenticated
  using (current_community_role(community_id) = 'admin');

-- ── Cohorts: same as programs ─────────────────────────────────────────────────
create policy "cohorts readable within community"
  on cohorts for select to authenticated
  using (
    program_id in (
      select id from programs where community_id in (
        select community_id from community_roles where user_id = auth.uid()
      )
    )
  );

-- ── Members: readable within community ───────────────────────────────────────
create policy "members readable within community"
  on members for select to authenticated
  using (
    community_id in (
      select community_id from community_roles where user_id = auth.uid()
    )
  );

-- Members can update their own record
create policy "member updates own record"
  on members for update to authenticated
  using (user_id = auth.uid());

-- Admins can update any member in their community
create policy "admin updates members in community"
  on members for update to authenticated
  using (current_community_role(community_id) = 'admin');

-- ── Member profiles: same isolation as members ────────────────────────────────
create policy "profiles readable within community"
  on member_profiles for select to authenticated
  using (
    member_id in (
      select id from members where community_id in (
        select community_id from community_roles where user_id = auth.uid()
      )
    )
  );

create policy "member updates own profile"
  on member_profiles for update to authenticated
  using (member_id = current_member_id());

-- ── Artefacts: member reads own, mentor/admin reads all in community ──────────
create policy "member reads own artefact"
  on artefacts for select to authenticated
  using (member_id = current_member_id());

create policy "mentor reads artefacts in community"
  on artefacts for select to authenticated
  using (
    member_id in (
      select id from members where community_id in (
        select community_id from community_roles
        where user_id = auth.uid() and role in ('mentor', 'admin')
      )
    )
  );

create policy "member updates own workspace"
  on artefacts for update to authenticated
  using (member_id = current_member_id());

-- ── Sections: member reads/writes own, mentor writes feedback ─────────────────
create policy "member reads own sections"
  on sections for select to authenticated
  using (
    artefact_id in (
      select id from artefacts where member_id = current_member_id()
    )
  );

create policy "mentor reads sections in community"
  on sections for select to authenticated
  using (
    artefact_id in (
      select a.id from artefacts a
      join members m on a.member_id = m.id
      where m.community_id in (
        select community_id from community_roles
        where user_id = auth.uid() and role in ('mentor', 'admin')
      )
    )
  );

create policy "member updates own sections"
  on sections for update to authenticated
  using (
    artefact_id in (
      select id from artefacts where member_id = current_member_id()
    )
  );

create policy "mentor writes feedback on sections"
  on sections for update to authenticated
  using (
    artefact_id in (
      select a.id from artefacts a
      join members m on a.member_id = m.id
      where m.community_id in (
        select community_id from community_roles
        where user_id = auth.uid() and role in ('mentor', 'admin')
      )
    )
  );

-- ── Stage transitions: append-only event log ─────────────────────────────────
create policy "transitions readable within community"
  on stage_transitions for select to authenticated
  using (
    member_id in (
      select id from members where community_id in (
        select community_id from community_roles where user_id = auth.uid()
      )
    )
  );

-- Only admins can insert transitions (advancing a member)
create policy "admin inserts transitions"
  on stage_transitions for insert to authenticated
  with check (
    member_id in (
      select m.id from members m
      where current_community_role(m.community_id) = 'admin'
    )
  );

-- No updates or deletes — event log is immutable
-- (no update/delete policies defined — they will be denied by default)

-- ── Community roles: readable by member, writable by admin ───────────────────
create policy "roles readable by self"
  on community_roles for select to authenticated
  using (user_id = auth.uid());

create policy "roles readable by admin"
  on community_roles for select to authenticated
  using (current_community_role(community_id) = 'admin');

-- ── Public link page: sections readable without auth ─────────────────────────
-- The /link/[memberId] route is public. Allow unauthenticated reads on
-- artefacts and sections for a specific member if their community is live.
create policy "public reads artefact for live community"
  on artefacts for select to anon
  using (
    member_id in (
      select m.id from members m
      join cohorts c on m.cohort_id = c.id
      join programs p on c.program_id = p.id
      where p.live = true
    )
  );

create policy "public reads sections for live community"
  on sections for select to anon
  using (
    artefact_id in (
      select a.id from artefacts a
      join members m on a.member_id = m.id
      join cohorts c on m.cohort_id = c.id
      join programs p on c.program_id = p.id
      where p.live = true
    )
  );
```

---

## Stage 3 — Seed data

This migrates the prototype constants into the database.
Create `scripts/seed.ts` in the project root and run it once.

```ts
// scripts/seed.ts
// Run with: npx tsx scripts/seed.ts
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // service role bypasses RLS
);

async function seed() {
  console.log("Seeding...");

  // ── 1. Community ──────────────────────────────────────────────────────────
  const { data: community, error: cErr } = await supabase
    .from("communities")
    .upsert({
      slug:         "creative-incubator",
      name:         "Creative Incubator",
      tagline:      "A residency for working artists.",
      accent_color: "#3b4f42",
      tier:         "standard",
    }, { onConflict: "slug" })
    .select()
    .single();

  if (cErr) throw new Error(`Community: ${cErr.message}`);
  console.log("✓ community:", community.id);

  // ── 2. Program ───────────────────────────────────────────────────────────
  const { data: program, error: pErr } = await supabase
    .from("programs")
    .upsert({
      community_id: community.id,
      name:         "Creative Incubator",
      subtitle:     "Spring Cohort 2025",
      week:         6,
      total_weeks:  20,
      live:         true,
      section_schema: [
        { key: "practice",   label: "Practice Statement",    cp: 1 },
        { key: "focus",      label: "Current Focus",          cp: 1 },
        { key: "material",   label: "Material Sourcing Plan", cp: 1 },
        { key: "influences", label: "Influences & Context",   cp: 1 },
        { key: "series",     label: "Project Series",          cp: 2 },
        { key: "exhibition", label: "Exhibition Goals",        cp: 2 },
        { key: "collab",     label: "Collaboration Outreach",  cp: 2 },
      ],
    }, { onConflict: "id" })
    .select()
    .single();

  if (pErr) throw new Error(`Program: ${pErr.message}`);
  console.log("✓ program:", program.id);

  // ── 3. Cohort ────────────────────────────────────────────────────────────
  const { data: cohort, error: coErr } = await supabase
    .from("cohorts")
    .upsert({
      program_id: program.id,
      name:       "Spring 2025",
    }, { onConflict: "id" })
    .select()
    .single();

  if (coErr) throw new Error(`Cohort: ${coErr.message}`);
  console.log("✓ cohort:", cohort.id);

  // ── 4. Members ───────────────────────────────────────────────────────────
  const memberDefs = [
    { name: "Ava Martinez",     initials: "AM", title: "Visual Artist & Spatial Designer",     email: "ava@avamartinez.studio",  phone: "+1 416 555 0192", location: "Toronto, ON",   color: "#3b4f42", stage: "foundation" },
    { name: "Marcus Chen",      initials: "MC", title: "Interdisciplinary Artist",              email: "mc@example.com",          location: "Vancouver, BC", color: "#2e3d52", stage: "development" },
    { name: "Elena Rodriguez",  initials: "ER", title: "Sculptor & Installation Artist",        email: "er@example.com",          location: "Montreal, QC",  color: "#4a3d5a", stage: "foundation" },
    { name: "James Okonkwo",    initials: "JO", title: "Performance & Media Artist",            email: "jo@example.com",          location: "Toronto, ON",   color: "#52432e", stage: "showcase" },
    { name: "Maya Patel",       initials: "MP", title: "Digital & Textile Artist",              email: "mp@example.com",          location: "Calgary, AB",   color: "#2e4a3d", stage: "graduate" },
    { name: "David Kim",        initials: "DK", title: "Photographer & Visual Artist",          email: "dk@example.com",          location: "Ottawa, ON",    color: "#2e3a52", stage: "pending" },
  ];

  const { data: members, error: mErr } = await supabase
    .from("members")
    .upsert(
      memberDefs.map(m => ({ ...m, community_id: community.id, cohort_id: cohort.id })),
      { onConflict: "community_id,email" }
    )
    .select();

  if (mErr) throw new Error(`Members: ${mErr.message}`);
  console.log(`✓ ${members.length} members`);

  const ava = members.find(m => m.email === "ava@avamartinez.studio")!;
  const marcus = members.find(m => m.email === "mc@example.com")!;
  const james = members.find(m => m.email === "jo@example.com")!;
  const maya = members.find(m => m.email === "mp@example.com")!;

  // ── 5. Ava's profile ─────────────────────────────────────────────────────
  const { error: profErr } = await supabase
    .from("member_profiles")
    .upsert({
      member_id:  ava.id,
      practice:   "I build environments that hold a feeling. Each project begins with a question: what does this space want to remember? Light as primary material — shifting perceptual ground beneath a viewer's feet.",
      focus:      "Currently developing a new body of work around bioluminescent systems and civic space.",
      goals:      ["International exhibition presence", "Bioluminescent materials research", "Urban planner collaborations"],
      influences: ["James Turrell", "Olafur Eliasson", "Ann Hamilton", "Rirkrit Tiravanija"],
      skills: {
        Primary: ["Environmental Design", "Light Sculpture", "Spatial Narrative"],
        Tools:   ["Rhino 3D", "TouchDesigner", "QLab"],
        Mediums: ["Light", "Glass", "Resin", "Sound"],
      },
      projects: [
        { name: "Threshold Studies",    works: [{ title: "Liminal I", year: "2025" }, { title: "Liminal II", year: "2025" }, { title: "Passage Membrane", year: "2024" }] },
        { name: "Memory Architectures", works: [{ title: "Residue", year: "2024" }, { title: "Palimpsest", year: "2023" }, { title: "Soft Infrastructure", year: "2023" }] },
      ],
    }, { onConflict: "member_id" });

  if (profErr) throw new Error(`Ava profile: ${profErr.message}`);
  console.log("✓ Ava profile");

  // ── 6. Artefacts ─────────────────────────────────────────────────────────
  const { data: artefacts, error: aErr } = await supabase
    .from("artefacts")
    .upsert(
      members.map(m => ({ member_id: m.id, ws_content: "" })),
      { onConflict: "member_id" }
    )
    .select();

  if (aErr) throw new Error(`Artefacts: ${aErr.message}`);
  console.log(`✓ ${artefacts.length} artefacts`);

  const avaArtefact    = artefacts.find(a => a.member_id === ava.id)!;
  const marcusArtefact = artefacts.find(a => a.member_id === marcus.id)!;
  const jamesArtefact  = artefacts.find(a => a.member_id === james.id)!;

  // ── 7. Sections ──────────────────────────────────────────────────────────
  const BASE_SECTIONS = [
    { key: "practice",   label: "Practice Statement",    cp: 1 },
    { key: "focus",      label: "Current Focus",          cp: 1 },
    { key: "material",   label: "Material Sourcing Plan", cp: 1 },
    { key: "influences", label: "Influences & Context",   cp: 1 },
    { key: "series",     label: "Project Series",          cp: 2 },
    { key: "exhibition", label: "Exhibition Goals",        cp: 2 },
    { key: "collab",     label: "Collaboration Outreach",  cp: 2 },
  ];

  // Ava — live prototype state
  const avaSections = [
    { key: "practice",   status: "accepted",    evidence: "I build environments that hold a feeling…",   feedback: "Strong opening. The light-as-material framing is distinctive. Consider adding one concrete example of a past work that embodies this.", feedback_at: new Date("2025-02-28").toISOString() },
    { key: "focus",      status: "submitted",   evidence: "Bioluminescent systems + civic space" },
    { key: "material",   status: "in_progress", evidence: "" },
    { key: "influences", status: "accepted",    evidence: "Turrell, Eliasson, Hamilton",                  feedback: "Good range. Could you add one less-obvious influence to show independent thinking?", feedback_at: new Date("2025-03-01").toISOString() },
    { key: "series",     status: "in_progress", evidence: "" },
    { key: "exhibition", status: "empty",       evidence: "" },
    { key: "collab",     status: "empty",       evidence: "" },
  ];

  // Marcus — strong, development stage (6 accepted)
  const marcusSections = [
    { key: "practice",   status: "accepted", evidence: "I work across disciplines." },
    { key: "focus",      status: "accepted", evidence: "Sound and installation." },
    { key: "material",   status: "accepted", evidence: "Reclaimed electronics." },
    { key: "influences", status: "accepted", evidence: "Harun Farocki, Nam June Paik." },
    { key: "series",     status: "accepted", evidence: "Signal/Noise series." },
    { key: "exhibition", status: "accepted", evidence: "Group show at the Polygon." },
    { key: "collab",     status: "in_progress", evidence: "" },
  ];

  // James — complete, showcase (all accepted)
  const jamesSections = BASE_SECTIONS.map(s => ({
    key: s.key, status: "accepted", evidence: `${s.label} complete.`
  }));

  const allSections = [
    ...avaSections.map(s => {
      const base = BASE_SECTIONS.find(b => b.key === s.key)!;
      return { artefact_id: avaArtefact.id, label: base.label, cp: base.cp, ...s };
    }),
    ...marcusSections.map(s => {
      const base = BASE_SECTIONS.find(b => b.key === s.key)!;
      return { artefact_id: marcusArtefact.id, label: base.label, cp: base.cp, ...s };
    }),
    ...jamesSections.map(s => {
      const base = BASE_SECTIONS.find(b => b.key === s.key)!;
      return { artefact_id: jamesArtefact.id, label: base.label, cp: base.cp, ...s };
    }),
    // Empty sections for remaining members
    ...[...artefacts.filter(a => ![avaArtefact.id, marcusArtefact.id, jamesArtefact.id].includes(a.id))]
      .flatMap(a =>
        BASE_SECTIONS.map(s => ({
          artefact_id: a.id,
          key: s.key, label: s.label, cp: s.cp,
          status: "empty", evidence: "",
        }))
      ),
  ];

  const { error: sErr } = await supabase
    .from("sections")
    .upsert(allSections, { onConflict: "artefact_id,key" });

  if (sErr) throw new Error(`Sections: ${sErr.message}`);
  console.log(`✓ ${allSections.length} sections`);

  // ── 8. Stage transition log for existing members ──────────────────────────
  const transitions = [
    { member_id: ava.id,    from_stage: "pending", to_stage: "foundation"  },
    { member_id: marcus.id, from_stage: "pending", to_stage: "development" },
    { member_id: james.id,  from_stage: "pending", to_stage: "showcase"    },
    { member_id: maya.id,   from_stage: "pending", to_stage: "graduate"    },
  ];

  const { error: tErr } = await supabase
    .from("stage_transitions")
    .insert(transitions);

  if (tErr) throw new Error(`Transitions: ${tErr.message}`);
  console.log(`✓ ${transitions.length} stage transitions`);

  console.log("\nSeed complete.");
  console.log("Community slug: creative-incubator");
  console.log("Ava's member id:", ava.id);
  console.log("Ava's artefact id:", avaArtefact.id);
}

seed().catch(console.error);
```

Run it:

```bash
npx tsx scripts/seed.ts
```

Verify in Supabase Table Editor that rows appear in every table before continuing.

---

## Stage 4 — Swap the stub functions

Replace every function body in `src/lib/data/members.ts`.
Keep the function signatures identical — the components don't change.

```ts
// src/lib/data/members.ts
import { createClient } from "@/lib/supabase/server";
import type { Member, MemberProfile } from "@/types/member";
import type { Section } from "@/types/section";

// ── Row mappers — DB column names to TypeScript shape ────────────────────────

function mapMember(row: Record<string, unknown>): Member {
  return {
    id:           row.id as string,
    name:         row.name as string,
    initials:     (row.initials as string) || initials(row.name as string),
    title:        (row.title as string) || "",
    email:        row.email as string,
    phone:        row.phone as string | undefined,
    location:     (row.location as string) || "",
    availability: row.availability as string | undefined,
    avatarUrl:    row.avatar_url as string | undefined,
    color:        (row.color as string) || "#3b4f42",
    stage:        row.stage as Member["stage"],
    // risk is derived from at_risk_members view — not stored on members table
    sections:     7,    // derived — count from sections table in production
    accepted:     0,    // derived — count accepted sections in production
    profile:      row.profile ? mapProfile(row.profile as Record<string, unknown>) : undefined,
  };
}

function mapProfile(row: Record<string, unknown>): MemberProfile {
  return {
    practice:     (row.practice as string) || "",
    focus:        (row.focus as string) || "",
    goals:        (row.goals as string[]) || [],
    influences:   (row.influences as string[]) || [],
    skills:       (row.skills as MemberProfile["skills"]) || { Primary: [], Tools: [], Mediums: [] },
    projects:     (row.projects as MemberProfile["projects"]) || [],
    availability: row.availability as string | undefined,
  };
}

function mapSection(row: Record<string, unknown>): Section {
  return {
    id:          row.key as Section["id"],
    label:       row.label as string,
    status:      row.status as Section["status"],
    evidence:    (row.evidence as string) || "",
    cp:          row.cp as 1 | 2,
    feedback:    row.feedback as string | undefined,
    feedbackAt:  row.feedback_at
      ? new Date(row.feedback_at as string).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : undefined,
    feedbackBy:  row.feedback_by as string | undefined,
  };
}

function initials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

// ── Data functions ────────────────────────────────────────────────────────────

export async function getMembers(cohortId?: string): Promise<Member[]> {
  const supabase = createClient();
  let query = supabase
    .from("members")
    .select(`*, profile:member_profiles(*)`)
    .order("created_at", { ascending: true });

  if (cohortId) query = query.eq("cohort_id", cohortId);

  const { data, error } = await query;
  if (error) { console.error("getMembers:", error); return []; }

  // Attach accepted count from sections
  return Promise.all(
    (data || []).map(async m => {
      const member = mapMember(m);
      const { count } = await supabase
        .from("sections")
        .select("id", { count: "exact", head: true })
        .eq("status", "accepted")
        .eq("artefact_id",
          supabase.from("artefacts").select("id").eq("member_id", m.id).single()
        );
      member.accepted = count || 0;
      return member;
    })
  );
}

export async function getMember(memberId: string): Promise<Member | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("members")
    .select(`*, profile:member_profiles(*)`)
    .eq("id", memberId)
    .single();

  if (error || !data) return null;
  return mapMember(data);
}

export async function getSections(memberId: string): Promise<Section[]> {
  const supabase = createClient();

  // Get artefact id for this member
  const { data: artefact } = await supabase
    .from("artefacts")
    .select("id")
    .eq("member_id", memberId)
    .single();

  if (!artefact) return [];

  const { data, error } = await supabase
    .from("sections")
    .select("*")
    .eq("artefact_id", artefact.id)
    .order("cp", { ascending: true });

  if (error || !data) return [];
  return data.map(mapSection);
}

export async function updateSection(
  memberId:   string,
  sectionKey: string,
  updates: {
    status?:      string;
    evidence?:    string;
    feedback?:    string;
    feedback_at?: string;
    feedback_by?: string;
  }
) {
  const supabase = createClient();

  const { data: artefact } = await supabase
    .from("artefacts")
    .select("id")
    .eq("member_id", memberId)
    .single();

  if (!artefact) throw new Error("Artefact not found");

  return supabase
    .from("sections")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("artefact_id", artefact.id)
    .eq("key", sectionKey);
}

export async function updateWorkspace(memberId: string, wsContent: string) {
  const supabase = createClient();
  return supabase
    .from("artefacts")
    .update({ ws_content: wsContent, updated_at: new Date().toISOString() })
    .eq("member_id", memberId);
}

export async function advanceMember(
  memberId:  string,
  toStage:   string,
  fromStage: string,
  byId:      string
) {
  const supabase = createClient();

  // Two writes: stage update + immutable event log entry
  // Not a true transaction in the DB sense — add a Postgres function
  // (see Stage 5) if you need atomic guarantees.
  const [stageResult, transitionResult] = await Promise.all([
    supabase
      .from("members")
      .update({ stage: toStage })
      .eq("id", memberId),
    supabase
      .from("stage_transitions")
      .insert({
        member_id:       memberId,
        from_stage:      fromStage,
        to_stage:        toStage,
        transitioned_by: byId,
      }),
  ]);

  if (stageResult.error) throw stageResult.error;
  if (transitionResult.error) throw transitionResult.error;
}

export async function getProgram(communitySlug: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("programs")
    .select(`*, community:communities!inner(slug)`)
    .eq("communities.slug", communitySlug)
    .eq("live", true)
    .single();
  return data;
}
```

---

## Stage 5 — Atomic stage advance (optional but recommended)

The `advanceMember` function above makes two separate writes. If the stage update
succeeds but the transition insert fails, your event log is incomplete.
Add a Postgres function to make it atomic:

```sql
-- Run in Supabase SQL editor
create or replace function advance_member_stage(
  p_member_id       uuid,
  p_to_stage        text,
  p_from_stage      text,
  p_transitioned_by uuid
) returns void language plpgsql security definer as $$
begin
  -- Update member stage
  update members set stage = p_to_stage::stage_enum where id = p_member_id;

  -- Append to immutable event log
  insert into stage_transitions (member_id, from_stage, to_stage, transitioned_by)
  values (p_member_id, p_from_stage::stage_enum, p_to_stage::stage_enum, p_transitioned_by);
end;
$$;
```

Then call it from `advanceMember`:

```ts
const { error } = await supabase.rpc("advance_member_stage", {
  p_member_id:       memberId,
  p_to_stage:        toStage,
  p_from_stage:      fromStage,
  p_transitioned_by: byId,
});
if (error) throw error;
```

---

## Stage 6 — Real-time subscriptions

With the database live, replace the `setTimeout` sync simulation with
Supabase real-time. Add this to the portal page component:

```ts
"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Section } from "@/types/section";

// Inside your portal component:
useEffect(() => {
  const supabase = createClient();

  const channel = supabase
    .channel(`artefact:${artefactId}`)
    .on(
      "postgres_changes",
      {
        event:  "UPDATE",
        schema: "public",
        table:  "sections",
        filter: `artefact_id=eq.${artefactId}`,
      },
      (payload) => {
        setSections(prev =>
          prev.map(s =>
            s.id === payload.new.key
              ? {
                  ...s,
                  status:     payload.new.status,
                  feedback:   payload.new.feedback,
                  feedbackAt: payload.new.feedback_at
                    ? new Date(payload.new.feedback_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    : undefined,
                }
              : s
          )
        );
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [artefactId]);
```

Enable real-time on the sections table in Supabase:
Database → Replication → Tables → enable `sections`.

---

## Verification checklist

Run through each of these before calling the migration done:

```
[ ] supabase.from("communities").select("*") returns 1 row
[ ] supabase.from("members").select("*") returns 6 rows
[ ] supabase.from("sections").select("*") returns 42 rows (6 members × 7 sections)
[ ] supabase.from("artefacts").select("*") returns 6 rows
[ ] supabase.from("stage_transitions").select("*") returns 4 rows
[ ] supabase.from("member_profiles").select("*") returns 1 row (Ava only)
[ ] /portfolio/[ava-member-id] renders with live data
[ ] /link/[ava-member-id] renders without auth
[ ] Updating a section in the Supabase table editor reflects in the portal
[ ] RLS: anon user can read sections for live program
[ ] RLS: anon user cannot read sections for non-live program
```

---

## What the seed does not cover

Three things to handle before going to real members:

**Auth user creation** — the seed inserts members with `user_id = null`.
When a real member signs up via magic link, link their `auth.users` record
to their `members` row:

```ts
// In your auth callback route: app/auth/callback/route.ts
const { data: { user } } = await supabase.auth.getUser();
await supabase
  .from("members")
  .update({ user_id: user.id })
  .eq("email", user.email)
  .is("user_id", null);
```

**Second community** — once you onboard a second community, run the seed
again with a different slug and accent color. Each community gets its own
rows in `communities`, `programs`, `cohorts` — all members data is isolated
by `community_id` through RLS automatically.

**Progress counts** — `Member.sections` and `Member.accepted` are currently
hardcoded in `mapMember`. The `member_progress` view created in Stage 1
derives these values. Join it in `getMembers` and `getMember`:

```ts
const { data } = await supabase
  .from("members")
  .select(`*, profile:member_profiles(*), progress:member_progress(*)`)
  .eq("id", memberId)
  .single();

// Then in mapMember:
sections: row.progress?.total_sections ?? 7,
accepted: row.progress?.accepted_sections ?? 0,
```
