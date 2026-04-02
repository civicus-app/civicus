import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_ACCOUNTS = [
  {
    email: 'admin@civicus.example.com',
    password: 'admin12345',
    fullName: 'Civicus Admin',
    expectedRole: 'admin',
  },
  {
    email: 'citizen@civicus.example.com',
    password: 'citizen12345',
    fullName: 'Civicus Citizen',
    expectedRole: 'citizen',
  },
];

const readEnvFile = (fileName) => {
  const filePath = path.resolve(process.cwd(), fileName);
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

const env = {
  ...readEnvFile('.env'),
  ...readEnvFile('.env.local'),
  ...process.env,
};

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.');
  process.exit(1);
}

const projectRef = new URL(supabaseUrl).hostname.split('.')[0];

const createScopedClient = () =>
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
      keys.find((key) => key.type === 'secret' && key.secret_jwt_template?.role === 'service_role' && key.api_key);

    if (!match) return null;
    if (String(match.api_key).includes('····')) return null;
    return match.api_key;
  } catch {
    return null;
  }
};

const serviceRoleKey = resolveServiceRoleKey();

const adminClient = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })
  : null;

const trySignIn = async (email, password) => {
  const client = createScopedClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  await client.auth.signOut();
  return { data, error };
};

const upsertAccountWithAdminApi = async ({ email, password, fullName, expectedRole }) => {
  if (!adminClient) return false;

  const { data: usersData, error: usersError } = await adminClient.auth.admin.listUsers();
  if (usersError) {
    console.error(`failed ${email}: ${usersError.message}`);
    process.exitCode = 1;
    return true;
  }

  const existingUser = usersData.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());

  if (existingUser) {
    const { error } = await adminClient.auth.admin.updateUserById(existingUser.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (error) {
      console.error(`failed ${email}: ${error.message}`);
      process.exitCode = 1;
      return true;
    }

    console.log(`updated ${email} (${expectedRole})`);
    return true;
  }

  const { error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error) {
    console.error(`failed ${email}: ${error.message}`);
    process.exitCode = 1;
    return true;
  }

  console.log(`created ${email} (${expectedRole})`);
  return true;
};

const ensureAccount = async ({ email, password, fullName, expectedRole }) => {
  if (await upsertAccountWithAdminApi({ email, password, fullName, expectedRole })) {
    return;
  }

  const signInResult = await trySignIn(email, password);
  if (!signInResult.error && signInResult.data.user) {
    console.log(`exists ${email}`);
    return;
  }

  const client = createScopedClient();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes('already')) {
      console.log(`exists ${email}`);
      return;
    }

    console.error(`failed ${email}: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  if (!data.user) {
    console.error(`failed ${email}: signup returned no user`);
    process.exitCode = 1;
    return;
  }

  console.log(`created ${email} (${expectedRole})`);

  const verifyResult = await trySignIn(email, password);
  if (verifyResult.error) {
    console.log(`warn ${email}: created but sign-in still blocked (${verifyResult.error.message})`);
  }
};

for (const account of DEFAULT_ACCOUNTS) {
  await ensureAccount(account);
}
