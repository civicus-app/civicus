alter table public.categories
  add column if not exists label_no text,
  add column if not exists label_en text;

update public.categories
set
  label_no = coalesce(label_no, name),
  label_en = coalesce(label_en, name);

alter table public.policies
  add column if not exists title_no text,
  add column if not exists title_en text,
  add column if not exists description_no text,
  add column if not exists description_en text,
  add column if not exists is_published boolean not null default false,
  add column if not exists published_at timestamptz;

update public.policies
set
  title_no = coalesce(title_no, title),
  title_en = coalesce(title_en, title),
  description_no = coalesce(description_no, description),
  description_en = coalesce(description_en, description),
  is_published = coalesce(is_published, status <> 'draft'),
  published_at = coalesce(published_at, case when status <> 'draft' then timezone('utc', now()) else null end);

create table if not exists public.app_settings (
  id text primary key default 'app-settings',
  municipality_name text not null,
  contact_email text,
  contact_phone text,
  website text,
  ai_sentiment_enabled boolean not null default true,
  ai_trend_detection_enabled boolean not null default true,
  ai_summaries_enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.app_settings (
  id,
  municipality_name,
  contact_email,
  contact_phone,
  website
)
values (
  'app-settings',
  'Tromso Kommune',
  'contact@tromso.kommune.no',
  '+47 77 79 00 00',
  'https://tromso.kommune.no'
)
on conflict (id) do nothing;

create trigger app_settings_set_updated_at
before update on public.app_settings
for each row execute function public.set_updated_at();

alter table public.app_settings enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'app_settings'
      and policyname = 'app settings readable by authenticated users'
  ) then
    create policy "app settings readable by authenticated users" on public.app_settings
    for select using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'app_settings'
      and policyname = 'admins manage app settings'
  ) then
    create policy "admins manage app settings" on public.app_settings
    for all using (public.is_admin()) with check (public.is_admin());
  end if;
end $$;

create or replace function public.get_policy_analytics(
  time_period text default '30d'
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
  with votes_window as (
    select *
    from public.sentiment_votes
    where created_at >= timezone('utc', now()) - make_interval(days => days)
  ),
  feedback_window as (
    select *
    from public.feedback
    where created_at >= timezone('utc', now()) - make_interval(days => days)
  ),
  views_window as (
    select *
    from public.policy_views
    where viewed_at >= timezone('utc', now()) - make_interval(days => days)
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'policy_id', policies.id,
    'title', coalesce(policies.title_en, policies.title_no, policies.title),
    'status', policies.status,
    'is_published', policies.is_published,
    'views_count', (
      select count(distinct views_window.user_id)
      from views_window
      where views_window.policy_id = policies.id
    ),
    'votes_count', (
      select count(distinct votes_window.user_id)
      from votes_window
      where votes_window.policy_id = policies.id
    ),
    'feedback_count', (
      select count(distinct feedback_window.user_id)
      from feedback_window
      where feedback_window.policy_id = policies.id
        and feedback_window.user_id is not null
    ),
    'engaged_users', (
      select count(*)
      from (
        select user_id from votes_window where policy_id = policies.id
        union
        select user_id from feedback_window where policy_id = policies.id and user_id is not null
      ) engaged
    ),
    'avg_sentiment_score', coalesce((
      select round(avg(
        case sentiment
          when 'positive' then 5
          when 'neutral' then 3
          when 'negative' then 1
        end
      )::numeric, 1)
      from votes_window
      where policy_id = policies.id
    ), 0),
    'positive_count', (select count(*) from votes_window where policy_id = policies.id and sentiment = 'positive'),
    'neutral_count', (select count(*) from votes_window where policy_id = policies.id and sentiment = 'neutral'),
    'negative_count', (select count(*) from votes_window where policy_id = policies.id and sentiment = 'negative')
  ) order by policies.updated_at desc), '[]'::jsonb)
  into result
  from public.policies
  where policies.status <> 'draft';

  return result;
end;
$$;

create or replace function public.get_district_participation_metrics(
  time_period text default '30d',
  policy_id uuid default null
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
  with profiles_with_district as (
    select id, district_id
    from public.profiles
    where district_id is not null
  ),
  views_window as (
    select *
    from public.policy_views
    where viewed_at >= timezone('utc', now()) - make_interval(days => days)
      and (get_district_participation_metrics.policy_id is null or public.policy_views.policy_id = get_district_participation_metrics.policy_id)
  ),
  votes_window as (
    select *
    from public.sentiment_votes
    where created_at >= timezone('utc', now()) - make_interval(days => days)
      and (get_district_participation_metrics.policy_id is null or public.sentiment_votes.policy_id = get_district_participation_metrics.policy_id)
  ),
  feedback_window as (
    select *
    from public.feedback
    where created_at >= timezone('utc', now()) - make_interval(days => days)
      and (get_district_participation_metrics.policy_id is null or public.feedback.policy_id = get_district_participation_metrics.policy_id)
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'district_id', districts.id,
    'district_name', districts.name,
    'geojson', districts.geojson,
    'participants', (
      coalesce((
        select count(*)
        from views_window
        join profiles_with_district on profiles_with_district.id = views_window.user_id
        where profiles_with_district.district_id = districts.id
      ), 0) +
      coalesce((
        select count(*)
        from votes_window
        join profiles_with_district on profiles_with_district.id = votes_window.user_id
        where profiles_with_district.district_id = districts.id
      ), 0) +
      coalesce((
        select count(*)
        from feedback_window
        join profiles_with_district on profiles_with_district.id = feedback_window.user_id
        where profiles_with_district.district_id = districts.id
      ), 0)
    ),
    'views', (
      select count(*)
      from views_window
      join profiles_with_district on profiles_with_district.id = views_window.user_id
      where profiles_with_district.district_id = districts.id
    ),
    'votes', (
      select count(*)
      from votes_window
      join profiles_with_district on profiles_with_district.id = votes_window.user_id
      where profiles_with_district.district_id = districts.id
    ),
    'feedback', (
      select count(*)
      from feedback_window
      join profiles_with_district on profiles_with_district.id = feedback_window.user_id
      where profiles_with_district.district_id = districts.id
    )
  ) order by districts.name asc), '[]'::jsonb)
  into result
  from public.districts;

  return result;
end;
$$;

create or replace function public.admin_upsert_policy_workspace(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  policy_id uuid := nullif(payload #>> '{policy,id}', '')::uuid;
  saved_policy public.policies%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Only admins may save policy workspaces';
  end if;

  if policy_id is null then
    insert into public.policies (
      title,
      description,
      title_no,
      title_en,
      description_no,
      description_en,
      category_id,
      status,
      scope,
      start_date,
      end_date,
      allow_anonymous,
      video_url,
      is_published,
      published_at,
      created_by
    )
    values (
      coalesce(payload #>> '{policy,title_no}', payload #>> '{policy,title}', ''),
      coalesce(payload #>> '{policy,description_no}', payload #>> '{policy,description}', ''),
      coalesce(payload #>> '{policy,title_no}', payload #>> '{policy,title}', ''),
      nullif(payload #>> '{policy,title_en}', ''),
      coalesce(payload #>> '{policy,description_no}', payload #>> '{policy,description}', ''),
      nullif(payload #>> '{policy,description_en}', ''),
      nullif(payload #>> '{policy,category_id}', '')::uuid,
      coalesce(payload #>> '{policy,status}', 'draft'),
      coalesce(payload #>> '{policy,scope}', 'municipality'),
      coalesce(payload #>> '{policy,start_date}', timezone('utc', now())::date::text)::date,
      nullif(payload #>> '{policy,end_date}', '')::date,
      coalesce((payload #>> '{policy,allow_anonymous}')::boolean, true),
      nullif(payload #>> '{policy,video_url}', ''),
      coalesce((payload #>> '{policy,is_published}')::boolean, false),
      case
        when coalesce((payload #>> '{policy,is_published}')::boolean, false)
          then coalesce(nullif(payload #>> '{policy,published_at}', '')::timestamptz, timezone('utc', now()))
        else null
      end,
      auth.uid()
    )
    returning * into saved_policy;
  else
    update public.policies
    set
      title = coalesce(payload #>> '{policy,title_no}', payload #>> '{policy,title}', title),
      description = coalesce(payload #>> '{policy,description_no}', payload #>> '{policy,description}', description),
      title_no = coalesce(payload #>> '{policy,title_no}', payload #>> '{policy,title}', title_no),
      title_en = nullif(payload #>> '{policy,title_en}', ''),
      description_no = coalesce(payload #>> '{policy,description_no}', payload #>> '{policy,description}', description_no),
      description_en = nullif(payload #>> '{policy,description_en}', ''),
      category_id = nullif(payload #>> '{policy,category_id}', '')::uuid,
      status = coalesce(payload #>> '{policy,status}', status),
      scope = coalesce(payload #>> '{policy,scope}', scope),
      start_date = coalesce(nullif(payload #>> '{policy,start_date}', '')::date, start_date),
      end_date = nullif(payload #>> '{policy,end_date}', '')::date,
      allow_anonymous = coalesce((payload #>> '{policy,allow_anonymous}')::boolean, allow_anonymous),
      video_url = nullif(payload #>> '{policy,video_url}', ''),
      is_published = coalesce((payload #>> '{policy,is_published}')::boolean, is_published),
      published_at = case
        when coalesce((payload #>> '{policy,is_published}')::boolean, false)
          then coalesce(published_at, timezone('utc', now()))
        else null
      end,
      updated_at = timezone('utc', now())
    where id = policy_id
    returning * into saved_policy;
  end if;

  delete from public.policy_districts where policy_id = saved_policy.id;
  insert into public.policy_districts (policy_id, district_id)
  select saved_policy.id, value::uuid
  from jsonb_array_elements_text(coalesce(payload -> 'district_ids', '[]'::jsonb)) value;

  delete from public.policy_tags where policy_id = saved_policy.id;
  insert into public.policy_tags (policy_id, tag)
  select saved_policy.id, trim(value)
  from jsonb_array_elements_text(coalesce(payload -> 'tags', '[]'::jsonb)) value
  where trim(value) <> '';

  delete from public.policy_topics where policy_id = saved_policy.id;
  insert into public.policy_topics (
    policy_id,
    slug,
    label_no,
    label_en,
    description_no,
    description_en,
    icon_key,
    sort_order
  )
  select
    saved_policy.id,
    topic ->> 'slug',
    coalesce(topic ->> 'label_no', ''),
    coalesce(topic ->> 'label_en', ''),
    nullif(topic ->> 'description_no', ''),
    nullif(topic ->> 'description_en', ''),
    nullif(topic ->> 'icon_key', ''),
    coalesce((topic ->> 'sort_order')::integer, row_number() over ())
  from jsonb_array_elements(coalesce(payload -> 'topics', '[]'::jsonb)) topic;

  delete from public.policy_updates where policy_id = saved_policy.id;
  insert into public.policy_updates (
    policy_id,
    title,
    content,
    update_type,
    created_by
  )
  select
    saved_policy.id,
    update_item ->> 'title',
    update_item ->> 'content',
    coalesce(nullif(update_item ->> 'update_type', ''), 'info'),
    auth.uid()
  from jsonb_array_elements(coalesce(payload -> 'updates', '[]'::jsonb)) update_item;

  delete from public.events where policy_id = saved_policy.id;
  insert into public.events (
    policy_id,
    title,
    description,
    event_date,
    location,
    mode,
    registration_url
  )
  select
    saved_policy.id,
    event_item ->> 'title',
    nullif(event_item ->> 'description', ''),
    (event_item ->> 'event_date')::timestamptz,
    nullif(event_item ->> 'location', ''),
    coalesce(nullif(event_item ->> 'mode', ''), 'in_person'),
    nullif(event_item ->> 'registration_url', '')
  from jsonb_array_elements(coalesce(payload -> 'events', '[]'::jsonb)) event_item;

  return jsonb_build_object('policy_id', saved_policy.id);
end;
$$;

create or replace function public.admin_delete_policy_workspace(policy_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins may delete policy workspaces';
  end if;

  delete from public.policies where id = policy_id;
  return jsonb_build_object('deleted', true);
end;
$$;

insert into storage.buckets (id, name, public)
values ('policy-attachments', 'policy-attachments', true)
on conflict (id) do update
set public = excluded.public;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'public can read policy attachments'
  ) then
    create policy "public can read policy attachments" on storage.objects
    for select using (bucket_id = 'policy-attachments');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'admins manage policy attachments'
  ) then
    create policy "admins manage policy attachments" on storage.objects
    for all using (
      bucket_id = 'policy-attachments' and public.is_admin()
    ) with check (
      bucket_id = 'policy-attachments' and public.is_admin()
    );
  end if;
end $$;
