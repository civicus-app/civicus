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
    'active_policies', (
      select count(*)
      from public.policies
      where status = 'active'
        and coalesce(is_published, false) = true
    ),
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
      'votes_cast', (select count(*) from votes_window)
    ),
    'sentiment_distribution', jsonb_build_object(
      'positive', (select count(*) from votes_window where sentiment = 'positive'),
      'neutral', (select count(*) from votes_window where sentiment = 'neutral'),
      'negative', (select count(*) from votes_window where sentiment = 'negative')
    )
  ) into result;

  return result;
end;
$$;
