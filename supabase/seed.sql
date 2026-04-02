insert into public.districts (id, name, municipality, population)
values
  ('11111111-1111-1111-1111-111111111111', 'Tromsoya', 'Tromso Kommune', 41000),
  ('22222222-2222-2222-2222-222222222222', 'Fastlandet', 'Tromso Kommune', 14000),
  ('33333333-3333-3333-3333-333333333333', 'Kvaloya', 'Tromso Kommune', 10000),
  ('44444444-4444-4444-4444-444444444444', 'Hakoya', 'Tromso Kommune', 400)
on conflict (id) do nothing;

insert into public.categories (id, name, description, color)
values
  ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'Housing', 'Housing development and public affordability policy.', '#3B82F6'),
  ('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Transportation', 'Public transport and mobility policy.', '#10B981'),
  ('aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'Environment', 'Environmental and climate policy.', '#22C55E'),
  ('aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'Education', 'Education and schools policy.', '#F59E0B'),
  ('aaaaaaa5-aaaa-aaaa-aaaa-aaaaaaaaaaa5', 'Culture', 'Culture and community life policy.', '#8B5CF6')
on conflict (id) do nothing;

insert into public.policies (
  id,
  title,
  description,
  category_id,
  status,
  scope,
  start_date,
  end_date,
  allow_anonymous
)
values
  (
    'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'Expand Public Bus Routes in Outer Districts',
    'This proposal introduces expanded evening and weekend bus routes across Fastlandet and Kvaloya to improve accessibility for students, workers, and seniors.',
    'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    'active',
    'district',
    '2026-01-20',
    '2026-03-20',
    true
  ),
  (
    'bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    'Affordable Youth Housing Development Program',
    'The municipality is considering a mixed-income housing initiative focused on citizens aged 18-35. Feedback is requested on rent ceilings and location priorities.',
    'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'active',
    'municipality',
    '2026-01-10',
    '2026-03-10',
    true
  ),
  (
    'bbbbbbb3-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
    'City Center Low-Emission Zone',
    'Introduce a phased low-emission zone in central Tromso to reduce air pollution and traffic noise. Citizens can comment on timing and implementation approach.',
    'aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    'under_review',
    'municipality',
    '2025-12-01',
    '2026-02-01',
    false
  )
on conflict (id) do nothing;

insert into public.policy_districts (policy_id, district_id)
values
  ('bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '22222222-2222-2222-2222-222222222222'),
  ('bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '33333333-3333-3333-3333-333333333333')
on conflict do nothing;

insert into public.policy_tags (policy_id, tag)
values
  ('bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'public transport'),
  ('bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'mobility'),
  ('bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'youth'),
  ('bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'affordability'),
  ('bbbbbbb3-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'emissions')
on conflict do nothing;

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
values
  (
    'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'bedre-sykkelveier',
    'Bedre Bussruter',
    'Better Bus Service',
    'Kveldsruter, helgetilbud og dekning i ytterdistriktene.',
    'Evening routes, weekend service, and coverage in outer districts.',
    'bedre-sykkelveier',
    1
  ),
  (
    'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'budsjett-kostnad',
    'Kostnad og Finansiering',
    'Cost and Funding',
    'Hva utvidelsen koster og hvordan den finansieres.',
    'What the expansion costs and how it will be funded.',
    'budsjett-kostnad',
    2
  ),
  (
    'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'anleggsperioder',
    'Gjennomforing',
    'Delivery Plan',
    'Fasevis utrulling og milepaeler for oppstart.',
    'Phased rollout and milestones for implementation.',
    'anleggsperioder',
    3
  ),
  (
    'bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    'flere-gronne-soner',
    'Bomiljo og Kvalitet',
    'Living Quality',
    'Hvordan prosjektet skaper gode bomiljoer for unge.',
    'How the project creates better living environments for young residents.',
    'flere-gronne-soner',
    1
  ),
  (
    'bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    'budsjett-kostnad',
    'Leieniva og Budsjett',
    'Rent Levels and Budget',
    'Leietak, kommunale bidrag og prioriteringer.',
    'Rent ceilings, municipal support, and tradeoffs.',
    'budsjett-kostnad',
    2
  )
on conflict (policy_id, slug) do nothing;

insert into public.policy_updates (policy_id, title, content, update_type)
values
  (
    'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'Consultation window extended',
    'The municipality extended the consultation period by two weeks to allow more residents in Fastlandet and Kvaloya to provide input.',
    'deadline'
  ),
  (
    'bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    'Location shortlist published',
    'Three candidate development areas are now being evaluated, with proximity to public transport and campuses as key criteria.',
    'info'
  ),
  (
    'bbbbbbb3-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
    'Proposal moved to review',
    'The proposal is under review after the consultation period closed. An implementation recommendation will be published next month.',
    'status_change'
  )
on conflict do nothing;

insert into public.events (
  policy_id,
  title,
  description,
  event_date,
  location,
  mode,
  registration_url
)
values
  (
    'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'Open information meeting',
    'Meet the project team and discuss route priorities with planners and transport staff.',
    '2026-02-18T18:00:00Z',
    'Tromso Library, Main Hall',
    'hybrid',
    'https://example.com/events/bus-routes'
  )
on conflict do nothing;
