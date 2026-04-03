import {
  buildPolicyPayload,
  createServiceRoleClient,
  DEMO_POLICY_FIXTURES,
  ensureDemoPolicies,
  getFixtureAccountsMap,
  getFixturePoliciesMap,
  signInAndVerifyAccount,
} from './lib/demo-test-utils.mjs';

const ensure = (condition, message) => {
  if (!condition) throw new Error(message);
};

const runChecks = [];

const recordCheck = async (name, fn) => {
  try {
    await fn();
    runChecks.push({ name, ok: true });
  } catch (error) {
    runChecks.push({
      name,
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

const visibleStatuses = ['active', 'under_review', 'closed'];

const fetchCitizenVisiblePolicies = async (client) => {
  const { data, error } = await client
    .from('policies')
    .select('id, title_no, title_en, status, is_published')
    .eq('is_published', true)
    .in('status', visibleStatuses)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

const main = async () => {
  const serviceRoleClient = createServiceRoleClient();

  const { accounts, policies } = await ensureDemoPolicies(serviceRoleClient);
  const accountsByEmail = getFixtureAccountsMap(accounts);
  const policiesByKey = getFixturePoliciesMap(policies);

  const adminAccount = accountsByEmail['admin@civicus.example.com'];
  const citizenAccounts = [
    accountsByEmail['citizen1@civicus.example.com'],
    accountsByEmail['citizen2@civicus.example.com'],
    accountsByEmail['citizen3@civicus.example.com'],
  ];

  // Engagement data is intentionally NOT reset — all votes, feedback, follows,
  // notifications and views created by this run are preserved for manual review.

  const activePublishedPolicies = policies.filter(
    (policy) => policy.isPublished && policy.status === 'active',
  );
  const citizenVisibleFixtures = policies.filter(
    (policy) => policy.isPublished && visibleStatuses.includes(policy.status),
  );
  const hiddenDraftPolicy = policies.find((policy) => !policy.isPublished && policy.status === 'draft');

  ensure(activePublishedPolicies.length === 2, 'Expected 2 published active fixture policies');
  ensure(citizenVisibleFixtures.length === 3, 'Expected 3 citizen-visible fixture policies');
  ensure(hiddenDraftPolicy, 'Expected one hidden draft fixture policy');

  const adminSession = await signInAndVerifyAccount(adminAccount, serviceRoleClient);
  const citizenSessions = [];

  // ─── 1. AUTH ────────────────────────────────────────────────────────────────
  await recordCheck('auth', async () => {
    ensure(adminSession.profile.role === 'admin', 'Admin account did not resolve to admin');
    for (const account of citizenAccounts) {
      const session = await signInAndVerifyAccount(account, serviceRoleClient);
      citizenSessions.push(session);
      ensure(session.profile.role === 'citizen', `${account.email} did not resolve to citizen`);
    }
  });

  // ─── 2. ADMIN POLICY MANAGEMENT ─────────────────────────────────────────────
  await recordCheck('admin policy management', async () => {
    const { data: adminPolicies, error } = await adminSession.client
      .from('policies')
      .select('id, title_no, status, is_published')
      .in('title_no', policies.map((policy) => policy.title_no));
    if (error) throw error;

    ensure((adminPolicies || []).length === 4, 'Admin policy list does not include all 4 fixtures');

    const { data: dashboardMetrics, error: dashboardError } = await adminSession.client.rpc(
      'get_dashboard_metrics',
      { time_period: '30d' },
    );
    if (dashboardError) throw dashboardError;
    ensure(dashboardMetrics, 'Dashboard metrics did not load');

    const { data: categories, error: categoriesError } = await serviceRoleClient
      .from('categories')
      .select('*');
    const { data: districts, error: districtsError } = await serviceRoleClient
      .from('districts')
      .select('*');
    if (categoriesError) throw categoriesError;
    if (districtsError) throw districtsError;

    const busFixture = policiesByKey['demo-bus-expansion'];
    const busTemplate = DEMO_POLICY_FIXTURES.find((policy) => policy.key === busFixture.key);
    if (!busTemplate) throw new Error('Missing bus demo fixture template');

    const notificationUpdateTitle = `Smoke notification update ${new Date().toISOString()}`;
    const payload = buildPolicyPayload({
      fixture: busTemplate,
      categories: categories || [],
      districts: districts || [],
      existingId: busFixture.id,
      extraUpdates: [
        {
          title: notificationUpdateTitle,
          content: 'Smoke test update to verify follow notifications.',
          update_type: 'info',
        },
      ],
    });

    const { error: upsertError } = await adminSession.client.rpc('admin_upsert_policy_workspace', {
      payload,
    });
    if (upsertError) throw upsertError;

    const { data: busDetail, error: busDetailError } = await adminSession.client
      .from('policies')
      .select('id, policy_topics(*), policy_updates(*), events(*), policy_districts(district_id)')
      .eq('id', busFixture.id)
      .single();
    if (busDetailError) throw busDetailError;

    ensure((busDetail.policy_topics || []).length > 0, 'Fixture topics missing after upsert');
    ensure((busDetail.policy_updates || []).length > 1, 'Fixture updates missing after admin update');
    ensure((busDetail.events || []).length > 0, 'Fixture events missing after upsert');
    ensure((busDetail.policy_districts || []).length > 0, 'Fixture districts missing after upsert');
  });

  // ─── 3. CITIZEN VISIBILITY ──────────────────────────────────────────────────
  await recordCheck('citizen visibility', async () => {
    for (const citizenSession of citizenSessions) {
      const visiblePolicies = await fetchCitizenVisiblePolicies(citizenSession.client);
      const visibleIds = new Set(visiblePolicies.map((policy) => policy.id));

      citizenVisibleFixtures.forEach((fixture) => {
        ensure(
          visibleIds.has(fixture.id),
          `Citizen cannot see expected published fixture ${fixture.title_en}`,
        );
      });

      ensure(
        !visibleIds.has(hiddenDraftPolicy.id),
        'Citizen can see the hidden draft fixture',
      );
    }
  });

  // ─── 4. CITIZEN CANNOT ACCESS DRAFT BY DIRECT ID ────────────────────────────
  await recordCheck('citizen cannot access draft by direct id', async () => {
    const citizenSession = citizenSessions[0];
    const { data: draftRows, error } = await citizenSession.client
      .from('policies')
      .select('id, is_published, status')
      .eq('id', hiddenDraftPolicy.id)
      .eq('is_published', true);
    if (error) throw error;
    ensure(
      (draftRows || []).length === 0,
      'Citizen can fetch draft policy directly by id when filtering on is_published=true',
    );
  });

  // ─── 5. VOTING ──────────────────────────────────────────────────────────────
  await recordCheck('voting', async () => {
    const [districtPolicy, municipalityPolicy] = activePublishedPolicies;

    const votePlan = [
      { session: citizenSessions[0], policyId: districtPolicy.id, sentiment: 'positive' },
      { session: citizenSessions[0], policyId: municipalityPolicy.id, sentiment: 'neutral' },
      { session: citizenSessions[1], policyId: districtPolicy.id, sentiment: 'negative' },
      { session: citizenSessions[1], policyId: municipalityPolicy.id, sentiment: 'positive' },
      { session: citizenSessions[2], policyId: districtPolicy.id, sentiment: 'neutral' },
      { session: citizenSessions[2], policyId: municipalityPolicy.id, sentiment: 'positive' },
    ];

    for (const vote of votePlan) {
      // upsert so re-runs don't fail on the unique (policy_id, user_id) constraint
      const { error } = await vote.session.client.from('sentiment_votes').upsert({
        policy_id: vote.policyId,
        user_id: vote.session.profile.id,
        sentiment: vote.sentiment,
      }, { onConflict: 'policy_id,user_id' });
      if (error) throw error;
    }

    const { data: votes, error: votesError } = await serviceRoleClient
      .from('sentiment_votes')
      .select('policy_id, user_id')
      .in('policy_id', activePublishedPolicies.map((policy) => policy.id))
      .in('user_id', citizenSessions.map((session) => session.profile.id));
    if (votesError) throw votesError;

    ensure((votes || []).length === votePlan.length, 'Vote records do not match the smoke test plan');
  });

  // ─── 6. VOTE UNIQUENESS ENFORCEMENT ─────────────────────────────────────────
  await recordCheck('vote uniqueness enforcement', async () => {
    const targetPolicy = activePublishedPolicies[0];
    const voter = citizenSessions[0];

    // citizen already voted on targetPolicy above — a second insert must fail
    const { error } = await voter.client.from('sentiment_votes').insert({
      policy_id: targetPolicy.id,
      user_id: voter.profile.id,
      sentiment: 'negative',
    });
    ensure(error !== null, 'Duplicate vote was accepted — unique constraint is missing');
  });

  // ─── 7. FEEDBACK ────────────────────────────────────────────────────────────
  await recordCheck('feedback', async () => {
    const feedbackTarget = activePublishedPolicies[0];
    const feedbackAuthor = citizenSessions[0];

    const { error } = await feedbackAuthor.client.from('feedback').insert({
      policy_id: feedbackTarget.id,
      user_id: feedbackAuthor.profile.id,
      content:
        'Smoke test feedback from citizen one to verify comment submission and admin analytics.',
      is_anonymous: false,
      sentiment: 'positive',
    });
    if (error) throw error;

    const { data: feedbackRows, error: feedbackError } = await serviceRoleClient
      .from('feedback')
      .select('id')
      .eq('policy_id', feedbackTarget.id)
      .eq('user_id', feedbackAuthor.profile.id);
    if (feedbackError) throw feedbackError;

    ensure((feedbackRows || []).length > 0, 'Feedback row was not created');
  });

  // ─── 8. ANONYMOUS FEEDBACK ──────────────────────────────────────────────────
  // "Anonymous" in this system means is_anonymous=true with the user's own
  // user_id still stored (for moderation purposes). The RLS policy requires
  // user_id = auth.uid(), so user_id:null is intentionally blocked for
  // authenticated users.
  await recordCheck('anonymous feedback', async () => {
    // demo-bus-expansion has allow_anonymous=true
    const anonTarget = activePublishedPolicies[0];
    const citizen = citizenSessions[1];

    const { error } = await citizen.client.from('feedback').insert({
      policy_id: anonTarget.id,
      user_id: citizen.profile.id,
      content: 'Smoke test anonymous feedback — displayed anonymously but user_id retained for moderation.',
      is_anonymous: true,
      sentiment: 'neutral',
    });
    if (error) throw error;

    const { data: anonRows, error: checkError } = await serviceRoleClient
      .from('feedback')
      .select('id, is_anonymous, user_id')
      .eq('policy_id', anonTarget.id)
      .eq('is_anonymous', true)
      .eq('user_id', citizen.profile.id);
    if (checkError) throw checkError;

    ensure((anonRows || []).length > 0, 'Anonymous (is_anonymous=true) feedback row was not created');
  });

  // ─── 9. FOLLOW AND NOTIFICATIONS ─────────────────────────────────────────────
  // Correct order: follow first, then admin inserts an update — trigger fires
  // only for followers that exist at insert time.
  await recordCheck('follow and notifications', async () => {
    const followTarget = activePublishedPolicies[0]; // demo-bus-expansion
    const follower = citizenSessions[0];

    // Step 1: citizen follows the policy (upsert — safe to re-run)
    const { error: followError } = await follower.client.from('policy_follows').upsert({
      policy_id: followTarget.id,
      user_id: follower.profile.id,
    }, { onConflict: 'policy_id,user_id', ignoreDuplicates: true });
    if (followError) throw followError;

    // Step 2: admin inserts a new policy update → trigger fires → notification created
    const { data: categories } = await serviceRoleClient.from('categories').select('*');
    const { data: districts } = await serviceRoleClient.from('districts').select('*');
    const busFixture = policiesByKey['demo-bus-expansion'];
    const busTemplate = DEMO_POLICY_FIXTURES.find((p) => p.key === busFixture.key);

    const triggerPayload = buildPolicyPayload({
      fixture: busTemplate,
      categories: categories || [],
      districts: districts || [],
      existingId: busFixture.id,
      extraUpdates: [
        {
          title: `Follow notification trigger ${new Date().toISOString()}`,
          content: 'Update inserted after follow to trigger notification delivery.',
          update_type: 'info',
        },
      ],
    });

    const { error: upsertError } = await adminSession.client.rpc('admin_upsert_policy_workspace', {
      payload: triggerPayload,
    });
    if (upsertError) throw upsertError;

    // Step 3: verify follower received at least one notification for this policy
    const { data: notifications, error: notificationsError } = await follower.client
      .from('notifications')
      .select('id, related_policy_id')
      .eq('related_policy_id', followTarget.id);
    if (notificationsError) throw notificationsError;

    ensure((notifications || []).length > 0, 'No follow notifications were generated after policy update');
  });

  // ─── 10. POLICY FOLLOW UNIQUENESS ───────────────────────────────────────────
  await recordCheck('policy follow uniqueness enforcement', async () => {
    const followTarget = activePublishedPolicies[0];
    const follower = citizenSessions[0]; // already followed above

    const { error } = await follower.client.from('policy_follows').insert({
      policy_id: followTarget.id,
      user_id: follower.profile.id,
    });
    ensure(error !== null, 'Duplicate follow was accepted — unique constraint is missing');
  });

  // ─── 11. NOTIFICATIONS: READ AND MARK AS READ ───────────────────────────────
  await recordCheck('notifications: read and mark as read', async () => {
    const follower = citizenSessions[0];
    const followTarget = activePublishedPolicies[0];

    const { data: notifications, error: readError } = await follower.client
      .from('notifications')
      .select('id, is_read, related_policy_id')
      .eq('related_policy_id', followTarget.id)
      .limit(1);
    if (readError) throw readError;
    ensure((notifications || []).length > 0, 'Citizen has no notifications to mark as read');

    const notifId = notifications[0].id;
    const { error: updateError } = await follower.client
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notifId);
    if (updateError) throw updateError;

    const { data: updated, error: verifyError } = await follower.client
      .from('notifications')
      .select('id, is_read')
      .eq('id', notifId)
      .single();
    if (verifyError) throw verifyError;
    ensure(updated.is_read === true, 'Notification was not marked as read');
  });

  // ─── 12. ANALYTICS / DASHBOARD CONSISTENCY ──────────────────────────────────
  await recordCheck('analytics/dashboard consistency', async () => {
    for (const citizenSession of citizenSessions) {
      for (const policy of activePublishedPolicies) {
        const { error } = await citizenSession.client.rpc('track_policy_view', {
          policy_uuid: policy.id,
        });
        if (error) throw error;
      }
    }

    const { data: dashboardMetrics, error: dashboardError } = await adminSession.client.rpc(
      'get_dashboard_metrics',
      { time_period: '30d' },
    );
    if (dashboardError) throw dashboardError;

    const { data: analyticsRows, error: analyticsError } = await adminSession.client.rpc(
      'get_policy_analytics',
      { time_period: '30d' },
    );
    if (analyticsError) throw analyticsError;

    const { count: activePublishedCount, error: countError } = await serviceRoleClient
      .from('policies')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)
      .eq('status', 'active');
    if (countError) throw countError;

    ensure(
      dashboardMetrics.active_policies === activePublishedCount,
      `Dashboard active policy count (${dashboardMetrics.active_policies}) does not match published active policy count (${activePublishedCount})`,
    );
    ensure(
      dashboardMetrics.total_participants === 3,
      `Expected 3 total participants, got ${dashboardMetrics.total_participants}`,
    );

    const activeAnalyticsRows = (analyticsRows || []).filter(
      (row) =>
        row.engaged_users > 0 ||
        row.views_count > 0 ||
        row.votes_count > 0 ||
        row.feedback_count > 0,
    );

    ensure(activeAnalyticsRows.length >= 2, 'Analytics did not record activity for the demo policies');

    const visiblePolicyCount = citizenVisibleFixtures.length;
    ensure(
      activePublishedPolicies.length === 2 && visiblePolicyCount === 3,
      'Fixture visibility expectations are out of sync with the smoke test assumptions',
    );
  });

  // ─── 13. POLICY VIEW DEDUPLICATION ──────────────────────────────────────────
  await recordCheck('policy view deduplication', async () => {
    const targetPolicy = activePublishedPolicies[0];
    const viewer = citizenSessions[0];

    // Call track_policy_view twice for the same user/policy — should result in
    // exactly one row for today (ON CONFLICT DO NOTHING).
    await viewer.client.rpc('track_policy_view', { policy_uuid: targetPolicy.id });
    await viewer.client.rpc('track_policy_view', { policy_uuid: targetPolicy.id });

    const today = new Date().toISOString().slice(0, 10);
    const { data: viewRows, error } = await serviceRoleClient
      .from('policy_views')
      .select('id')
      .eq('policy_id', targetPolicy.id)
      .eq('user_id', viewer.profile.id)
      .eq('viewed_on', today);
    if (error) throw error;

    ensure((viewRows || []).length === 1, `Expected 1 deduplicated view row, got ${(viewRows || []).length}`);
  });

  // ─── 14. POLICY ANALYTICS RPC STRUCTURE ─────────────────────────────────────
  await recordCheck('policy analytics rpc structure', async () => {
    const { data: analyticsRows, error } = await adminSession.client.rpc(
      'get_policy_analytics',
      { time_period: '30d' },
    );
    if (error) throw error;
    ensure(Array.isArray(analyticsRows), 'get_policy_analytics did not return an array');
    ensure(analyticsRows.length > 0, 'get_policy_analytics returned no rows');

    const row = analyticsRows[0];
    // get_policy_analytics returns 'title' (coalesce of title_en/title_no/title)
    const requiredFields = ['policy_id', 'title', 'status', 'is_published', 'views_count', 'votes_count', 'feedback_count', 'engaged_users'];
    for (const field of requiredFields) {
      ensure(field in row, `Analytics row is missing expected field: ${field}`);
    }
  });

  // ─── 15. POLICY ATTACHMENTS READABLE BY CITIZEN ─────────────────────────────
  await recordCheck('policy attachments readable by citizen', async () => {
    // demo-bus-expansion and demo-housing-pilot have fixture attachments
    const busFixture = policiesByKey['demo-bus-expansion'];
    const citizenSession = citizenSessions[0];

    const { data: attachments, error } = await citizenSession.client
      .from('policy_attachments')
      .select('id, file_name, file_path, file_type')
      .eq('policy_id', busFixture.id);
    if (error) throw error;
    ensure((attachments || []).length > 0, 'Citizen cannot read policy attachments for published policy');
  });

  // ─── 16. CITIZEN CANNOT WRITE POLICIES (RLS) ────────────────────────────────
  await recordCheck('citizen cannot write policies (RLS)', async () => {
    const citizen = citizenSessions[0];
    const { data: categories } = await serviceRoleClient.from('categories').select('id').limit(1);
    const { error } = await citizen.client.from('policies').insert({
      title: 'Unauthorized citizen policy',
      title_no: 'Unauthorized citizen policy',
      description: 'Should be blocked by RLS',
      description_no: 'Should be blocked by RLS',
      category_id: categories[0].id,
      status: 'draft',
      scope: 'municipality',
      allow_anonymous: true,
      is_published: false,
    });
    ensure(error !== null, 'Citizen was able to insert into policies — RLS is not enforced');
  });

  // ─── 17. DISTRICTS READABLE BY CITIZENS ─────────────────────────────────────
  await recordCheck('districts readable by citizens', async () => {
    const citizen = citizenSessions[0];
    const { data: districts, error } = await citizen.client
      .from('districts')
      .select('id, name');
    if (error) throw error;
    ensure((districts || []).length > 0, 'Citizens cannot read districts table');
  });

  // ─── 18. PROFILE: READ OWN ───────────────────────────────────────────────────
  await recordCheck('profile: read own', async () => {
    const citizen = citizenSessions[0];
    const { data: profile, error } = await citizen.client
      .from('profiles')
      .select('id, full_name, role, email')
      .eq('id', citizen.profile.id)
      .single();
    if (error) throw error;
    ensure(profile.id === citizen.profile.id, 'Citizen profile id mismatch');
    ensure(profile.role === 'citizen', 'Own profile role is not citizen');
  });

  // ─── 19. PROFILE: UPDATE OWN ─────────────────────────────────────────────────
  await recordCheck('profile: update own', async () => {
    const citizen = citizenSessions[0];
    const originalValue = citizen.profile.email_notifications;
    const newValue = !originalValue;

    const { error: updateError } = await citizen.client
      .from('profiles')
      .update({ email_notifications: newValue })
      .eq('id', citizen.profile.id);
    if (updateError) throw updateError;

    const { data: updated, error: readError } = await citizen.client
      .from('profiles')
      .select('email_notifications')
      .eq('id', citizen.profile.id)
      .single();
    if (readError) throw readError;
    ensure(updated.email_notifications === newValue, 'Profile email_notifications was not updated');

    // restore original value
    await citizen.client
      .from('profiles')
      .update({ email_notifications: originalValue })
      .eq('id', citizen.profile.id);
  });

  // ─── 20. CITIZEN CANNOT UPDATE ANOTHER USER'S PROFILE (RLS) ─────────────────
  // PostgREST silently ignores rows excluded by RLS USING clause — no error is
  // returned, but 0 rows are modified. We verify by reading the victim's profile
  // afterwards and confirming full_name was not changed.
  await recordCheck('citizen cannot update another profile (RLS)', async () => {
    const attacker = citizenSessions[0];
    const victim = citizenSessions[1];
    const originalName = victim.profile.full_name;

    await attacker.client
      .from('profiles')
      .update({ full_name: 'Hacked' })
      .eq('id', victim.profile.id);

    const { data: victimProfile, error: readError } = await serviceRoleClient
      .from('profiles')
      .select('full_name')
      .eq('id', victim.profile.id)
      .single();
    if (readError) throw readError;

    ensure(
      victimProfile.full_name === originalName,
      `RLS not enforced: citizen mutated another user's profile (full_name changed to '${victimProfile.full_name}')`,
    );
  });

  // ─── 21. MAP COMMENTS ────────────────────────────────────────────────────────
  await recordCheck('map comments: insert and read', async () => {
    const citizen = citizenSessions[0];
    const targetPolicy = activePublishedPolicies[0];

    const { data: districts } = await serviceRoleClient.from('districts').select('id').limit(1);
    const districtId = districts?.[0]?.id ?? null;

    const { error: insertError } = await citizen.client.from('map_comments').insert({
      policy_id: targetPolicy.id,
      user_id: citizen.profile.id,
      content: 'Smoke test geo comment',
      latitude: 69.6489,
      longitude: 18.9551,
      district_id: districtId,
    });
    if (insertError) throw insertError;

    const { data: comments, error: readError } = await citizen.client
      .from('map_comments')
      .select('id, content, latitude, longitude')
      .eq('policy_id', targetPolicy.id)
      .eq('user_id', citizen.profile.id);
    if (readError) throw readError;
    ensure((comments || []).length > 0, 'Map comment was not found after insertion');
  });

  // ─── 22. POLICY TAGS READABLE BY CITIZENS ───────────────────────────────────
  await recordCheck('policy tags readable by citizens', async () => {
    const citizen = citizenSessions[0];
    const busFixture = policiesByKey['demo-bus-expansion'];

    const { data: tags, error } = await citizen.client
      .from('policy_tags')
      .select('tag')
      .eq('policy_id', busFixture.id);
    if (error) throw error;
    ensure((tags || []).length > 0, 'Citizen cannot read policy tags for published policy');
  });

  // ─── 23. SETTINGS / CATEGORIES READ PATHS ───────────────────────────────────
  await recordCheck('settings/categories read paths', async () => {
    const { data: appSettings, error: settingsError } = await adminSession.client
      .from('app_settings')
      .select('*')
      .eq('id', 'app-settings')
      .single();
    if (settingsError) throw settingsError;
    ensure(appSettings, 'App settings row is missing');

    const { data: categories, error: categoriesError } = await adminSession.client
      .from('categories')
      .select('*');
    if (categoriesError) throw categoriesError;
    ensure((categories || []).length > 0, 'Categories are missing');
  });

  // ─── CLEANUP ─────────────────────────────────────────────────────────────────
  await adminSession.client.auth.signOut();
  for (const citizenSession of citizenSessions) {
    await citizenSession.client.auth.signOut();
  }

  // ─── RESULTS ─────────────────────────────────────────────────────────────────
  const passed = runChecks.filter((c) => c.ok).length;
  const failed = runChecks.filter((c) => !c.ok).length;

  console.log('\nSmoke test summary');
  console.log('──────────────────────────────────────────────');
  for (const check of runChecks) {
    console.log(`${check.ok ? 'PASS' : 'FAIL'} ${check.name}${check.message ? ` — ${check.message}` : ''}`);
  }
  console.log('──────────────────────────────────────────────');
  console.log(`${passed} passed, ${failed} failed`);

  if (failed > 0) process.exitCode = 1;
};

main().catch((error) => {
  console.error('\nSmoke test runner crashed.');
  console.error(error instanceof Error ? error.message : error);
  for (const check of runChecks) {
    console.log(`${check.ok ? 'PASS' : 'FAIL'} ${check.name}${check.message ? ` — ${check.message}` : ''}`);
  }
  process.exitCode = 1;
});
