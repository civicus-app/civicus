import {
  badRequest,
  corsHeaders,
  createAdminClient,
  getJwtClaims,
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

  const { data: profile } = await userClient
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single();

  if (!profile) return badRequest('Profile not found', 404);

  const adminClient = createAdminClient();
  await adminClient.from('verified_sessions').upsert(
    {
      user_id: user.id,
      session_id: sessionId,
      role: profile.role,
      source: 'otp',
      expires_at: new Date(exp * 1000).toISOString(),
    },
    { onConflict: 'session_id' }
  );

  return json(200, {
    verified: true,
    role: profile.role,
  });
});
