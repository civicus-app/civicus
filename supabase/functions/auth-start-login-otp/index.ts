import {
  badRequest,
  corsHeaders,
  createAdminClient,
  createChallengeResponse,
  generateOtpCode,
  hashValue,
  requireUser,
  sendOtpEmail,
  json,
} from '../_shared/auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const { user, error, userClient } = await requireUser(req);
  if (error || !user) return error;

  const { data: profile } = await userClient
    .from('profiles')
    .select('id, email, role')
    .eq('id', user.id)
    .single();

  if (!profile) return badRequest('Profile not found', 404);

  const adminClient = createAdminClient();
  const { data: existingPending } = await adminClient
    .from('auth_email_challenges')
    .select('id, resend_available_at')
    .eq('user_id', user.id)
    .eq('purpose', 'login')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingPending && existingPending.resend_available_at > new Date().toISOString()) {
    return badRequest('Please wait before requesting another verification code', 429);
  }

  await adminClient
    .from('auth_email_challenges')
    .update({ status: 'cancelled' })
    .eq('user_id', user.id)
    .eq('purpose', 'login')
    .in('status', ['pending', 'verified']);

  const code = generateOtpCode();
  const codeHash = await hashValue(code);
  const now = Date.now();

  const { data: challenge, error: challengeError } = await adminClient
    .from('auth_email_challenges')
    .insert({
      email: profile.email,
      user_id: user.id,
      purpose: 'login',
      account_mode: profile.role === 'citizen' ? 'citizen' : 'admin',
      invite_id: null,
      code_hash: codeHash,
      status: 'pending',
      attempts: 0,
      max_attempts: 5,
      expires_at: new Date(now + 10 * 60 * 1000).toISOString(),
      resend_available_at: new Date(now + 60 * 1000).toISOString(),
    })
    .select('id, email, account_mode, expires_at, resend_available_at')
    .single();

  if (challengeError || !challenge) {
    return badRequest(challengeError?.message || 'Could not create login verification', 500);
  }

  try {
    await sendOtpEmail(profile.email, code, 'login');
  } catch (emailError) {
    await adminClient
      .from('auth_email_challenges')
      .update({ status: 'cancelled' })
      .eq('id', challenge.id);
    return badRequest(
      emailError instanceof Error ? emailError.message : 'Failed to send verification email',
      500
    );
  }

  return json(200, createChallengeResponse(challenge));
});
