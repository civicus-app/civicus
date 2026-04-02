import {
  badRequest,
  corsHeaders,
  createAdminClient,
  getJwtClaims,
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

  const { token } = await req.json();
  const rawToken = String(token || '').trim();
  if (!rawToken) return badRequest('Trusted device token is required');

  const { data: profile } = await userClient
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single();

  if (!profile) return badRequest('Profile not found', 404);
  if (profile.role === 'admin' || profile.role === 'super_admin') {
    return badRequest('Admins must verify every login with a one-time code', 403);
  }

  const adminClient = createAdminClient();
  const tokenHash = await hashValue(rawToken);
  const { data: trustedDevice } = await adminClient
    .from('trusted_devices')
    .select('id, expires_at, revoked_at')
    .eq('user_id', user.id)
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (
    !trustedDevice ||
    trustedDevice.revoked_at ||
    trustedDevice.expires_at <= new Date().toISOString()
  ) {
    return badRequest('Trusted device expired or was not recognized', 401);
  }

  await adminClient
    .from('trusted_devices')
    .update({
      last_used_at: new Date().toISOString(),
    })
    .eq('id', trustedDevice.id);

  await adminClient
    .from('verified_sessions')
    .upsert({
      user_id: user.id,
      session_id: sessionId,
      role: profile.role,
      source: 'trusted_device',
      expires_at: new Date(exp * 1000).toISOString(),
    }, { onConflict: 'session_id' });

  return json(200, {
    verified: true,
    role: profile.role,
  });
});
