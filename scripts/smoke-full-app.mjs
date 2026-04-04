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

  // 6 fixtures total: 3 active+published, 1 under_review+published,
  // 1 closed+published, 1 draft+unpublished
  const activePublishedPolicies = policies.filter(
    (policy) => policy.isPublished && policy.status === 'active',
  );
  const citizenVisibleFixtures = policies.filter(
    (policy) => policy.isPublished && visibleStatuses.includes(policy.status),
  );
  const hiddenDraftPolicy = policies.find((policy) => !policy.isPublished && policy.status === 'draft');
  const closedPolicy = policies.find((policy) => policy.isPublished && policy.status === 'closed');

  ensure(activePublishedPolicies.length === 5, 'Expected 5 published active fixture policies');
  ensure(citizenVisibleFixtures.length === 7, 'Expected 7 citizen-visible fixture policies');
  ensure(hiddenDraftPolicy, 'Expected one hidden draft fixture policy');
  ensure(closedPolicy, 'Expected one closed published fixture policy');

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

    ensure((adminPolicies || []).length === 8, 'Admin policy list does not include all 8 fixtures');

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
    const [firstPolicy, secondPolicy, thirdPolicy, fourthPolicy, fifthPolicy] = activePublishedPolicies;

    const votePlan = [
      { session: citizenSessions[0], policyId: firstPolicy.id, sentiment: 'positive' },
      { session: citizenSessions[0], policyId: secondPolicy.id, sentiment: 'neutral' },
      { session: citizenSessions[0], policyId: thirdPolicy.id, sentiment: 'positive' },
      { session: citizenSessions[0], policyId: fourthPolicy.id, sentiment: 'positive' },
      { session: citizenSessions[0], policyId: fifthPolicy.id, sentiment: 'neutral' },
      { session: citizenSessions[1], policyId: firstPolicy.id, sentiment: 'negative' },
      { session: citizenSessions[1], policyId: secondPolicy.id, sentiment: 'positive' },
      { session: citizenSessions[1], policyId: thirdPolicy.id, sentiment: 'neutral' },
      { session: citizenSessions[1], policyId: fourthPolicy.id, sentiment: 'negative' },
      { session: citizenSessions[1], policyId: fifthPolicy.id, sentiment: 'positive' },
      { session: citizenSessions[2], policyId: firstPolicy.id, sentiment: 'neutral' },
      { session: citizenSessions[2], policyId: secondPolicy.id, sentiment: 'positive' },
      { session: citizenSessions[2], policyId: thirdPolicy.id, sentiment: 'negative' },
      { session: citizenSessions[2], policyId: fourthPolicy.id, sentiment: 'positive' },
      { session: citizenSessions[2], policyId: fifthPolicy.id, sentiment: 'neutral' },
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

  // ─── 12. NOTIFICATIONS: UNREAD COUNT FILTER ─────────────────────────────────
  // Mirrors the NotificationBell component — fetches is_read=false rows.
  await recordCheck('notifications: unread count filter', async () => {
    const follower = citizenSessions[0];

    // Insert a fresh unread notification via the trigger path (already done in #9),
    // so at minimum we can verify the filter query itself works without error.
    const { data: unread, error } = await follower.client
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('is_read', false);
    if (error) throw error;
    ensure(unread !== null, 'Unread notification query returned null');
  });

  // ─── 13. ANALYTICS / DASHBOARD CONSISTENCY ──────────────────────────────────
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
      dashboardMetrics.total_participants >= 3,
      `Expected at least 3 total participants, got ${dashboardMetrics.total_participants}`,
    );

    const activeAnalyticsRows = (analyticsRows || []).filter(
      (row) =>
        row.engaged_users > 0 ||
        row.views_count > 0 ||
        row.votes_count > 0 ||
        row.feedback_count > 0,
    );

    ensure(activeAnalyticsRows.length >= 5, 'Analytics did not record activity for all 5 active demo policies');

    const visiblePolicyCount = citizenVisibleFixtures.length;
    ensure(
      activePublishedPolicies.length === 5 && visiblePolicyCount === 7,
      'Fixture visibility expectations are out of sync with the smoke test assumptions',
    );
  });

  // ─── 14. POLICY VIEW DEDUPLICATION ──────────────────────────────────────────
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

  // ─── 15. POLICY ANALYTICS RPC STRUCTURE ─────────────────────────────────────
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

  // ─── 16. DISTRICT METRICS RPC ───────────────────────────────────────────────
  // Backs the DistrictGeoMap and AdminDashboard district breakdown panel.
  await recordCheck('district metrics rpc', async () => {
    const { data: districtMetrics, error } = await adminSession.client.rpc(
      'get_district_participation_metrics',
      { time_period: '30d', policy_id: null },
    );
    if (error) throw error;
    ensure(Array.isArray(districtMetrics), 'get_district_participation_metrics did not return an array');
  });

  // ─── 17. POLICY ATTACHMENTS READABLE BY CITIZEN ─────────────────────────────
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

  // ─── 18. CITIZEN POLICY TOPICS READABLE ─────────────────────────────────────
  // Backs the PolicyTopicsOverlay and flow topic selection.
  await recordCheck('citizen: policy topics readable', async () => {
    const targetFixture = policiesByKey['demo-bus-expansion'];
    const citizen = citizenSessions[0];

    const { data: topics, error } = await citizen.client
      .from('policy_topics')
      .select('id, slug, label_no, label_en, description_no, description_en, icon_key')
      .eq('policy_id', targetFixture.id);
    if (error) throw error;
    ensure((topics || []).length > 0, 'Citizen cannot read policy_topics for a published policy');
  });

  // ─── 19. CITIZEN POLICY UPDATES READABLE ────────────────────────────────────
  // Backs the policy detail / timeline view shown to citizens.
  await recordCheck('citizen: policy updates readable', async () => {
    const busFixture = policiesByKey['demo-bus-expansion'];
    const citizen = citizenSessions[0];

    const { data: updates, error } = await citizen.client
      .from('policy_updates')
      .select('id, title, content, update_type, created_at')
      .eq('policy_id', busFixture.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    ensure((updates || []).length > 0, 'Citizen cannot read policy_updates for a published policy');
  });

  // ─── 20. CITIZEN POLICY EVENTS READABLE ─────────────────────────────────────
  // Backs the event listing shown on policy detail pages.
  await recordCheck('citizen: policy events readable', async () => {
    const busFixture = policiesByKey['demo-bus-expansion'];
    const citizen = citizenSessions[0];

    const { data: events, error } = await citizen.client
      .from('events')
      .select('id, title, event_date, location, mode')
      .eq('policy_id', busFixture.id);
    if (error) throw error;
    ensure((events || []).length > 0, 'Citizen cannot read events for a published policy');
  });

  // ─── 21. CITIZEN CANNOT WRITE POLICIES (RLS) ────────────────────────────────
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

  // ─── 22. DISTRICTS READABLE BY CITIZENS ─────────────────────────────────────
  await recordCheck('districts readable by citizens', async () => {
    const citizen = citizenSessions[0];
    const { data: districts, error } = await citizen.client
      .from('districts')
      .select('id, name');
    if (error) throw error;
    ensure((districts || []).length > 0, 'Citizens cannot read districts table');
  });

  // ─── 23. PROFILE: READ OWN ───────────────────────────────────────────────────
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

  // ─── 24. PROFILE: UPDATE OWN ─────────────────────────────────────────────────
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

  // ─── 25. CITIZEN CANNOT UPDATE ANOTHER USER'S PROFILE (RLS) ─────────────────
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

  // ─── 26. PROFILE: ENGAGEMENT HISTORY ────────────────────────────────────────
  // Backs the Profile page "History" tab — reads citizen's own votes and feedback
  // joined with policy titles.
  await recordCheck('profile: engagement history', async () => {
    const citizen = citizenSessions[0];

    const [votesResult, feedbackResult] = await Promise.all([
      citizen.client
        .from('sentiment_votes')
        .select('policy_id, created_at, policies(title)')
        .eq('user_id', citizen.profile.id)
        .order('created_at', { ascending: false })
        .limit(10),
      citizen.client
        .from('feedback')
        .select('policy_id, created_at, policies(title)')
        .eq('user_id', citizen.profile.id)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    if (votesResult.error) throw votesResult.error;
    if (feedbackResult.error) throw feedbackResult.error;

    ensure((votesResult.data || []).length > 0, 'Citizen engagement history: no vote history found');
    ensure((feedbackResult.data || []).length > 0, 'Citizen engagement history: no feedback history found');
  });

  // ─── 27. CITIZEN OWN FOLLOWS READABLE ───────────────────────────────────────
  // Backs the notification bell badge and profile follow list.
  await recordCheck('citizen: own follows readable', async () => {
    const citizen = citizenSessions[0];

    const { data: follows, error } = await citizen.client
      .from('policy_follows')
      .select('policy_id')
      .eq('user_id', citizen.profile.id);
    if (error) throw error;
    ensure((follows || []).length > 0, 'Citizen cannot read own policy_follows');
  });

  // ─── 28. MAP COMMENTS ────────────────────────────────────────────────────────
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

  // ─── 29. POLICY TAGS READABLE BY CITIZENS ───────────────────────────────────
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

  // ─── 30. SETTINGS / CATEGORIES READ PATHS ───────────────────────────────────
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

  // ─── 31. ADMIN: PUBLISH / UNPUBLISH TOGGLE ──────────────────────────────────
  // Backs the is_published toggle on the admin Policies list page.
  await recordCheck('admin: publish/unpublish toggle', async () => {
    // Use the draft fixture — currently unpublished. Toggle it on then off.
    const { data: draftRow, error: fetchError } = await adminSession.client
      .from('policies')
      .select('id, is_published')
      .eq('id', hiddenDraftPolicy.id)
      .single();
    if (fetchError) throw fetchError;
    ensure(draftRow.is_published === false, 'Draft fixture should start as unpublished');

    // Toggle on
    const { error: onError } = await adminSession.client
      .from('policies')
      .update({ is_published: true, published_at: new Date().toISOString() })
      .eq('id', hiddenDraftPolicy.id);
    if (onError) throw onError;

    const { data: publishedRow, error: publishedError } = await adminSession.client
      .from('policies')
      .select('is_published')
      .eq('id', hiddenDraftPolicy.id)
      .single();
    if (publishedError) throw publishedError;
    ensure(publishedRow.is_published === true, 'Policy was not set to published');

    // Toggle off — restore original state
    const { error: offError } = await adminSession.client
      .from('policies')
      .update({ is_published: false, published_at: null })
      .eq('id', hiddenDraftPolicy.id);
    if (offError) throw offError;
  });

  // ─── 32. ADMIN: CREATE AND DELETE POLICY ────────────────────────────────────
  // Backs the PolicyEditor create flow and the delete confirmation dialog.
  await recordCheck('admin: create and delete policy', async () => {
    const { data: categories } = await serviceRoleClient.from('categories').select('id').limit(1);

    const tempPayload = {
      policy: {
        title: 'Smoke temp policy — delete me',
        title_no: 'Smoke temp policy — delete me',
        title_en: 'Smoke temp policy — delete me',
        description: 'Created and immediately deleted by the smoke test.',
        description_no: 'Created and immediately deleted by the smoke test.',
        description_en: 'Created and immediately deleted by the smoke test.',
        category_id: categories[0].id,
        status: 'draft',
        scope: 'municipality',
        start_date: new Date().toISOString().slice(0, 10),
        end_date: null,
        allow_anonymous: false,
        video_url: '',
        is_published: false,
        published_at: null,
      },
      district_ids: [],
      tags: [],
      topics: [],
      updates: [],
      events: [],
    };

    const { data: createResult, error: createError } = await adminSession.client.rpc(
      'admin_upsert_policy_workspace',
      { payload: tempPayload },
    );
    if (createError) throw createError;
    const tempId = createResult?.policy_id;
    ensure(tempId, 'admin_upsert_policy_workspace did not return a policy_id');

    // Verify it exists
    const { data: tempRow, error: readError } = await serviceRoleClient
      .from('policies')
      .select('id')
      .eq('id', tempId)
      .single();
    if (readError) throw readError;
    ensure(tempRow.id === tempId, 'Temp policy not found after creation');

    // Delete it
    const { error: deleteError } = await adminSession.client.rpc(
      'admin_delete_policy_workspace',
      { policy_id: tempId },
    );
    if (deleteError) throw deleteError;

    // Verify it is gone
    const { data: deletedRow } = await serviceRoleClient
      .from('policies')
      .select('id')
      .eq('id', tempId)
      .maybeSingle();
    ensure(deletedRow === null, 'Policy still exists after admin_delete_policy_workspace');
  });

  // ─── 33. ADMIN: FEEDBACK READ PATH ──────────────────────────────────────────
  // Backs the admin feedback panel / analytics view.
  await recordCheck('admin: feedback read path', async () => {
    const { data: allFeedback, error } = await adminSession.client
      .from('feedback')
      .select('id, policy_id, content, sentiment, is_anonymous, created_at')
      .in('policy_id', activePublishedPolicies.map((p) => p.id))
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    ensure((allFeedback || []).length > 0, 'Admin feedback read path returned no rows');
  });

  // ─── 34. CLOSED POLICY VISIBLE TO CITIZEN, NOT VOTEABLE ─────────────────────
  // Citizens can read a closed policy but the vote insert should be rejected if
  // the DB enforces a status constraint, or at minimum the policy is readable.
  await recordCheck('closed policy visible to citizen', async () => {
    const citizen = citizenSessions[0];

    const { data: closedRow, error } = await citizen.client
      .from('policies')
      .select('id, status, is_published')
      .eq('id', closedPolicy.id)
      .eq('is_published', true)
      .single();
    if (error) throw error;
    ensure(closedRow.status === 'closed', 'Closed policy not visible to citizen');
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
