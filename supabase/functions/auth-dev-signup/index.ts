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
    const { email, accountMode, inviteCode, fullName, password } = await req.json();
    const normalizedEmail = normalizeEmail(String(email || ''));
    const mode = accountMode === 'admin' ? 'admin' : 'citizen';
    const trimmedName = String(fullName || '').trim();
    const submittedPassword = String(password || '');

    if (!normalizedEmail) return badRequest('Email is required');
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

    if (inviteId) {
      await adminClient
        .from('admin_invites')
        .update({
          used_at: new Date().toISOString(),
          used_by: createdUser.user.id,
        })
        .eq('id', inviteId);
    }

    return json(200, { success: true });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : 'Invalid request payload');
  }
});
