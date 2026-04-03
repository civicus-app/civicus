-- Fix: rename local variable `policy_id` to `v_policy_id` in
-- admin_upsert_policy_workspace to eliminate the PL/pgSQL ambiguity error
-- (code 42702) caused by the variable name colliding with the column name
-- `policy_id` on child tables (policy_districts, policy_tags, policy_topics,
-- policy_updates, events).

create or replace function public.admin_upsert_policy_workspace(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_policy_id uuid := nullif(payload #>> '{policy,id}', '')::uuid;
  saved_policy public.policies%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Only admins may save policy workspaces';
  end if;

  if v_policy_id is null then
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
    where id = v_policy_id
    returning * into saved_policy;
  end if;

  delete from public.policy_districts where policy_districts.policy_id = saved_policy.id;
  insert into public.policy_districts (policy_id, district_id)
  select saved_policy.id, value::uuid
  from jsonb_array_elements_text(coalesce(payload -> 'district_ids', '[]'::jsonb)) value;

  delete from public.policy_tags where policy_tags.policy_id = saved_policy.id;
  insert into public.policy_tags (policy_id, tag)
  select saved_policy.id, trim(value)
  from jsonb_array_elements_text(coalesce(payload -> 'tags', '[]'::jsonb)) value
  where trim(value) <> '';

  delete from public.policy_topics where policy_topics.policy_id = saved_policy.id;
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

  delete from public.policy_updates where policy_updates.policy_id = saved_policy.id;
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

  delete from public.events where events.policy_id = saved_policy.id;
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
