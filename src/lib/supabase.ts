import { createClient } from '@supabase/supabase-js';
import type { Session } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import { createLocalSupabaseClient } from './localSupabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const providerPreference = (import.meta.env.VITE_DATA_PROVIDER || '').toLowerCase();

const canUseSupabase = !!supabaseUrl && !!supabaseAnonKey;
const useSupabase = providerPreference === 'supabase' && canUseSupabase;
export const DATA_PROVIDER = useSupabase ? 'supabase' : 'local';

if (!useSupabase && providerPreference === 'supabase' && !canUseSupabase) {
  console.warn('VITE_DATA_PROVIDER is set to "supabase" but Supabase env vars are missing. Falling back to local data mode.');
}

export const supabase: any = useSupabase
  ? createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : createLocalSupabaseClient();

const decodeJwtPayload = (token: string) => {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
};

export const getAuthSessionId = (session: Session | null | undefined): string | null => {
  if (!session) return null;
  const explicitSessionId = (session as any).session_id;
  if (typeof explicitSessionId === 'string' && explicitSessionId) return explicitSessionId;

  const jwtPayload = typeof session.access_token === 'string' ? decodeJwtPayload(session.access_token) : null;
  const sessionId = jwtPayload?.session_id;
  return typeof sessionId === 'string' && sessionId ? sessionId : null;
};

export const isAdmin = async (): Promise<boolean> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  return !!profile && (profile.role === 'admin' || profile.role === 'super_admin');
};
