-- Migration: Add mentor assignments table
-- This allows explicit mentor-to-member assignment beyond implicit feedback_by

-- Mentor assignments table
create table if not exists mentor_assignments (
  id            uuid primary key default gen_random_uuid(),
  mentor_id     uuid not null references members(id) on delete cascade,
  member_id     uuid not null references members(id) on delete cascade,
  community_id  uuid not null references communities(id) on delete cascade,
  assigned_at   timestamptz not null default now(),
  assigned_by   uuid references members(id),
  active        boolean not null default true,

  -- Each mentor-member pair is unique per community
  unique(mentor_id, member_id, community_id)
);

-- Indexes for common queries
create index if not exists idx_mentor_assignments_mentor on mentor_assignments(mentor_id) where active = true;
create index if not exists idx_mentor_assignments_member on mentor_assignments(member_id) where active = true;
create index if not exists idx_mentor_assignments_community on mentor_assignments(community_id);

-- RLS policies
alter table mentor_assignments enable row level security;

-- Admins can manage all assignments in their community
create policy "admins_manage_assignments" on mentor_assignments
  for all
  using (
    exists (
      select 1 from community_roles
      where community_roles.community_id = mentor_assignments.community_id
        and community_roles.member_id = current_member_id()
        and community_roles.role = 'admin'
    )
  );

-- Mentors can see their own assignments
create policy "mentors_view_own_assignments" on mentor_assignments
  for select
  using (mentor_id = current_member_id());

-- Members can see who their mentors are
create policy "members_view_own_mentors" on mentor_assignments
  for select
  using (member_id = current_member_id());


-- Add community_setup table for tracking admin onboarding
create table if not exists community_setup (
  community_id    uuid primary key references communities(id) on delete cascade,
  branding_done   boolean not null default false,
  sections_done   boolean not null default false,
  stages_done     boolean not null default false,
  first_invite    boolean not null default false,
  completed_at    timestamptz,
  updated_at      timestamptz not null default now()
);

-- RLS for setup table
alter table community_setup enable row level security;

create policy "admins_manage_setup" on community_setup
  for all
  using (
    exists (
      select 1 from community_roles
      where community_roles.community_id = community_setup.community_id
        and community_roles.member_id = current_member_id()
        and community_roles.role = 'admin'
    )
  );


-- Invites table for tracking sent invitations
create table if not exists invites (
  id            uuid primary key default gen_random_uuid(),
  community_id  uuid not null references communities(id) on delete cascade,
  email         text not null,
  name          text not null,
  token         text not null unique,
  sent_at       timestamptz not null default now(),
  claimed_at    timestamptz,
  expires_at    timestamptz not null default (now() + interval '7 days'),
  sent_by       uuid references members(id)
);

create index if not exists idx_invites_token on invites(token) where claimed_at is null;
create index if not exists idx_invites_community on invites(community_id);
create index if not exists idx_invites_email on invites(email, community_id);

alter table invites enable row level security;

create policy "admins_manage_invites" on invites
  for all
  using (
    exists (
      select 1 from community_roles
      where community_roles.community_id = invites.community_id
        and community_roles.member_id = current_member_id()
        and community_roles.role = 'admin'
    )
  );
