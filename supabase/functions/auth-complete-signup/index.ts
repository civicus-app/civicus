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
    const { email, accountMode, verificationToken, fullName, password } = await req.json();
    const normalizedEmail = normalizeEmail(String(email || ''));
    const mode = accountMode === 'admin' ? 'admin' : 'citizen';
    const trimmedName = String(fullName || '').trim();
    const submittedPassword = String(password || '');

    if (!normalizedEmail || !verificationToken) {
      return badRequest('Email verification must be completed before account creation');
    }
    if (trimmedName.length < 2) return badRequest('Full name must be at least 2 characters');
    if (submittedPassword.length < 8) return badRequest('Password must be at least 8 characters');

    const adminClient = createAdminClient();
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingProfile) {
      return badRequest('An account already exists for this email', 409);
    }

    const { data: challenge } = await adminClient
      .from('auth_email_challenges')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('purpose', 'signup')
      .eq('status', 'verified')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!challenge || challenge.account_mode !== mode) {
      return badRequest('The signup verification is no longer valid', 404);
    }

    const submittedTokenHash = await hashValue(String(verificationToken));
    if (submittedTokenHash !== challenge.verification_token_hash) {
      return badRequest('The signup verification is no longer valid', 401);
    }

    const { data: createdUser, error: createUserError } = await adminClient.auth.admin.createUser({
      email: normalizedEmail,
      password: submittedPassword,
      email_confirm: true,
      user_metadata: {
        full_name: trimmedName,
      },
    });

    if (createUserError || !createdUser.user) {
      return badRequest(createUserError?.message || 'Failed to create account', 500);
    }

    if (mode === 'admin') {
      await adminClient
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', createdUser.user.id);
    }

    if (challenge.invite_id) {
      await adminClient
        .from('admin_invites')
        .update({
          used_at: new Date().toISOString(),
          used_by: createdUser.user.id,
        })
        .eq('id', challenge.invite_id);
    }

    await adminClient
      .from('auth_email_challenges')
      .update({
        status: 'completed',
      })
      .eq('id', challenge.id);

    return json(200, { success: true });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : 'Invalid request payload');
  }
});
