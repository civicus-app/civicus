create table if not exists public.admin_invites (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  email text,
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by uuid references public.profiles(id) on delete set null,
  revoked_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.auth_email_challenges (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  user_id uuid references public.profiles(id) on delete cascade,
  purpose text not null check (purpose in ('signup', 'login')),
  account_mode text not null check (account_mode in ('citizen', 'admin')),
  invite_id uuid references public.admin_invites(id) on delete set null,
  code_hash text not null,
  verification_token_hash text,
  status text not null default 'pending' check (status in ('pending', 'verified', 'completed', 'expired', 'cancelled')),
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  expires_at timestamptz not null,
  resend_available_at timestamptz not null,
  verified_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.trusted_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.verified_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_id text not null unique,
  role text not null check (role in ('citizen', 'admin', 'super_admin')),
  source text not null check (source in ('otp', 'trusted_device')),
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists auth_email_challenges_email_purpose_idx
on public.auth_email_challenges (email, purpose, status, created_at desc);

create index if not exists auth_email_challenges_user_purpose_idx
on public.auth_email_challenges (user_id, purpose, status, created_at desc);

create index if not exists trusted_devices_user_id_idx
on public.trusted_devices (user_id, expires_at desc);

create index if not exists verified_sessions_user_session_idx
on public.verified_sessions (user_id, session_id, expires_at desc);

create or replace function public.current_auth_session_id()
returns text
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'session_id', '')
$$;

create or replace function public.is_current_session_verified()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.verified_sessions
    where user_id = auth.uid()
      and session_id = public.current_auth_session_id()
      and expires_at > timezone('utc', now())
  )
$$;

create or replace function public.is_admin_invite_valid(input_code text, input_email text default null)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1
    from public.admin_invites
    where code_hash = encode(extensions.digest(trim(input_code), 'sha256'), 'hex')
      and revoked_at is null
      and used_at is null
      and expires_at > timezone('utc', now())
      and (email is null or lower(email) = lower(coalesce(input_email, '')))
  )
$$;

create trigger admin_invites_set_updated_at
before update on public.admin_invites
for each row execute function public.set_updated_at();

create trigger auth_email_challenges_set_updated_at
before update on public.auth_email_challenges
for each row execute function public.set_updated_at();

create trigger trusted_devices_set_updated_at
before update on public.trusted_devices
for each row execute function public.set_updated_at();

create trigger verified_sessions_set_updated_at
before update on public.verified_sessions
for each row execute function public.set_updated_at();

alter table public.admin_invites enable row level security;
alter table public.auth_email_challenges enable row level security;
alter table public.trusted_devices enable row level security;
alter table public.verified_sessions enable row level security;

create policy "admins manage admin invites" on public.admin_invites
for all using (public.is_admin()) with check (public.is_admin());

create policy "verified session required for admin invite access" on public.admin_invites
as restrictive
for all
to authenticated
using (public.is_current_session_verified())
with check (public.is_current_session_verified());

create policy "verified session required for profile reads except self" on public.profiles
as restrictive
for select
to authenticated
using (auth.uid() = id or public.is_current_session_verified());

create policy "verified session required for profile updates" on public.profiles
as restrictive
for update
to authenticated
using (public.is_current_session_verified())
with check (public.is_current_session_verified());

create policy "verified session required for feedback writes" on public.feedback
as restrictive
for insert
to authenticated
with check (public.is_current_session_verified());

create policy "verified session required for feedback updates" on public.feedback
as restrictive
for update
to authenticated
using (public.is_current_session_verified())
with check (public.is_current_session_verified());

create policy "verified session required for feedback deletes" on public.feedback
as restrictive
for delete
to authenticated
using (public.is_current_session_verified());

create policy "verified session required for vote writes" on public.sentiment_votes
as restrictive
for insert
to authenticated
with check (public.is_current_session_verified());

create policy "verified session required for vote updates" on public.sentiment_votes
as restrictive
for update
to authenticated
using (public.is_current_session_verified())
with check (public.is_current_session_verified());

create policy "verified session required for vote deletes" on public.sentiment_votes
as restrictive
for delete
to authenticated
using (public.is_current_session_verified());

create policy "verified session required for notification reads" on public.notifications
as restrictive
for select
to authenticated
using (public.is_current_session_verified());

create policy "verified session required for notification updates" on public.notifications
as restrictive
for update
to authenticated
using (public.is_current_session_verified())
with check (public.is_current_session_verified());

create policy "verified session required for policy view access" on public.policy_views
as restrictive
for all
to authenticated
using (public.is_current_session_verified())
with check (public.is_current_session_verified());

create policy "verified session required for policy follows" on public.policy_follows
as restrictive
for all
to authenticated
using (public.is_current_session_verified())
with check (public.is_current_session_verified());

create policy "verified session required for survey responses" on public.survey_responses
as restrictive
for all
to authenticated
using (public.is_current_session_verified())
with check (public.is_current_session_verified());

create policy "verified session required for map comment writes" on public.map_comments
as restrictive
for insert
to authenticated
with check (public.is_current_session_verified());

create policy "verified session required for map comment updates" on public.map_comments
as restrictive
for update
to authenticated
using (public.is_current_session_verified())
with check (public.is_current_session_verified());

create policy "verified session required for map comment deletes" on public.map_comments
as restrictive
for delete
to authenticated
using (public.is_current_session_verified());

create policy "verified session required for admin policy writes" on public.policies
as restrictive
for all
to authenticated
using (public.is_current_session_verified())
with check (public.is_current_session_verified());

create policy "verified session required for admin policy district writes" on public.policy_districts
as restrictive
for all
to authenticated
using (public.is_current_session_verified())
with check (public.is_current_session_verified());

create policy "verified session required for admin policy tag writes" on public.policy_tags
as restrictive
for all
to authenticated
using (public.is_current_session_verified())
with check (public.is_current_session_verified());

create policy "verified session required for admin attachment writes" on public.policy_attachments
as restrictive
for all
to authenticated
using (public.is_current_session_verified())
with check (public.is_current_session_verified());

create policy "verified session required for admin policy topic writes" on public.policy_topics
as restrictive
for all
to authenticated
using (public.is_current_session_verified())
with check (public.is_current_session_verified());

create policy "verified session required for admin policy update writes" on public.policy_updates
as restrictive
for all
to authenticated
using (public.is_current_session_verified())
with check (public.is_current_session_verified());

create policy "verified session required for admin event writes" on public.events
as restrictive
for all
to authenticated
using (public.is_current_session_verified())
with check (public.is_current_session_verified());

create policy "verified session required for admin moderation report writes" on public.moderation_reports
as restrictive
for all
to authenticated
using (public.is_current_session_verified())
with check (public.is_current_session_verified());

create policy "verified session required for admin moderation action writes" on public.moderation_actions
as restrictive
for all
to authenticated
using (public.is_current_session_verified())
with check (public.is_current_session_verified());

create policy "verified session required for admin survey writes" on public.surveys
as restrictive
for all
to authenticated
using (public.is_current_session_verified())
with check (public.is_current_session_verified());

create policy "verified session required for admin survey question writes" on public.survey_questions
as restrictive
for all
to authenticated
using (public.is_current_session_verified())
with check (public.is_current_session_verified());
