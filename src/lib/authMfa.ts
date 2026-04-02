import { supabase } from './supabase';
import type {
  AccountMode,
  CompleteSignupInput,
  OtpChallengeResponse,
  VerifyLoginOtpResponse,
  VerifyTrustedDeviceResponse,
  VerifiedSignupResponse,
} from '../types/auth.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const useRemoteFunctions =
  (import.meta.env.VITE_DATA_PROVIDER || '').toLowerCase() === 'supabase' &&
  !!supabaseUrl &&
  !!supabaseAnonKey;
const PUBLIC_FUNCTIONS = new Set([
  'auth-start-signup',
  'auth-verify-signup-code',
  'auth-complete-signup',
  'auth-dev-signup',
]);
const TRUSTED_DEVICE_STORAGE_KEY = 'civicus.auth.trusted-devices.v1';
const PENDING_LOGIN_SESSION_STORAGE_KEY = 'civicus.auth.pending-login-session.v1';

type TrustedDeviceRecord = Record<
  string,
  {
    token: string;
    expiresAt: string;
  }
>;

const readTrustedDevices = (): TrustedDeviceRecord => {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(TRUSTED_DEVICE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TrustedDeviceRecord) : {};
  } catch {
    return {};
  }
};

const writeTrustedDevices = (value: TrustedDeviceRecord) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TRUSTED_DEVICE_STORAGE_KEY, JSON.stringify(value));
};

const readResponseErrorMessage = async (response: unknown): Promise<string | null> => {
  if (!response || typeof response !== 'object' || !('text' in response)) return null;

  try {
    const candidate = response as Response;
    const raw = await candidate.clone().text();
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as { error?: unknown; message?: unknown };
      if (typeof parsed.error === 'string' && parsed.error.trim()) return parsed.error;
      if (typeof parsed.message === 'string' && parsed.message.trim()) return parsed.message;
    } catch {
      if (raw.trim()) return raw.trim();
    }
  } catch {
    return null;
  }

  return null;
};

const normalizeFunctionError = async (error: any, fallback: string) => {
  if (!error) return new Error(fallback);

  const contextMessage = await readResponseErrorMessage(error?.context);
  if (contextMessage) return new Error(contextMessage);

  if (typeof error?.message === 'string' && error.message.trim() && error.message !== 'Edge Function returned a non-2xx status code') {
    return new Error(error.message);
  }

  return new Error(fallback);
};

const invoke = async <T>(name: string, body?: Record<string, unknown>): Promise<T> => {
  const {
    data: { session },
  } = typeof supabase.auth?.getSession === 'function'
    ? await supabase.auth.getSession()
    : { data: { session: null } };

  if (useRemoteFunctions) {
    const hasSessionToken = session?.access_token && typeof session.access_token === 'string';
    const needsPublicAccess = PUBLIC_FUNCTIONS.has(name) && !hasSessionToken;

    const response = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey!,
        ...(needsPublicAccess
          ? {}
          : hasSessionToken
          ? {
              Authorization: `Bearer ${session.access_token}`,
            }
          : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const message = await readResponseErrorMessage(response);
      throw new Error(message || `Failed to call ${name}`);
    }

    return (await response.json()) as T;
  }

  const headers =
    session?.access_token && typeof session.access_token === 'string'
      ? {
          Authorization: `Bearer ${session.access_token}`,
        }
      : undefined;

  const { data, error } = await supabase.functions.invoke(name, { body, headers });
  if (error) throw await normalizeFunctionError(error, `Failed to call ${name}`);
  return data as T;
};

export const authMfa = {
  async devSignup(input: {
    email: string;
    accountMode: AccountMode;
    inviteCode?: string;
    fullName: string;
    password: string;
  }) {
    return invoke<{ success: boolean }>('auth-dev-signup', input as unknown as Record<string, unknown>);
  },

  async startSignup(input: {
    email: string;
    accountMode: AccountMode;
    inviteCode?: string;
  }) {
    return invoke<OtpChallengeResponse>('auth-start-signup', input);
  },

  async verifySignupCode(input: {
    email: string;
    code: string;
    accountMode: AccountMode;
  }) {
    return invoke<VerifiedSignupResponse>('auth-verify-signup-code', input);
  },

  async completeSignup(input: CompleteSignupInput) {
    return invoke<{ success: boolean }>('auth-complete-signup', input as unknown as Record<string, unknown>);
  },

  async startLoginOtp() {
    return invoke<OtpChallengeResponse>('auth-start-login-otp');
  },

  async verifyLoginOtp(input: { code: string; rememberDevice?: boolean }) {
    return invoke<VerifyLoginOtpResponse>('auth-verify-login-otp', input);
  },

  async verifyTrustedDevice(input: { token: string }) {
    return invoke<VerifyTrustedDeviceResponse>('auth-verify-trusted-device', input);
  },

  async markSessionVerified() {
    return invoke<{ verified: boolean; role: AccountMode | 'super_admin' }>('auth-mark-session-verified');
  },

  getTrustedDeviceToken(userId: string) {
    const devices = readTrustedDevices();
    const entry = devices[userId];
    if (!entry) return null;
    if (new Date(entry.expiresAt).getTime() <= Date.now()) {
      delete devices[userId];
      writeTrustedDevices(devices);
      return null;
    }
    return entry.token;
  },

  saveTrustedDeviceToken(userId: string, token: string, expiresAt: string) {
    const devices = readTrustedDevices();
    devices[userId] = { token, expiresAt };
    writeTrustedDevices(devices);
  },

  clearTrustedDeviceToken(userId: string) {
    const devices = readTrustedDevices();
    if (!devices[userId]) return;
    delete devices[userId];
    writeTrustedDevices(devices);
  },

  getPendingLoginSessionId() {
    if (typeof window === 'undefined') return null;
    return window.sessionStorage.getItem(PENDING_LOGIN_SESSION_STORAGE_KEY);
  },

  setPendingLoginSessionId(sessionId: string | null) {
    if (typeof window === 'undefined') return;
    if (sessionId) {
      window.sessionStorage.setItem(PENDING_LOGIN_SESSION_STORAGE_KEY, sessionId);
      return;
    }
    window.sessionStorage.removeItem(PENDING_LOGIN_SESSION_STORAGE_KEY);
  },
};
