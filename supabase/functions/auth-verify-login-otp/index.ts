import {
  badRequest,
  corsHeaders,
  createAdminClient,
  getJwtClaims,
  generateToken,
  hashValue,
  json,
  requireUser,
} from '../_shared/auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const { user, error, userClient } = await requireUser(req);
  if (error || !user) return error;

  const { sessionId, exp } = getJwtClaims(req);
  if (!sessionId || !exp) {
    return badRequest('Current auth session could not be verified', 401);
  }

  const { code, rememberDevice } = await req.json();
  const submittedCode = String(code || '').trim();
  if (!submittedCode) return badRequest('Verification code is required');

  const { data: profile } = await userClient
    .from('profiles')
    .select('id, email, role')
    .eq('id', user.id)
    .single();

  if (!profile) return badRequest('Profile not found', 404);

  const adminClient = createAdminClient();
  const { data: challenge } = await adminClient
    .from('auth_email_challenges')
    .select('*')
    .eq('user_id', user.id)
    .eq('purpose', 'login')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!challenge) {
    return badRequest('No active login verification was found', 404);
  }

  if (challenge.expires_at <= new Date().toISOString()) {
    await adminClient.from('auth_email_challenges').update({ status: 'expired' }).eq('id', challenge.id);
    return badRequest('The verification code has expired', 410);
  }

  if (challenge.attempts >= challenge.max_attempts) {
    return badRequest('Too many attempts. Request a new code.', 429);
  }

  const submittedHash = await hashValue(submittedCode);
  if (submittedHash !== challenge.code_hash) {
    const nextAttempts = challenge.attempts + 1;
    await adminClient
      .from('auth_email_challenges')
      .update({
        attempts: nextAttempts,
        status: nextAttempts >= challenge.max_attempts ? 'expired' : 'pending',
      })
      .eq('id', challenge.id);
    return badRequest('Invalid verification code', 401);
  }

  await adminClient
    .from('auth_email_challenges')
    .update({
      status: 'completed',
      verified_at: new Date().toISOString(),
    })
    .eq('id', challenge.id);

  await adminClient
    .from('verified_sessions')
    .upsert({
      user_id: user.id,
      session_id: sessionId,
      role: profile.role,
      source: 'otp',
      expires_at: new Date(exp * 1000).toISOString(),
    }, { onConflict: 'session_id' });

  let trustedDeviceToken: string | undefined;
  let trustedDeviceExpiresAt: string | undefined;

  if (rememberDevice && profile.role === 'citizen') {
    trustedDeviceToken = generateToken();
    trustedDeviceExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await adminClient.from('trusted_devices').insert({
      user_id: user.id,
      token_hash: await hashValue(trustedDeviceToken),
      expires_at: trustedDeviceExpiresAt,
      last_used_at: new Date().toISOString(),
    });
  }

  return json(200, {
    verified: true,
    role: profile.role,
    trustedDeviceToken,
    trustedDeviceExpiresAt,
  });
});
