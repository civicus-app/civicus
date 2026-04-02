import { createClient } from 'npm:@supabase/supabase-js@2.49.8';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey =
  Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY');
const fromEmail = Deno.env.get('OTP_FROM_EMAIL') || 'CIVICUS <no-reply@example.com>';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const createAdminClient = () =>
  createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

export const createUserClient = (req: Request) =>
  createClient(supabaseUrl, supabaseAnonKey || serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: req.headers.get('Authorization') || '',
      },
    },
  });

export const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });

export const badRequest = (message: string, status = 400) => json(status, { error: message });

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const hashValue = async (value: string) => {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

export const generateOtpCode = () =>
  String(Math.floor(100000 + Math.random() * 900000));

export const generateToken = () => crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');

export const maskEmail = (email: string) => {
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return email;
  return `${localPart.slice(0, 2)}***@${domain}`;
};

const base64UrlDecode = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return atob(padded);
};

export const getJwtClaims = (req: Request) => {
  const authorization = req.headers.get('Authorization') || '';
  const token = authorization.replace(/^Bearer\s+/i, '');
  if (!token) return { sessionId: null as string | null, exp: null as number | null };

  try {
    const [, payload] = token.split('.');
    const claims = JSON.parse(base64UrlDecode(payload));
    return {
      sessionId: typeof claims.session_id === 'string' ? claims.session_id : null,
      exp: typeof claims.exp === 'number' ? claims.exp : null,
    };
  } catch {
    return { sessionId: null as string | null, exp: null as number | null };
  }
};

export const requireUser = async (req: Request) => {
  const userClient = createUserClient(req);
  const {
    data: { user },
    error,
  } = await userClient.auth.getUser();

  if (error || !user) {
    return { user: null, userClient, error: badRequest('Unauthorized', 401) };
  }

  return { user, userClient, error: null };
};

export const sendOtpEmail = async (email: string, code: string, context: 'signup' | 'login') => {
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  const subject =
    context === 'signup'
      ? 'Your CIVICUS sign-up verification code'
      : 'Your CIVICUS sign-in verification code';

  const html = `
    <div style="font-family: Arial, sans-serif; color: #172335;">
      <h2 style="margin-bottom: 8px;">CIVICUS verification code</h2>
      <p style="margin: 0 0 16px;">Use this code to complete your ${context === 'signup' ? 'account creation' : 'sign in'}.</p>
      <div style="font-size: 32px; font-weight: 700; letter-spacing: 0.24em; color: #1c6ea4; margin: 20px 0;">${code}</div>
      <p style="margin: 0 0 8px;">The code expires in 10 minutes.</p>
      <p style="margin: 0; color: #667085;">If you did not request this, you can ignore this email.</p>
    </div>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [email],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || 'Failed to send verification email');
  }
};

export const createChallengeResponse = (challenge: {
  id: string;
  email: string;
  account_mode: string;
  expires_at: string;
  resend_available_at: string;
}) => ({
  challengeId: challenge.id,
  email: challenge.email,
  accountMode: challenge.account_mode,
  expiresAt: challenge.expires_at,
  resendAvailableAt: challenge.resend_available_at,
  maskedEmail: maskEmail(challenge.email),
});
