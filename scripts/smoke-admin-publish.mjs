import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

const rootDir = process.cwd();

const readEnvFile = (filePath) => {
  const absolutePath = path.join(rootDir, filePath);
  if (!fs.existsSync(absolutePath)) return {};

  return fs
    .readFileSync(absolutePath, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .reduce((acc, line) => {
      const separatorIndex = line.indexOf('=');
      if (separatorIndex === -1) return acc;
      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      acc[key] = value;
      return acc;
    }, {});
};

const env = {
  ...readEnvFile('.env.local'),
  ...process.env,
};

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

const createBrowserLikeClient = () =>
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

const markSessionVerified = async (client) => {
  const {
    data: { session },
    error: sessionError,
  } = await client.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw sessionError || new Error('Missing session access token');
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/auth-mark-session-verified`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`auth-mark-session-verified failed: ${text || response.statusText}`);
  }

  return response.json();
};

const signInAndVerify = async (email, password) => {
  const client = createBrowserLikeClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    throw error || new Error(`Failed to sign in ${email}`);
  }

  await markSessionVerified(client);

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profile) {
    throw profileError || new Error(`Missing profile for ${email}`);
  }

  return { client, profile };
};

const ensure = (condition, message) => {
  if (!condition) throw new Error(message);
};

const main = async () => {
  const adminCreds = {
    email: 'admin@civicus.example.com',
    password: 'admin12345',
  };
  const citizenCreds = {
    email: 'citizen@civicus.example.com',
    password: 'citizen12345',
  };

  console.log('Signing in as admin...');
  const { client: adminClient, profile: adminProfile } = await signInAndVerify(
    adminCreds.email,
    adminCreds.password
  );
  ensure(
    adminProfile.role === 'admin' || adminProfile.role === 'super_admin',
    'Admin credentials did not resolve to an admin profile'
  );

  const [{ data: categories, error: categoriesError }, { data: districts, error: districtsError }] =
    await Promise.all([
      adminClient.from('categories').select('*').limit(1),
      adminClient.from('districts').select('*').limit(1),
    ]);

  if (categoriesError) throw categoriesError;
  if (districtsError) throw districtsError;
  ensure(categories?.length, 'No categories available for smoke test');
  ensure(districts?.length, 'No districts available for smoke test');

  const smokeLabel = `Smoke policy ${new Date().toISOString()}`;
  const smokeSlug = `smoke-${Date.now()}`;

  console.log('Creating draft policy as admin...');
  const draftPayload = {
    policy: {
      title: smokeLabel,
      description: 'Initial smoke test description',
      title_no: `${smokeLabel} NO`,
      title_en: `${smokeLabel} EN`,
      description_no: 'Dette er en automatisk test av publiseringsflyten.',
      description_en: 'This is an automated smoke test of the publishing flow.',
      category_id: categories[0].id,
      status: 'draft',
      scope: 'district',
      start_date: new Date().toISOString().slice(0, 10),
      end_date: null,
      allow_anonymous: true,
      video_url: '',
      is_published: false,
      published_at: null,
    },
    district_ids: [districts[0].id],
    tags: ['smoke-test', 'admin-publish'],
    topics: [
      {
        slug: smokeSlug,
        label_no: 'Testtema',
        label_en: 'Test topic',
        description_no: 'Automatisk opprettet tema for smoke test.',
        description_en: 'Auto-created topic for smoke test.',
        icon_key: 'file-text',
        sort_order: 0,
      },
    ],
    updates: [
      {
        title: 'Initial update',
        content: 'Created during smoke test.',
        update_type: 'info',
      },
    ],
    events: [
      {
        title: 'Smoke test event',
        description: 'Internal validation event',
        event_date: new Date(Date.now() + 86400000).toISOString(),
        location: districts[0].name,
        mode: 'online',
        registration_url: 'https://example.com/register',
      },
    ],
  };

  const { data: draftResult, error: draftError } = await adminClient.rpc(
    'admin_upsert_policy_workspace',
    { payload: draftPayload }
  );
  if (draftError) throw draftError;

  const policyId = draftResult?.policy_id;
  ensure(policyId, 'admin_upsert_policy_workspace did not return a policy_id');
  console.log(`Created draft policy ${policyId}`);

  console.log('Signing in as citizen...');
  const { client: citizenClient } = await signInAndVerify(
    citizenCreds.email,
    citizenCreds.password
  );

  console.log('Verifying draft is hidden from citizen list...');
  const { data: hiddenDraft, error: hiddenDraftError } = await citizenClient
    .from('policies')
    .select('id')
    .eq('id', policyId)
    .eq('is_published', true)
    .in('status', ['active', 'under_review', 'closed']);
  if (hiddenDraftError) throw hiddenDraftError;
  ensure((hiddenDraft || []).length === 0, 'Draft policy unexpectedly visible to citizens');

  console.log('Publishing policy as admin...');
  const publishPayload = {
    ...draftPayload,
    policy: {
      ...draftPayload.policy,
      id: policyId,
      status: 'active',
      is_published: true,
      published_at: new Date().toISOString(),
    },
  };

  const { error: publishError } = await adminClient.rpc('admin_upsert_policy_workspace', {
    payload: publishPayload,
  });
  if (publishError) throw publishError;

  console.log('Verifying published policy is visible to citizens...');
  const { data: visibleRows, error: visibleError } = await citizenClient
    .from('policies')
    .select('id, title_no, title_en, status, is_published')
    .eq('id', policyId)
    .eq('is_published', true)
    .in('status', ['active', 'under_review', 'closed']);
  if (visibleError) throw visibleError;
  ensure((visibleRows || []).length === 1, 'Published policy was not visible to citizens');

  const { data: detailRows, error: detailError } = await citizenClient
    .from('policies')
    .select(
      'id, policy_topics(*), policy_updates(*), events(*), policy_districts(district_id, districts(name))'
    )
    .eq('id', policyId)
    .single();
  if (detailError) throw detailError;
  ensure((detailRows?.policy_topics || []).length > 0, 'Published policy missing topics');
  ensure((detailRows?.policy_updates || []).length > 0, 'Published policy missing updates');
  ensure((detailRows?.events || []).length > 0, 'Published policy missing events');
  ensure((detailRows?.policy_districts || []).length > 0, 'Published policy missing district assignments');

  console.log('Cleaning up smoke policy...');
  const { error: deleteError } = await adminClient.rpc('admin_delete_policy_workspace', {
    policy_id: policyId,
  });
  if (deleteError) throw deleteError;

  const { data: deletedRows, error: deletedCheckError } = await citizenClient
    .from('policies')
    .select('id')
    .eq('id', policyId);
  if (deletedCheckError) throw deletedCheckError;
  ensure((deletedRows || []).length === 0, 'Smoke policy cleanup failed');

  await adminClient.auth.signOut();
  await citizenClient.auth.signOut();

  console.log('Smoke test passed.');
  console.log(`Policy create/publish/visibility/cleanup verified for ${policyId}`);
};

main().catch((error) => {
  console.error('Smoke test failed.');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
