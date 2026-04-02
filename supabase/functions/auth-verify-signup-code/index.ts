import {
  badRequest,
  corsHeaders,
  createAdminClient,
  hashValue,
  json,
  normalizeEmail,
} from '../_shared/auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, code, accountMode } = await req.json();
    const normalizedEmail = normalizeEmail(String(email || ''));
    const submittedCode = String(code || '').trim();
    const mode = accountMode === 'admin' ? 'admin' : 'citizen';

    if (!normalizedEmail || !submittedCode) {
      return badRequest('Email and verification code are required');
    }

    const adminClient = createAdminClient();
    const { data: challenge } = await adminClient
      .from('auth_email_challenges')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('purpose', 'signup')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!challenge || challenge.account_mode !== mode) {
      return badRequest('No active signup verification was found', 404);
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

    const verificationToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    const verificationTokenHash = await hashValue(verificationToken);

    await adminClient
      .from('auth_email_challenges')
      .update({
        status: 'verified',
        verified_at: new Date().toISOString(),
        verification_token_hash: verificationTokenHash,
      })
      .eq('id', challenge.id);

    return json(200, {
      verificationToken,
      email: normalizedEmail,
      accountMode: mode,
    });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : 'Invalid request payload');
  }
});
