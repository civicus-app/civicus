import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

const rootDir = process.cwd();

const readEnvFile = (fileName) => {
  const filePath = path.resolve(rootDir, fileName);
  if (!fs.existsSync(filePath)) return {};

  return Object.fromEntries(
    fs
      .readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .filter(Boolean)
      .filter((line) => !line.trim().startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=');
        return [line.slice(0, separator), line.slice(separator + 1)];
      }),
  );
};

export const env = {
  ...readEnvFile('.env'),
  ...readEnvFile('.env.local'),
  ...process.env,
};

export const supabaseUrl = env.VITE_SUPABASE_URL;
export const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.');
}

export const projectRef = new URL(supabaseUrl).hostname.split('.')[0];

export const DEMO_ACCOUNTS = [
  {
    email: 'admin@civicus.example.com',
    password: 'admin12345',
    fullName: 'Civicus Admin',
    expectedRole: 'admin',
    districtId: '11111111-1111-1111-1111-111111111111',
    dateOfBirth: '1988-01-15',
  },
  {
    email: 'citizen1@civicus.example.com',
    password: 'citizen12345',
    fullName: 'Civicus Citizen One',
    expectedRole: 'citizen',
    districtId: '22222222-2222-2222-2222-222222222222',
    dateOfBirth: '1999-04-18',
  },
  {
    email: 'citizen2@civicus.example.com',
    password: 'citizen12345',
    fullName: 'Civicus Citizen Two',
    expectedRole: 'citizen',
    districtId: '33333333-3333-3333-3333-333333333333',
    dateOfBirth: '2002-09-07',
  },
  {
    email: 'citizen3@civicus.example.com',
    password: 'citizen12345',
    fullName: 'Civicus Citizen Three',
    expectedRole: 'citizen',
    districtId: '11111111-1111-1111-1111-111111111111',
    dateOfBirth: '1978-11-26',
  },
];

const makeEventDate = (daysFromNow) => new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000).toISOString();

export const DEMO_POLICY_FIXTURES = [
  {
    key: 'demo-bus-expansion',
    title_no: 'DEMO: Utvidelse av bussruter i ytterdistriktene',
    title_en: 'DEMO: Expanded Bus Service in Outer Districts',
    description_no:
      'En demonstrasjonssak for kollektivutvidelse i Fastlandet og Kvaloya med fokus pa kveldsavganger, helgetilbud og bedre forbindelser for unge og eldre.',
    description_en:
      'A demo policy for improved public transport in Fastlandet and Kvaloya, focused on evening departures, weekend service, and better access for youth and seniors.',
    categoryName: 'Transportation',
    status: 'active',
    isPublished: true,
    scope: 'district',
    districtNames: ['Fastlandet', 'Kvaloya'],
    allowAnonymous: true,
    tags: ['demo-fixture', 'mobility', 'district'],
    topics: [
      {
        slug: 'service-level',
        label_no: 'Rutetilbud',
        label_en: 'Service levels',
        description_no: 'Hvor ofte bussene skal ga og hvor lenge pa kvelden tilbudet skal vare.',
        description_en: 'How often buses should run and how late service should continue in the evening.',
        icon_key: 'bus',
      },
      {
        slug: 'funding',
        label_no: 'Finansiering',
        label_en: 'Funding',
        description_no: 'Hvordan kommunen skal prioritere midler til utvidelsen.',
        description_en: 'How the municipality should prioritize funding for the expansion.',
        icon_key: 'wallet',
      },
    ],
    updates: [
      {
        title: 'Open consultation launched',
        content: 'Residents are invited to comment on route priorities and evening frequency.',
        update_type: 'info',
      },
    ],
    events: [
      {
        title: 'Mobility information meeting',
        description: 'Meet the transport planners and discuss local route needs.',
        event_date: makeEventDate(7),
        location: 'Tromso Library',
        mode: 'hybrid',
        registration_url: 'https://example.com/demo-bus-expansion',
      },
    ],
    attachments: [
      {
        fileName: 'demo-bus-expansion-brief.txt',
        fileType: 'text/plain',
        content:
          'Demo attachment for expanded outer-district bus service. This file validates published attachment access in citizen and admin views.',
      },
    ],
  },
  {
    key: 'demo-housing-pilot',
    title_no: 'DEMO: Pilot for rimelige ungdomsboliger',
    title_en: 'DEMO: Affordable Youth Housing Pilot',
    description_no:
      'En demonstrasjonssak for kommunal boligpolitikk med fokus pa leietak, bokvalitet og lokasjonsprioritering for unge voksne.',
    description_en:
      'A demo policy for municipal housing with a focus on rent caps, living quality, and location priorities for young adults.',
    categoryName: 'Housing',
    status: 'active',
    isPublished: true,
    scope: 'municipality',
    districtNames: [],
    allowAnonymous: true,
    tags: ['demo-fixture', 'housing', 'youth'],
    topics: [
      {
        slug: 'rent-cap',
        label_no: 'Leietak',
        label_en: 'Rent cap',
        description_no: 'Hva et rimelig maksimumsniva for husleie burde vere.',
        description_en: 'What a reasonable maximum rent level should be.',
        icon_key: 'home',
      },
      {
        slug: 'site-priority',
        label_no: 'Lokasjon',
        label_en: 'Site priority',
        description_no: 'Hvilke omrader som bor prioriteres for utvikling.',
        description_en: 'Which areas should be prioritized for development.',
        icon_key: 'map-pin',
      },
    ],
    updates: [
      {
        title: 'Initial concept published',
        content: 'The pilot outline is now available for public review and comment.',
        update_type: 'info',
      },
    ],
    events: [
      {
        title: 'Youth housing workshop',
        description: 'A digital workshop for students and first-time renters.',
        event_date: makeEventDate(10),
        location: 'Digital session',
        mode: 'online',
        registration_url: 'https://example.com/demo-housing-pilot',
      },
    ],
    attachments: [
      {
        fileName: 'demo-housing-pilot-summary.txt',
        fileType: 'text/plain',
        content:
          'Demo attachment for the affordable youth housing pilot. Used for attachment visibility and access checks.',
      },
    ],
  },
  {
    key: 'demo-emissions-review',
    title_no: 'DEMO: Lavutslippssone under vurdering',
    title_en: 'DEMO: Low-Emission Zone Under Review',
    description_no:
      'En demonstrasjonssak som viser en publisert prosess i vurderingsfasen, med statusoppdateringer og videre beslutningsarbeid.',
    description_en:
      'A demo policy that represents a published process in review, including official updates and next-step decision work.',
    categoryName: 'Environment',
    status: 'under_review',
    isPublished: true,
    scope: 'municipality',
    districtNames: [],
    allowAnonymous: false,
    tags: ['demo-fixture', 'environment', 'review'],
    topics: [
      {
        slug: 'timing',
        label_no: 'Tidsplan',
        label_en: 'Timing',
        description_no: 'Nar ulike faser eventuelt skal innfores.',
        description_en: 'When different implementation phases should begin.',
        icon_key: 'clock',
      },
      {
        slug: 'exceptions',
        label_no: 'Unntak',
        label_en: 'Exemptions',
        description_no: 'Hvem som bor omfattes av eventuelle unntak.',
        description_en: 'Who should qualify for any exemptions.',
        icon_key: 'shield',
      },
    ],
    updates: [
      {
        title: 'Consultation closed',
        content: 'The consultation period has closed and the recommendation is under internal review.',
        update_type: 'status_change',
      },
    ],
    events: [
      {
        title: 'Review update webinar',
        description: 'A short webinar explaining the next phase and timeline.',
        event_date: makeEventDate(14),
        location: 'Online webinar',
        mode: 'online',
        registration_url: 'https://example.com/demo-emissions-review',
      },
    ],
    attachments: [],
  },
  {
    key: 'demo-culture-grants',
    title_no: 'DEMO: Lokale kulturmidler for nabolag',
    title_en: 'DEMO: Neighbourhood Culture Grants',
    description_no:
      'En demonstrasjonssak i utkastmodus som skal vere synlig for admin, men skjult for innbyggere inntil publisering.',
    description_en:
      'A demo draft policy that should remain visible to admins only until it is published.',
    categoryName: 'Culture',
    status: 'draft',
    isPublished: false,
    scope: 'district',
    districtNames: ['Tromsoya', 'Hakoya'],
    allowAnonymous: true,
    tags: ['demo-fixture', 'culture', 'draft'],
    topics: [
      {
        slug: 'grant-size',
        label_no: 'Storrelsen pa tilskudd',
        label_en: 'Grant size',
        description_no: 'Hvor store tilskudd som bor gis til lokale initiativ.',
        description_en: 'What size grants should be awarded to local initiatives.',
        icon_key: 'coins',
      },
    ],
    updates: [
      {
        title: 'Draft prepared',
        content: 'The draft has been prepared internally and awaits publication.',
        update_type: 'info',
      },
    ],
    events: [],
    attachments: [],
  },
];

export const LEGACY_POLICY_IDS = [
  'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
  'bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
  'bbbbbbb3-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
];

export const createScopedClient = () =>
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

const resolveServiceRoleKey = () => {
  if (env.SUPABASE_SERVICE_ROLE_KEY) return env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    const output = execFileSync(
      'supabase',
      ['projects', 'api-keys', '--project-ref', projectRef, '-o', 'json'],
      { encoding: 'utf8' },
    );
    const keys = JSON.parse(output);
    const match =
      keys.find((key) => key.id === 'service_role' && key.api_key) ||
      keys.find(
        (key) =>
          key.type === 'secret' &&
          key.secret_jwt_template?.role === 'service_role' &&
          key.api_key,
      );

    if (!match) return null;
    if (String(match.api_key).includes('····')) return null;
    return match.api_key;
  } catch {
    return null;
  }
};

export const createServiceRoleClient = () => {
  const serviceRoleKey = resolveServiceRoleKey();
  if (!serviceRoleKey) {
    throw new Error(
      'Unable to resolve SUPABASE_SERVICE_ROLE_KEY. Run `supabase login` or set SUPABASE_SERVICE_ROLE_KEY in your environment.',
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
};

const decodeJwtClaims = (token) => {
  const [, payload] = token.split('.');
  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
  const decoded = Buffer.from(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='), 'base64').toString('utf8');
  return JSON.parse(decoded);
};

export const ensureVerifiedSession = async (client, serviceRoleClient, roleHint) => {
  const {
    data: { session },
    error: sessionError,
  } = await client.auth.getSession();

  if (sessionError || !session?.access_token || !session.user) {
    throw sessionError || new Error('Missing authenticated session');
  }

  const claims = decodeJwtClaims(session.access_token);
  if (!claims.session_id || !claims.exp) {
    throw new Error('Session token is missing session_id or exp claims');
  }

  await serviceRoleClient.from('verified_sessions').upsert(
    {
      user_id: session.user.id,
      session_id: claims.session_id,
      role: roleHint || claims.role || 'citizen',
      source: 'otp',
      expires_at: new Date(claims.exp * 1000).toISOString(),
    },
    { onConflict: 'session_id' },
  );

  return session;
};

const upsertProfile = async (serviceRoleClient, userId, account) => {
  const { error } = await serviceRoleClient.from('profiles').upsert({
    id: userId,
    email: account.email,
    full_name: account.fullName,
    role: account.expectedRole,
    district_id: account.districtId || null,
    date_of_birth: account.dateOfBirth || null,
    avatar_url: null,
    email_notifications: true,
  });

  if (error) throw error;
};

export const ensureAccount = async (serviceRoleClient, account) => {
  const { data: usersData, error: usersError } = await serviceRoleClient.auth.admin.listUsers();
  if (usersError) throw usersError;

  let user = usersData.users.find(
    (candidate) => candidate.email?.toLowerCase() === account.email.toLowerCase(),
  );

  if (user) {
    const { data, error } = await serviceRoleClient.auth.admin.updateUserById(user.id, {
      password: account.password,
      email_confirm: true,
      user_metadata: { full_name: account.fullName },
    });
    if (error) throw error;
    user = data.user;
  } else {
    const { data, error } = await serviceRoleClient.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
      user_metadata: { full_name: account.fullName },
    });
    if (error) throw error;
    user = data.user;
  }

  await upsertProfile(serviceRoleClient, user.id, account);
  return { ...account, userId: user.id };
};

export const ensureDemoAccounts = async (serviceRoleClient) => {
  const accounts = [];
  for (const account of DEMO_ACCOUNTS) {
    accounts.push(await ensureAccount(serviceRoleClient, account));
  }
  return accounts;
};

export const signInAndVerifyAccount = async (account, serviceRoleClient) => {
  const client = createScopedClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: account.email,
    password: account.password,
  });

  if (error || !data.user) {
    throw error || new Error(`Failed to sign in ${account.email}`);
  }

  await ensureVerifiedSession(client, serviceRoleClient, account.expectedRole);

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profile) {
    throw profileError || new Error(`Missing profile for ${account.email}`);
  }

  return { client, profile, session: data.session };
};

const findCategoryId = (categories, categoryName) => {
  const match = categories.find((item) => item.name === categoryName);
  if (!match) throw new Error(`Unknown category ${categoryName}`);
  return match.id;
};

const findDistrictIds = (districts, districtNames) =>
  districtNames.map((districtName) => {
    const match = districts.find((item) => item.name === districtName);
    if (!match) throw new Error(`Unknown district ${districtName}`);
    return match.id;
  });

const cleanupPolicyAttachments = async (serviceRoleClient, policyId) => {
  const { data: attachments, error } = await serviceRoleClient
    .from('policy_attachments')
    .select('*')
    .eq('policy_id', policyId);

  if (error) throw error;

  const storagePaths = (attachments || [])
    .map((attachment) => attachment.file_path)
    .filter((filePath) => filePath && !filePath.startsWith('http') && !filePath.startsWith('data:'));

  if (storagePaths.length) {
    await serviceRoleClient.storage.from('policy-attachments').remove(storagePaths);
  }

  await serviceRoleClient.from('policy_attachments').delete().eq('policy_id', policyId);
};

const uploadPolicyAttachments = async (serviceRoleClient, policyId, attachments, uploadedBy) => {
  if (!attachments.length) return;

  await cleanupPolicyAttachments(serviceRoleClient, policyId);

  for (const attachment of attachments) {
    const objectPath = `demo-fixtures/${policyId}/${attachment.fileName}`;
    const uploadResult = await serviceRoleClient.storage
      .from('policy-attachments')
      .upload(objectPath, Buffer.from(attachment.content, 'utf8'), {
        upsert: true,
        contentType: attachment.fileType,
      });

    if (uploadResult.error) throw uploadResult.error;

    const { error: insertError } = await serviceRoleClient.from('policy_attachments').insert({
      policy_id: policyId,
      file_name: attachment.fileName,
      file_path: objectPath,
      file_size: Buffer.byteLength(attachment.content, 'utf8'),
      file_type: attachment.fileType,
      uploaded_by: uploadedBy || null,
    });

    if (insertError) throw insertError;
  }
};

export const buildPolicyPayload = ({ fixture, categories, districts, existingId, extraUpdates = [] }) => ({
  policy: {
    id: existingId || undefined,
    title: fixture.title_no,
    description: fixture.description_no,
    title_no: fixture.title_no,
    title_en: fixture.title_en,
    description_no: fixture.description_no,
    description_en: fixture.description_en,
    category_id: findCategoryId(categories, fixture.categoryName),
    status: fixture.status,
    scope: fixture.scope,
    start_date: new Date().toISOString().slice(0, 10),
    end_date: null,
    allow_anonymous: fixture.allowAnonymous,
    video_url: '',
    is_published: fixture.isPublished,
    published_at: fixture.isPublished ? new Date().toISOString() : null,
  },
  district_ids: findDistrictIds(districts, fixture.districtNames),
  tags: fixture.tags,
  topics: fixture.topics.map((topic, index) => ({
    ...topic,
    sort_order: index,
  })),
  updates: [...fixture.updates, ...extraUpdates],
  events: fixture.events,
});

export const removeLegacySeedPolicies = async (adminClient, serviceRoleClient) => {
  const { data: legacyPolicies, error } = await serviceRoleClient
    .from('policies')
    .select('id')
    .in('id', LEGACY_POLICY_IDS);
  if (error) throw error;

  for (const policy of legacyPolicies || []) {
    await cleanupPolicyAttachments(serviceRoleClient, policy.id);
    const { error: deleteError } = await adminClient.rpc('admin_delete_policy_workspace', {
      policy_id: policy.id,
    });
    if (deleteError) throw deleteError;
  }
};

export const ensureDemoPolicies = async (serviceRoleClient) => {
  const accounts = await ensureDemoAccounts(serviceRoleClient);
  const adminAccount = accounts.find((account) => account.expectedRole === 'admin');
  if (!adminAccount) throw new Error('Admin demo account is missing');

  const { client: adminClient, profile: adminProfile } = await signInAndVerifyAccount(
    adminAccount,
    serviceRoleClient,
  );

  await removeLegacySeedPolicies(adminClient, serviceRoleClient);

  const [{ data: categories, error: categoriesError }, { data: districts, error: districtsError }] =
    await Promise.all([
      serviceRoleClient.from('categories').select('*'),
      serviceRoleClient.from('districts').select('*'),
    ]);

  if (categoriesError) throw categoriesError;
  if (districtsError) throw districtsError;

  const createdPolicies = [];

  for (const fixture of DEMO_POLICY_FIXTURES) {
    const { data: existingRows, error: existingError } = await serviceRoleClient
      .from('policies')
      .select('id')
      .eq('title_no', fixture.title_no)
      .limit(1);

    if (existingError) throw existingError;

    const payload = buildPolicyPayload({
      fixture,
      categories: categories || [],
      districts: districts || [],
      existingId: existingRows?.[0]?.id,
    });

    const { data, error } = await adminClient.rpc('admin_upsert_policy_workspace', {
      payload,
    });

    if (error) throw error;
    const policyId = data?.policy_id;
    if (!policyId) throw new Error(`Failed to resolve policy id for fixture ${fixture.key}`);

    await uploadPolicyAttachments(
      serviceRoleClient,
      policyId,
      fixture.attachments,
      adminProfile.id,
    );

    createdPolicies.push({
      ...fixture,
      id: policyId,
    });
  }

  await adminClient.auth.signOut();
  return { accounts, policies: createdPolicies };
};

export const resetDemoEngagement = async (serviceRoleClient, userIds, policyIds) => {
  if (!userIds.length || !policyIds.length) return;

  await serviceRoleClient.from('notifications').delete().in('user_id', userIds).in('related_policy_id', policyIds);
  await serviceRoleClient.from('policy_follows').delete().in('user_id', userIds).in('policy_id', policyIds);
  await serviceRoleClient.from('feedback').delete().in('user_id', userIds).in('policy_id', policyIds);
  await serviceRoleClient.from('sentiment_votes').delete().in('user_id', userIds).in('policy_id', policyIds);
  await serviceRoleClient.from('policy_views').delete().in('user_id', userIds).in('policy_id', policyIds);
};

export const getFixtureAccountsMap = (accounts) =>
  Object.fromEntries(accounts.map((account) => [account.email, account]));

export const getFixturePoliciesMap = (policies) =>
  Object.fromEntries(policies.map((policy) => [policy.key, policy]));
