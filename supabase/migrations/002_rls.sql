-- Row Level Security Policies
-- Run after 001_schema.sql

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
alter table application_decisions enable row level security;

-- Helper functions
create or replace function current_community_role(cid uuid)
returns text language sql security definer as $$
  select role::text from community_roles
  where community_id = cid and user_id = auth.uid()
  limit 1;
$$;

create or replace function current_member_id()
returns uuid language sql security definer as $$
  select id from members where user_id = auth.uid() limit 1;
$$;

-- Communities: readable by all authenticated
create policy "communities readable by all authed"
  on communities for select to authenticated using (true);

-- Community branding: readable by all, writable by admin
create policy "branding readable by all authed"
  on community_branding for select to authenticated using (true);

create policy "branding writable by community admin"
  on community_branding for all to authenticated
  using (current_community_role(community_id) = 'admin');

-- Programs: readable within community
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

-- Cohorts: readable within community
create policy "cohorts readable within community"
  on cohorts for select to authenticated
  using (
    program_id in (
      select id from programs where community_id in (
        select community_id from community_roles where user_id = auth.uid()
      )
    )
  );

-- Members: readable within community
create policy "members readable within community"
  on members for select to authenticated
  using (
    community_id in (
      select community_id from community_roles where user_id = auth.uid()
    )
  );

create policy "member updates own record"
  on members for update to authenticated
  using (user_id = auth.uid());

-- Member profiles: same as members
create policy "profiles readable within community"
  on member_profiles for select to authenticated
  using (
    member_id in (
      select id from members where community_id in (
        select community_id from community_roles where user_id = auth.uid()
      )
    )
  );

create policy "profile owner can update"
  on member_profiles for update to authenticated
  using (member_id = current_member_id());

-- Artefacts: readable within community
create policy "artefacts readable within community"
  on artefacts for select to authenticated
  using (
    member_id in (
      select id from members where community_id in (
        select community_id from community_roles where user_id = auth.uid()
      )
    )
  );

create policy "artefact owner can update"
  on artefacts for update to authenticated
  using (member_id = current_member_id());

-- Sections: readable within community
create policy "sections readable within community"
  on sections for select to authenticated
  using (
    artefact_id in (
      select a.id from artefacts a
      join members m on m.id = a.member_id
      where m.community_id in (
        select community_id from community_roles where user_id = auth.uid()
      )
    )
  );

create policy "section owner can update"
  on sections for update to authenticated
  using (
    artefact_id in (
      select id from artefacts where member_id = current_member_id()
    )
  );

create policy "mentor can update sections"
  on sections for update to authenticated
  using (
    artefact_id in (
      select a.id from artefacts a
      join members m on m.id = a.member_id
      where current_community_role(m.community_id) in ('mentor', 'admin')
    )
  );

-- Stage transitions: readable within community, writable by mentors/admins
create policy "transitions readable within community"
  on stage_transitions for select to authenticated
  using (
    member_id in (
      select id from members where community_id in (
        select community_id from community_roles where user_id = auth.uid()
      )
    )
  );

create policy "transitions writable by mentor/admin"
  on stage_transitions for insert to authenticated
  with check (
    member_id in (
      select id from members
      where current_community_role(community_id) in ('mentor', 'admin')
    )
  );

-- Community roles: readable by self
create policy "roles readable by self"
  on community_roles for select to authenticated
  using (user_id = auth.uid());

-- Application decisions: writable by admin
create policy "decisions readable by admin"
  on application_decisions for select to authenticated
  using (
    member_id in (
      select id from members
      where current_community_role(community_id) = 'admin'
    )
  );

create policy "decisions writable by admin"
  on application_decisions for insert to authenticated
  with check (
    member_id in (
      select id from members
      where current_community_role(community_id) = 'admin'
    )
  );
