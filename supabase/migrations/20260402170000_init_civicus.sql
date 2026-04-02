create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.districts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  municipality text not null,
  geojson jsonb,
  population integer,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  icon text,
  color text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role text not null default 'citizen' check (role in ('citizen', 'admin', 'super_admin')),
  district_id uuid references public.districts(id) on delete set null,
  date_of_birth date,
  avatar_url text,
  email_notifications boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.policies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category_id uuid references public.categories(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'active', 'under_review', 'closed')),
  scope text not null default 'municipality' check (scope in ('municipality', 'district')),
  start_date date not null,
  end_date date,
  allow_anonymous boolean not null default true,
  video_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.policy_districts (
  policy_id uuid not null references public.policies(id) on delete cascade,
  district_id uuid not null references public.districts(id) on delete cascade,
  primary key (policy_id, district_id)
);

create table if not exists public.policy_tags (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references public.policies(id) on delete cascade,
  tag text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.policy_attachments (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references public.policies(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_size bigint,
  file_type text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.policy_topics (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references public.policies(id) on delete cascade,
  slug text not null,
  label_no text not null,
  label_en text not null,
  description_no text,
  description_en text,
  icon_key text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  unique (policy_id, slug)
);

create table if not exists public.policy_updates (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references public.policies(id) on delete cascade,
  title text not null,
  content text not null,
  update_type text check (update_type in ('info', 'status_change', 'decision', 'deadline')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid references public.policies(id) on delete cascade,
  title text not null,
  description text,
  event_date timestamptz not null,
  location text,
  mode text not null default 'in_person' check (mode in ('in_person', 'online', 'hybrid')),
  registration_url text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sentiment_votes (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references public.policies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  sentiment text not null check (sentiment in ('positive', 'neutral', 'negative')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (policy_id, user_id)
);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references public.policies(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  content text not null,
  is_anonymous boolean not null default false,
  sentiment text check (sentiment in ('positive', 'neutral', 'negative')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null,
  related_policy_id uuid references public.policies(id) on delete set null,
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.policy_views (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references public.policies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  viewed_at timestamptz not null default timezone('utc', now()),
  viewed_on date not null default (timezone('utc', now()))::date,
  unique (policy_id, user_id, viewed_on)
);

create table if not exists public.policy_follows (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references public.policies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (policy_id, user_id)
);

create table if not exists public.moderation_reports (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid references public.policies(id) on delete cascade,
  feedback_id uuid references public.feedback(id) on delete cascade,
  map_comment_id uuid,
  reported_by uuid references public.profiles(id) on delete set null,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open', 'reviewed', 'resolved', 'dismissed')),
  created_at timestamptz not null default timezone('utc', now()),
  resolved_at timestamptz
);

create table if not exists public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.moderation_reports(id) on delete cascade,
  action text not null,
  notes text,
  acted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.surveys (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references public.policies(id) on delete cascade,
  title text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.survey_questions (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  prompt text not null,
  question_type text not null check (question_type in ('text', 'single_choice', 'multiple_choice')),
  options jsonb,
  sort_order integer not null default 0,
  required boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  question_id uuid not null references public.survey_questions(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  response_text text,
  response_options jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.map_comments (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references public.policies(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  district_id uuid references public.districts(id) on delete set null,
  latitude double precision,
  longitude double precision,
  content text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.is_admin(target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = coalesce(target_user, auth.uid())
      and role in ('admin', 'super_admin')
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1), 'Citizen User')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.notify_policy_followers_on_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, title, message, type, related_policy_id)
  select
    follows.user_id,
    new.title,
    left(new.content, 180),
    'policy_update',
    new.policy_id
  from public.policy_follows as follows
  where follows.policy_id = new.policy_id;

  return new;
end;
$$;

drop trigger if exists policy_update_notifications on public.policy_updates;
create trigger policy_update_notifications
after insert on public.policy_updates
for each row execute function public.notify_policy_followers_on_update();

create or replace view public.engagement_analytics as
select
  policies.id as policy_id,
  policies.title,
  policies.status,
  (
    select count(distinct policy_views.user_id)
    from public.policy_views
    where policy_views.policy_id = policies.id
  ) as views_count,
  (
    select count(distinct sentiment_votes.user_id)
    from public.sentiment_votes
    where sentiment_votes.policy_id = policies.id
  ) as votes_count,
  (
    select count(distinct feedback.user_id)
    from public.feedback
    where feedback.policy_id = policies.id
      and feedback.user_id is not null
  ) as feedback_count,
  (
    select count(*)
    from (
      select user_id
      from public.sentiment_votes
      where policy_id = policies.id
      union
      select user_id
      from public.feedback
      where policy_id = policies.id
        and user_id is not null
    ) as engaged
  ) as engaged_users,
  coalesce((
    select round(avg(
      case sentiment_votes.sentiment
        when 'positive' then 5
        when 'neutral' then 3
        when 'negative' then 1
      end
    )::numeric, 1)
    from public.sentiment_votes
    where sentiment_votes.policy_id = policies.id
  ), 0) as avg_sentiment_score,
  (
    select count(*)
    from public.sentiment_votes
    where sentiment_votes.policy_id = policies.id
      and sentiment_votes.sentiment = 'positive'
  ) as positive_count,
  (
    select count(*)
    from public.sentiment_votes
    where sentiment_votes.policy_id = policies.id
      and sentiment_votes.sentiment = 'neutral'
  ) as neutral_count,
  (
    select count(*)
    from public.sentiment_votes
    where sentiment_votes.policy_id = policies.id
      and sentiment_votes.sentiment = 'negative'
  ) as negative_count
from public.policies as policies
where policies.status <> 'draft';

create or replace function public.track_policy_view(policy_uuid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  insert into public.policy_views (policy_id, user_id)
  values (policy_uuid, auth.uid())
  on conflict (policy_id, user_id, viewed_on) do nothing;
end;
$$;

create or replace function public.get_dashboard_metrics(
  time_period text default '30d',
  district_filter uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  days integer := case time_period
    when '7d' then 7
    when '90d' then 90
    else 30
  end;
  result jsonb;
begin
  with scoped_profiles as (
    select id, district_id, date_of_birth
    from public.profiles
    where district_filter is null or district_id = district_filter
  ),
  votes_window as (
    select votes.*
    from public.sentiment_votes as votes
    join scoped_profiles on scoped_profiles.id = votes.user_id
    where votes.created_at >= timezone('utc', now()) - make_interval(days => days)
  ),
  feedback_window as (
    select items.*
    from public.feedback as items
    join scoped_profiles on scoped_profiles.id = items.user_id
    where items.created_at >= timezone('utc', now()) - make_interval(days => days)
  ),
  views_window as (
    select views.*
    from public.policy_views as views
    join scoped_profiles on scoped_profiles.id = views.user_id
    where views.viewed_at >= timezone('utc', now()) - make_interval(days => days)
  ),
  participant_ids as (
    select user_id from votes_window
    union
    select user_id from feedback_window where user_id is not null
  ),
  viewed_ids as (
    select distinct user_id from views_window
  ),
  youth_count as (
    select count(*) as count
    from scoped_profiles
    where id in (select user_id from participant_ids)
      and date_of_birth is not null
      and extract(year from age(timezone('utc', now()), date_of_birth)) between 18 and 35
  ),
  top_issue as (
    select policies.title
    from votes_window
    join public.policies on policies.id = votes_window.policy_id
    group by policies.id, policies.title
    order by count(*) desc, policies.title asc
    limit 1
  )
  select jsonb_build_object(
    'active_policies', (select count(*) from public.policies where status = 'active'),
    'total_participants', (select count(*) from participant_ids),
    'engagement_rate', coalesce((
      select round(((select count(*) from participant_ids)::numeric / nullif((select count(*) from viewed_ids), 0)) * 100, 2)
    ), 0),
    'youth_participation', coalesce((
      select round(((select count from youth_count)::numeric / nullif((select count(*) from participant_ids), 0)) * 100, 2)
    ), 0),
    'avg_sentiment_score', coalesce((
      select round(avg(
        case sentiment
          when 'positive' then 5
          when 'neutral' then 3
          when 'negative' then 1
        end
      )::numeric, 1)
      from votes_window
    ), 0),
    'top_issue', coalesce((select title from top_issue), 'N/A'),
    'funnel_data', jsonb_build_object(
      'viewed', (select count(*) from viewed_ids),
      'interacted', (select count(*) from participant_ids),
      'feedback_given', (select count(distinct user_id) from feedback_window where user_id is not null),
      'votes_cast', (select count(distinct user_id) from votes_window)
    ),
    'sentiment_distribution', jsonb_build_object(
      'positive', (select count(*) from votes_window where sentiment = 'positive'),
      'neutral', (select count(*) from votes_window where sentiment = 'neutral'),
      'negative', (select count(*) from votes_window where sentiment = 'negative')
    )
  )
  into result;

  return coalesce(result, '{}'::jsonb);
end;
$$;

create trigger districts_set_updated_at
before update on public.districts
for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger policies_set_updated_at
before update on public.policies
for each row execute function public.set_updated_at();

create trigger feedback_set_updated_at
before update on public.feedback
for each row execute function public.set_updated_at();

create trigger sentiment_votes_set_updated_at
before update on public.sentiment_votes
for each row execute function public.set_updated_at();

alter table public.districts enable row level security;
alter table public.categories enable row level security;
alter table public.profiles enable row level security;
alter table public.policies enable row level security;
alter table public.policy_districts enable row level security;
alter table public.policy_tags enable row level security;
alter table public.policy_attachments enable row level security;
alter table public.policy_topics enable row level security;
alter table public.policy_updates enable row level security;
alter table public.events enable row level security;
alter table public.sentiment_votes enable row level security;
alter table public.feedback enable row level security;
alter table public.notifications enable row level security;
alter table public.policy_views enable row level security;
alter table public.policy_follows enable row level security;
alter table public.moderation_reports enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.surveys enable row level security;
alter table public.survey_questions enable row level security;
alter table public.survey_responses enable row level security;
alter table public.map_comments enable row level security;

create policy "districts are readable by everyone" on public.districts
for select using (true);
create policy "categories are readable by everyone" on public.categories
for select using (true);
create policy "policies are readable by everyone" on public.policies
for select using (true);
create policy "policy districts are readable by everyone" on public.policy_districts
for select using (true);
create policy "policy tags are readable by everyone" on public.policy_tags
for select using (true);
create policy "policy attachments are readable by everyone" on public.policy_attachments
for select using (true);
create policy "policy topics are readable by everyone" on public.policy_topics
for select using (true);
create policy "policy updates are readable by everyone" on public.policy_updates
for select using (true);
create policy "events are readable by everyone" on public.events
for select using (true);
create policy "feedback is readable by everyone" on public.feedback
for select using (true);
create policy "sentiment votes are readable by everyone" on public.sentiment_votes
for select using (true);
create policy "surveys are readable by everyone" on public.surveys
for select using (true);
create policy "survey questions are readable by everyone" on public.survey_questions
for select using (true);
create policy "map comments are readable by everyone" on public.map_comments
for select using (true);

create policy "profiles are readable by self or admins" on public.profiles
for select using (auth.uid() = id or public.is_admin());
create policy "profiles are updatable by self or admins" on public.profiles
for update using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

create policy "admins manage policies" on public.policies
for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage policy relations" on public.policy_districts
for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage policy tags" on public.policy_tags
for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage attachments" on public.policy_attachments
for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage policy topics" on public.policy_topics
for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage policy updates" on public.policy_updates
for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage events" on public.events
for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage moderation reports" on public.moderation_reports
for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage moderation actions" on public.moderation_actions
for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage surveys" on public.surveys
for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage survey questions" on public.survey_questions
for all using (public.is_admin()) with check (public.is_admin());

create policy "users create their own feedback" on public.feedback
for insert with check (auth.uid() = user_id);
create policy "users update their own feedback" on public.feedback
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users delete their own feedback" on public.feedback
for delete using (auth.uid() = user_id or public.is_admin());

create policy "users create their own votes" on public.sentiment_votes
for insert with check (auth.uid() = user_id);
create policy "users update their own votes" on public.sentiment_votes
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users delete their own votes" on public.sentiment_votes
for delete using (auth.uid() = user_id or public.is_admin());

create policy "users read their own notifications" on public.notifications
for select using (auth.uid() = user_id or public.is_admin());
create policy "users update their own notifications" on public.notifications
for update using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

create policy "users read their own policy views" on public.policy_views
for select using (auth.uid() = user_id or public.is_admin());
create policy "users can insert their own policy views" on public.policy_views
for insert with check (auth.uid() = user_id);

create policy "users read their own follows" on public.policy_follows
for select using (auth.uid() = user_id or public.is_admin());
create policy "users manage their own follows" on public.policy_follows
for all using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

create policy "users create survey responses" on public.survey_responses
for insert with check (auth.uid() = user_id or user_id is null);
create policy "users read their own survey responses" on public.survey_responses
for select using (auth.uid() = user_id or public.is_admin());

create policy "users create map comments" on public.map_comments
for insert with check (auth.uid() = user_id or user_id is null);
create policy "users update their own map comments" on public.map_comments
for update using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());
create policy "users delete their own map comments" on public.map_comments
for delete using (auth.uid() = user_id or public.is_admin());
