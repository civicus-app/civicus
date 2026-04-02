create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_email text := coalesce(new.email, '');
  resolved_full_name text := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    split_part(resolved_email, '@', 1),
    'Citizen User'
  );
  resolved_role text := case
    when lower(resolved_email) = 'admin@civicus.example.com' then 'admin'
    else 'citizen'
  end;
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    resolved_email,
    resolved_full_name,
    resolved_role
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name,
    role = case
      when lower(excluded.email) = 'admin@civicus.example.com' then 'admin'
      else public.profiles.role
    end;

  return new;
end;
$$;

update public.profiles
set
  role = 'admin',
  full_name = coalesce(nullif(full_name, ''), 'Civicus Admin')
where lower(email) = 'admin@civicus.example.com';

update public.profiles
set full_name = coalesce(nullif(full_name, ''), 'Civicus Citizen')
where lower(email) = 'citizen@civicus.example.com';
