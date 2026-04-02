import {
  badRequest,
  corsHeaders,
  createAdminClient,
  createChallengeResponse,
  generateOtpCode,
  hashValue,
  json,
  normalizeEmail,
  sendOtpEmail,
} from '../_shared/auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, accountMode, inviteCode } = await req.json();
    const normalizedEmail = normalizeEmail(String(email || ''));
    const mode = accountMode === 'admin' ? 'admin' : 'citizen';

    if (!normalizedEmail) return badRequest('Email is required');

    const adminClient = createAdminClient();
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingProfile) {
      return badRequest('An account already exists for this email', 409);
    }

    let inviteId: string | null = null;
    if (mode === 'admin') {
      const trimmedInviteCode = String(inviteCode || '').trim();
      if (!trimmedInviteCode) {
        return badRequest('Admin invite code is required');
      }

      const inviteHash = await hashValue(trimmedInviteCode);
      const { data: invite } = await adminClient
        .from('admin_invites')
        .select('id, email, expires_at, used_at, revoked_at')
        .eq('code_hash', inviteHash)
        .maybeSingle();

      if (
        !invite ||
        invite.used_at ||
        invite.revoked_at ||
        invite.expires_at <= new Date().toISOString() ||
        (invite.email && invite.email.toLowerCase() !== normalizedEmail)
      ) {
        return badRequest('Invalid or expired admin invite code', 403);
      }
      inviteId = invite.id;
    }

    const { data: existingPending } = await adminClient
      .from('auth_email_challenges')
      .select('id, resend_available_at')
      .eq('email', normalizedEmail)
      .eq('purpose', 'signup')
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
      .eq('email', normalizedEmail)
      .eq('purpose', 'signup')
      .in('status', ['pending', 'verified']);

    const code = generateOtpCode();
    const codeHash = await hashValue(code);
    const now = Date.now();

    const { data: challenge, error: challengeError } = await adminClient
      .from('auth_email_challenges')
      .insert({
        email: normalizedEmail,
        user_id: null,
        purpose: 'signup',
        account_mode: mode,
        invite_id: inviteId,
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
      return badRequest(challengeError?.message || 'Could not create verification challenge', 500);
    }

    try {
      await sendOtpEmail(normalizedEmail, code, 'signup');
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
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : 'Invalid request payload');
  }
});
