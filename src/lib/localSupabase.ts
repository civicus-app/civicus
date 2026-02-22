import type {
  Category,
  DashboardMetrics,
  EngagementAnalytics,
  Feedback,
  Notification,
  Policy,
  PolicyAttachment,
  PolicyTag,
  SentimentType,
  SentimentVote,
} from '../types/policy.types';
import type { District, Profile } from '../types/user.types';

type Role = 'citizen' | 'admin' | 'super_admin';

interface LocalAuthUser {
  id: string;
  email: string;
  password: string;
  full_name: string;
  role: Role;
  created_at: string;
}

interface LocalPolicyDistrict {
  policy_id: string;
  district_id: string;
}

interface LocalPolicyView {
  id: string;
  policy_id: string;
  user_id: string;
  viewed_at: string;
}

interface LocalState {
  auth_users: LocalAuthUser[];
  profiles: Profile[];
  districts: District[];
  categories: Category[];
  policies: Policy[];
  policy_districts: LocalPolicyDistrict[];
  policy_tags: PolicyTag[];
  policy_attachments: PolicyAttachment[];
  sentiment_votes: SentimentVote[];
  feedback: Feedback[];
  policy_views: LocalPolicyView[];
  notifications: Notification[];
}

type AuthEvent = 'INITIAL_SESSION' | 'SIGNED_IN' | 'SIGNED_OUT' | 'USER_UPDATED';
type AuthCallback = (event: AuthEvent, session: any) => void;
type QueryResult<T = any> = { data: T; error: any; count?: number | null };

const DB_STORAGE_KEY = 'civicus.local.db.v1';
const SESSION_STORAGE_KEY = 'civicus.local.session.user_id.v1';

const authListeners = new Set<AuthCallback>();
const activeChannels = new Set<LocalChannel>();

let inMemoryState: LocalState | null = null;
let inMemorySessionUserId: string | null = null;

const SENTIMENT_SCORE: Record<SentimentType, number> = {
  positive: 5,
  neutral: 3,
  negative: 1,
};

const nowIso = () => new Date().toISOString();
const todayIsoDate = () => new Date().toISOString().slice(0, 10);

const makeId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
};

const deepClone = <T>(value: T): T => {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
};

const createSeedState = (): LocalState => {
  const now = nowIso();

  const adminId = makeId();
  const citizenId = makeId();
  const citizen2Id = makeId();

  const districts: District[] = [
    { id: makeId(), name: 'Tromsoya', municipality: 'Tromso', geojson: undefined, population: 41000, created_at: now, updated_at: now },
    { id: makeId(), name: 'Fastlandet', municipality: 'Tromso', geojson: undefined, population: 14000, created_at: now, updated_at: now },
    { id: makeId(), name: 'Kvaloya', municipality: 'Tromso', geojson: undefined, population: 10000, created_at: now, updated_at: now },
    { id: makeId(), name: 'Hakoya', municipality: 'Tromso', geojson: undefined, population: 400, created_at: now, updated_at: now },
  ];

  const categories: Category[] = [
    { id: makeId(), name: 'Housing', description: 'Housing development and policies', color: '#3B82F6', created_at: now },
    { id: makeId(), name: 'Transportation', description: 'Public transport and mobility', color: '#10B981', created_at: now },
    { id: makeId(), name: 'Environment', description: 'Environmental and climate policies', color: '#22C55E', created_at: now },
    { id: makeId(), name: 'Education', description: 'Schools and educational initiatives', color: '#F59E0B', created_at: now },
    { id: makeId(), name: 'Healthcare', description: 'Public health services', color: '#EF4444', created_at: now },
    { id: makeId(), name: 'Culture', description: 'Cultural programs and facilities', color: '#8B5CF6', created_at: now },
    { id: makeId(), name: 'Other', description: 'General municipal matters', color: '#6B7280', created_at: now },
  ];

  const categoryByName = (name: string) => categories.find((category) => category.name === name)!;
  const districtByName = (name: string) => districts.find((district) => district.name === name)!;

  const policies: Policy[] = [
    {
      id: makeId(),
      title: 'Expand Public Bus Routes in Outer Districts',
      description:
        'This proposal introduces expanded evening and weekend bus routes across Fastlandet and Kvaloya to improve accessibility for students, workers, and seniors.',
      category_id: categoryByName('Transportation').id,
      status: 'active',
      scope: 'district',
      start_date: '2026-01-20',
      end_date: '2026-03-20',
      allow_anonymous: true,
      video_url: '',
      created_by: adminId,
      created_at: now,
      updated_at: now,
    },
    {
      id: makeId(),
      title: 'Affordable Youth Housing Development Program',
      description:
        'The municipality is considering a mixed-income housing initiative focused on citizens aged 18-35. Feedback is requested on rent ceilings and location priorities.',
      category_id: categoryByName('Housing').id,
      status: 'active',
      scope: 'municipality',
      start_date: '2026-01-10',
      end_date: '2026-03-10',
      allow_anonymous: true,
      video_url: '',
      created_by: adminId,
      created_at: now,
      updated_at: now,
    },
    {
      id: makeId(),
      title: 'City Center Low-Emission Zone',
      description:
        'Introduce a phased low-emission zone in central Tromso to reduce air pollution and traffic noise. Citizens can comment on timing and implementation approach.',
      category_id: categoryByName('Environment').id,
      status: 'under_review',
      scope: 'municipality',
      start_date: '2025-12-01',
      end_date: '2026-02-01',
      allow_anonymous: false,
      video_url: '',
      created_by: adminId,
      created_at: now,
      updated_at: now,
    },
    {
      id: makeId(),
      title: 'School Digital Learning Expansion',
      description:
        'Pilot investment in digital learning tools and teacher training for upper-secondary schools. Public feedback was collected during the consultation window.',
      category_id: categoryByName('Education').id,
      status: 'closed',
      scope: 'municipality',
      start_date: '2025-10-01',
      end_date: '2025-12-01',
      allow_anonymous: true,
      video_url: '',
      created_by: adminId,
      created_at: now,
      updated_at: now,
    },
    {
      id: makeId(),
      title: 'Neighborhood Cultural Hubs Funding',
      description:
        'Draft proposal for decentralized cultural hub grants. Intended to increase community-led programs across districts.',
      category_id: categoryByName('Culture').id,
      status: 'draft',
      scope: 'district',
      start_date: '2026-02-15',
      end_date: '2026-04-15',
      allow_anonymous: true,
      video_url: '',
      created_by: adminId,
      created_at: now,
      updated_at: now,
    },
  ];

  const policyByTitle = (title: string) => policies.find((policy) => policy.title === title)!;

  const policy_tags: PolicyTag[] = [
    { id: makeId(), policy_id: policyByTitle('Expand Public Bus Routes in Outer Districts').id, tag: 'public transport', created_at: now },
    { id: makeId(), policy_id: policyByTitle('Expand Public Bus Routes in Outer Districts').id, tag: 'mobility', created_at: now },
    { id: makeId(), policy_id: policyByTitle('Affordable Youth Housing Development Program').id, tag: 'youth', created_at: now },
    { id: makeId(), policy_id: policyByTitle('Affordable Youth Housing Development Program').id, tag: 'affordability', created_at: now },
    { id: makeId(), policy_id: policyByTitle('City Center Low-Emission Zone').id, tag: 'emissions', created_at: now },
  ];

  const policy_districts: LocalPolicyDistrict[] = [
    { policy_id: policyByTitle('Expand Public Bus Routes in Outer Districts').id, district_id: districtByName('Fastlandet').id },
    { policy_id: policyByTitle('Expand Public Bus Routes in Outer Districts').id, district_id: districtByName('Kvaloya').id },
    { policy_id: policyByTitle('Neighborhood Cultural Hubs Funding').id, district_id: districtByName('Tromsoya').id },
  ];

  const profiles: Profile[] = [
    {
      id: adminId,
      email: 'admin@civicus.local',
      full_name: 'Civicus Admin',
      role: 'admin',
      district_id: districtByName('Tromsoya').id,
      date_of_birth: '1988-06-12',
      avatar_url: '',
      email_notifications: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: citizenId,
      email: 'citizen@civicus.local',
      full_name: 'Alex Hansen',
      role: 'citizen',
      district_id: districtByName('Fastlandet').id,
      date_of_birth: '1999-04-03',
      avatar_url: '',
      email_notifications: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: citizen2Id,
      email: 'resident@civicus.local',
      full_name: 'Mina Olsen',
      role: 'citizen',
      district_id: districtByName('Kvaloya').id,
      date_of_birth: '1984-11-19',
      avatar_url: '',
      email_notifications: true,
      created_at: now,
      updated_at: now,
    },
  ];

  const auth_users: LocalAuthUser[] = [
    {
      id: adminId,
      email: 'admin@civicus.local',
      password: 'admin12345',
      full_name: 'Civicus Admin',
      role: 'admin',
      created_at: now,
    },
    {
      id: citizenId,
      email: 'citizen@civicus.local',
      password: 'citizen12345',
      full_name: 'Alex Hansen',
      role: 'citizen',
      created_at: now,
    },
    {
      id: citizen2Id,
      email: 'resident@civicus.local',
      password: 'resident12345',
      full_name: 'Mina Olsen',
      role: 'citizen',
      created_at: now,
    },
  ];

  const sentiment_votes: SentimentVote[] = [
    {
      id: makeId(),
      policy_id: policyByTitle('Expand Public Bus Routes in Outer Districts').id,
      user_id: citizenId,
      sentiment: 'positive',
      created_at: now,
      updated_at: now,
    },
    {
      id: makeId(),
      policy_id: policyByTitle('Expand Public Bus Routes in Outer Districts').id,
      user_id: citizen2Id,
      sentiment: 'neutral',
      created_at: now,
      updated_at: now,
    },
    {
      id: makeId(),
      policy_id: policyByTitle('Affordable Youth Housing Development Program').id,
      user_id: citizenId,
      sentiment: 'positive',
      created_at: now,
      updated_at: now,
    },
    {
      id: makeId(),
      policy_id: policyByTitle('City Center Low-Emission Zone').id,
      user_id: citizen2Id,
      sentiment: 'negative',
      created_at: now,
      updated_at: now,
    },
  ];

  const feedback: Feedback[] = [
    {
      id: makeId(),
      policy_id: policyByTitle('Expand Public Bus Routes in Outer Districts').id,
      user_id: citizenId,
      content: 'I strongly support this, especially for evening routes after work hours.',
      is_anonymous: false,
      sentiment: 'positive',
      created_at: now,
      updated_at: now,
    },
    {
      id: makeId(),
      policy_id: policyByTitle('Affordable Youth Housing Development Program').id,
      user_id: citizen2Id,
      content: 'Please prioritize locations near universities and healthcare services.',
      is_anonymous: true,
      sentiment: 'neutral',
      created_at: now,
      updated_at: now,
    },
  ];

  const policy_views: LocalPolicyView[] = [
    { id: makeId(), policy_id: policyByTitle('Expand Public Bus Routes in Outer Districts').id, user_id: citizenId, viewed_at: now },
    { id: makeId(), policy_id: policyByTitle('Expand Public Bus Routes in Outer Districts').id, user_id: citizen2Id, viewed_at: now },
    { id: makeId(), policy_id: policyByTitle('Affordable Youth Housing Development Program').id, user_id: citizenId, viewed_at: now },
    { id: makeId(), policy_id: policyByTitle('City Center Low-Emission Zone').id, user_id: citizen2Id, viewed_at: now },
  ];

  const notifications: Notification[] = [
    {
      id: makeId(),
      user_id: citizenId,
      title: 'Policy update',
      message: 'Bus route proposal has new timetable details.',
      type: 'policy_update',
      related_policy_id: policyByTitle('Expand Public Bus Routes in Outer Districts').id,
      is_read: false,
      created_at: now,
    },
    {
      id: makeId(),
      user_id: citizenId,
      title: 'Closing soon',
      message: 'Youth housing feedback closes in 5 days.',
      type: 'deadline',
      related_policy_id: policyByTitle('Affordable Youth Housing Development Program').id,
      is_read: false,
      created_at: now,
    },
  ];

  return {
    auth_users,
    profiles,
    districts,
    categories,
    policies,
    policy_districts,
    policy_tags,
    policy_attachments: [],
    sentiment_votes,
    feedback,
    policy_views,
    notifications,
  };
};

const hasLocalStorage = () => typeof window !== 'undefined' && !!window.localStorage;

const loadState = (): LocalState => {
  if (inMemoryState) return inMemoryState;

  if (!hasLocalStorage()) {
    inMemoryState = createSeedState();
    return inMemoryState;
  }

  const raw = window.localStorage.getItem(DB_STORAGE_KEY);
  if (!raw) {
    inMemoryState = createSeedState();
    window.localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(inMemoryState));
    return inMemoryState;
  }

  try {
    const parsed = JSON.parse(raw) as LocalState;
    inMemoryState = parsed;
    return parsed;
  } catch {
    inMemoryState = createSeedState();
    window.localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(inMemoryState));
    return inMemoryState;
  }
};

const saveState = (state: LocalState) => {
  inMemoryState = state;
  if (hasLocalStorage()) {
    window.localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(state));
  }
};

const loadSessionUserId = (): string | null => {
  if (inMemorySessionUserId !== null) return inMemorySessionUserId;
  if (!hasLocalStorage()) return null;
  inMemorySessionUserId = window.localStorage.getItem(SESSION_STORAGE_KEY);
  return inMemorySessionUserId;
};

const saveSessionUserId = (userId: string | null) => {
  inMemorySessionUserId = userId;
  if (!hasLocalStorage()) return;
  if (userId) {
    window.localStorage.setItem(SESSION_STORAGE_KEY, userId);
  } else {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  }
};

const getAuthUserById = (state: LocalState, userId?: string | null) => {
  if (!userId) return null;
  return state.auth_users.find((user) => user.id === userId) || null;
};

const toAuthSession = (authUser: LocalAuthUser | null) => {
  if (!authUser) return null;
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  return {
    access_token: `local-token-${authUser.id}`,
    refresh_token: `local-refresh-${authUser.id}`,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: expiresAt,
    user: {
      id: authUser.id,
      email: authUser.email,
      created_at: authUser.created_at,
      user_metadata: { full_name: authUser.full_name },
      app_metadata: { provider: 'email' },
      aud: 'authenticated',
      role: 'authenticated',
    },
  };
};

const emitAuth = (event: AuthEvent, session: any) => {
  authListeners.forEach((callback) => callback(event, session));
};

const parseRelativeDays = (timePeriod: string) => {
  if (timePeriod === '7d') return 7;
  if (timePeriod === '90d') return 90;
  return 30;
};

const isInsideWindow = (dateValue: string, days: number) => {
  const date = new Date(dateValue).getTime();
  const windowStart = Date.now() - days * 24 * 60 * 60 * 1000;
  return date >= windowStart;
};

const computeEngagementAnalytics = (state: LocalState): EngagementAnalytics[] => {
  return state.policies
    .filter((policy) => policy.status !== 'draft')
    .map((policy) => {
      const votes = state.sentiment_votes.filter((vote) => vote.policy_id === policy.id);
      const feedback = state.feedback.filter((item) => item.policy_id === policy.id);
      const views = state.policy_views.filter((view) => view.policy_id === policy.id);

      const votesUsers = new Set(votes.map((vote) => vote.user_id));
      const feedbackUsers = new Set(feedback.map((item) => item.user_id).filter(Boolean) as string[]);
      const viewUsers = new Set(views.map((view) => view.user_id));
      const engagedUsers = new Set<string>([...votesUsers, ...feedbackUsers]);

      const sentimentScores = votes.map((vote) => SENTIMENT_SCORE[vote.sentiment]);
      const avgSentimentScore = sentimentScores.length
        ? Number((sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length).toFixed(1))
        : 0;

      return {
        policy_id: policy.id,
        title: policy.title,
        status: policy.status,
        views_count: viewUsers.size,
        votes_count: votesUsers.size,
        feedback_count: feedbackUsers.size,
        engaged_users: engagedUsers.size,
        avg_sentiment_score: avgSentimentScore,
        positive_count: votes.filter((vote) => vote.sentiment === 'positive').length,
        neutral_count: votes.filter((vote) => vote.sentiment === 'neutral').length,
        negative_count: votes.filter((vote) => vote.sentiment === 'negative').length,
      };
    });
};

const computeDashboardMetrics = (state: LocalState, timePeriod = '30d'): DashboardMetrics => {
  const days = parseRelativeDays(timePeriod);

  const votesWindow = state.sentiment_votes.filter((vote) => isInsideWindow(vote.created_at, days));
  const feedbackWindow = state.feedback.filter((item) => isInsideWindow(item.created_at, days));
  const viewsWindow = state.policy_views.filter((view) => isInsideWindow(view.viewed_at, days));

  const participantIds = new Set<string>([
    ...votesWindow.map((vote) => vote.user_id),
    ...feedbackWindow.map((item) => item.user_id).filter(Boolean) as string[],
  ]);
  const viewedIds = new Set<string>(viewsWindow.map((view) => view.user_id));
  const interactedIds = participantIds;
  const feedbackIds = new Set<string>(feedbackWindow.map((item) => item.user_id).filter(Boolean) as string[]);
  const voteIds = new Set<string>(votesWindow.map((vote) => vote.user_id));

  const participantsProfiles = state.profiles.filter((profile) => participantIds.has(profile.id));
  const youthCount = participantsProfiles.filter((profile) => {
    if (!profile.date_of_birth) return false;
    const ageYears = Math.floor(
      (Date.now() - new Date(profile.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );
    return ageYears >= 18 && ageYears <= 35;
  }).length;

  const avgSentimentScore = votesWindow.length
    ? Number(
        (
          votesWindow.reduce((sum, vote) => sum + SENTIMENT_SCORE[vote.sentiment], 0) /
          votesWindow.length
        ).toFixed(1)
      )
    : 0;

  const topIssueMap = new Map<string, number>();
  votesWindow.forEach((vote) => {
    topIssueMap.set(vote.policy_id, (topIssueMap.get(vote.policy_id) || 0) + 1);
  });
  const topIssueId = [...topIssueMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const topIssueTitle = state.policies.find((policy) => policy.id === topIssueId)?.title || 'N/A';

  return {
    active_policies: state.policies.filter((policy) => policy.status === 'active').length,
    total_participants: participantIds.size,
    engagement_rate: viewedIds.size
      ? Number(((interactedIds.size / viewedIds.size) * 100).toFixed(2))
      : 0,
    youth_participation: participantIds.size
      ? Number(((youthCount / participantIds.size) * 100).toFixed(2))
      : 0,
    avg_sentiment_score: avgSentimentScore,
    top_issue: topIssueTitle,
    funnel_data: {
      viewed: viewedIds.size,
      interacted: interactedIds.size,
      feedback_given: feedbackIds.size,
      votes_cast: voteIds.size,
    },
    sentiment_distribution: {
      positive: votesWindow.filter((vote) => vote.sentiment === 'positive').length,
      neutral: votesWindow.filter((vote) => vote.sentiment === 'neutral').length,
      negative: votesWindow.filter((vote) => vote.sentiment === 'negative').length,
    },
  };
};

const parseFilter = (filter?: string) => {
  if (!filter) return null;
  const [column, operator, rawValue] = filter.split('=');
  if (!column || operator !== 'eq' || rawValue === undefined) return null;
  return { column, rawValue };
};

class LocalChannel {
  private handlers: Array<{
    event: string;
    table?: string;
    filter?: string;
    callback: (payload: any) => void;
  }> = [];

  constructor(public readonly name: string) {}

  on(
    _kind: 'postgres_changes',
    spec: { event: string; table?: string; filter?: string },
    callback: (payload: any) => void
  ) {
    this.handlers.push({
      event: spec.event,
      table: spec.table,
      filter: spec.filter,
      callback,
    });
    return this;
  }

  subscribe() {
    activeChannels.add(this);
    return this;
  }

  unsubscribe() {
    activeChannels.delete(this);
  }

  emit(event: string, table: string, row: any) {
    this.handlers.forEach((handler) => {
      if (handler.event !== event) return;
      if (handler.table && handler.table !== table) return;
      const parsed = parseFilter(handler.filter);
      if (parsed && String((row as any)[parsed.column]) !== parsed.rawValue) return;
      handler.callback({ new: deepClone(row) });
    });
  }
}

const broadcastInsert = (table: string, row: any) => {
  activeChannels.forEach((channel) => channel.emit('INSERT', table, row));
};

type BuilderMode = 'select' | 'update' | 'delete';

class LocalQueryBuilder implements PromiseLike<QueryResult<any>> {
  private mode: BuilderMode = 'select';
  private selectClause = '*';
  private includeCount = false;
  private filters: Array<(row: any) => boolean> = [];
  private orderBy: { column: string; ascending: boolean } | null = null;
  private rangeBy: { from: number; to: number } | null = null;
  private limitBy: number | null = null;
  private singleRow = false;
  private updatePatch: any = null;

  constructor(private readonly table: string) {}

  select(columns = '*', options?: { count?: 'exact' | 'planned' | 'estimated' }) {
    this.mode = 'select';
    this.selectClause = columns;
    this.includeCount = options?.count === 'exact';
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((row) => row?.[column] === value);
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push((row) => values.includes(row?.[column]));
    return this;
  }

  ilike(column: string, pattern: string) {
    const needle = pattern.toLowerCase().replace(/%/g, '');
    this.filters.push((row) => String(row?.[column] || '').toLowerCase().includes(needle));
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: options?.ascending !== false };
    return this;
  }

  range(from: number, to: number) {
    this.rangeBy = { from, to };
    return this;
  }

  limit(limit: number) {
    this.limitBy = limit;
    return this;
  }

  single() {
    this.singleRow = true;
    return this;
  }

  update(values: any) {
    this.mode = 'update';
    this.updatePatch = deepClone(values);
    return this;
  }

  delete() {
    this.mode = 'delete';
    return this;
  }

  async insert(values: any | any[]): Promise<QueryResult<any>> {
    const rows = Array.isArray(values) ? values : [values];
    const state = deepClone(loadState());
    const tableRows = getTableRows(state, this.table);
    if (!tableRows) {
      return { data: null, error: { message: `Unknown table ${this.table}` } };
    }

    const inserted = rows.map((value) => createInsertRow(this.table, value));

    if (this.table === 'sentiment_votes') {
      inserted.forEach((row) => {
        const idx = tableRows.findIndex(
          (vote: SentimentVote) =>
            vote.policy_id === row.policy_id && vote.user_id === row.user_id
        );
        if (idx >= 0) {
          tableRows[idx] = { ...tableRows[idx], ...row, updated_at: nowIso() };
        } else {
          tableRows.push(row);
        }
      });
    } else {
      inserted.forEach((row) => tableRows.push(row));
    }

    saveState(state);

    if (this.table === 'notifications') {
      inserted.forEach((row) => broadcastInsert(this.table, row));
    }

    return {
      data: Array.isArray(values) ? inserted : inserted[0],
      error: null,
    };
  }

  private async executeSelect(): Promise<QueryResult<any>> {
    const state = loadState();
    let rows = deepClone(getTableRows(state, this.table) || []);
    rows = applyFilters(rows, this.filters);
    const totalCount = rows.length;

    if (this.orderBy) {
      const { column, ascending } = this.orderBy;
      rows.sort((a, b) => {
        const left = a?.[column];
        const right = b?.[column];
        if (left === right) return 0;
        if (left === undefined || left === null) return 1;
        if (right === undefined || right === null) return -1;
        if (typeof left === 'string' && typeof right === 'string') {
          return ascending ? left.localeCompare(right) : right.localeCompare(left);
        }
        return ascending ? (left > right ? 1 : -1) : left > right ? -1 : 1;
      });
    }

    if (this.rangeBy) {
      rows = rows.slice(this.rangeBy.from, this.rangeBy.to + 1);
    }

    if (this.limitBy !== null) {
      rows = rows.slice(0, this.limitBy);
    }

    rows = decorateRows(this.table, rows, this.selectClause, state);

    if (this.singleRow) {
      const row = rows[0] ?? null;
      if (!row) return { data: null, error: { message: 'No rows found' }, count: totalCount };
      return {
        data: row,
        error: null,
        count: this.includeCount ? totalCount : null,
      };
    }

    return {
      data: rows,
      error: null,
      count: this.includeCount ? totalCount : null,
    };
  }

  private async executeUpdate(): Promise<QueryResult<any>> {
    const state = deepClone(loadState());
    const tableRows = getTableRows(state, this.table);
    if (!tableRows) {
      return { data: null, error: { message: `Unknown table ${this.table}` } };
    }

    const updated: any[] = [];
    tableRows.forEach((row: any) => {
      if (!applyFilters([row], this.filters).length) return;
      Object.assign(row, this.updatePatch);
      if ('updated_at' in row) row.updated_at = nowIso();
      updated.push(deepClone(row));
    });

    saveState(state);
    return { data: updated, error: null, count: updated.length };
  }

  private async executeDelete(): Promise<QueryResult<any>> {
    const state = deepClone(loadState());
    const tableRows = getTableRows(state, this.table);
    if (!tableRows) {
      return { data: null, error: { message: `Unknown table ${this.table}` } };
    }

    const keep: any[] = [];
    const deleted: any[] = [];

    tableRows.forEach((row: any) => {
      if (applyFilters([row], this.filters).length) {
        deleted.push(deepClone(row));
      } else {
        keep.push(row);
      }
    });

    setTableRows(state, this.table, keep);
    saveState(state);
    return { data: deleted, error: null, count: deleted.length };
  }

  private execute(): Promise<QueryResult<any>> {
    if (this.mode === 'update') return this.executeUpdate();
    if (this.mode === 'delete') return this.executeDelete();
    return this.executeSelect();
  }

  then<TResult1 = QueryResult<any>, TResult2 = never>(
    onfulfilled?:
      | ((value: QueryResult<any>) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled as any, onrejected as any);
  }
}

const applyFilters = (rows: any[], filters: Array<(row: any) => boolean>) => {
  if (!filters.length) return rows;
  return rows.filter((row) => filters.every((filter) => filter(row)));
};

const decorateRows = (table: string, rows: any[], clause: string, state: LocalState) => {
  if (!clause || clause === '*') return rows;

  if (table === 'policies') {
    return rows.map((row) => {
      const category = state.categories.find((item) => item.id === row.category_id) || null;
      const tags = state.policy_tags.filter((item) => item.policy_id === row.id);
      const attachments = state.policy_attachments.filter((item) => item.policy_id === row.id);
      const policyDistricts = state.policy_districts
        .filter((item) => item.policy_id === row.id)
        .map((item) => ({
          district_id: item.district_id,
          districts: {
            name:
              state.districts.find((district) => district.id === item.district_id)?.name || '',
          },
        }));

      return {
        ...row,
        category,
        categories: category,
        tags,
        policy_tags: tags,
        attachments,
        policy_attachments: attachments,
        districts: policyDistricts,
        policy_districts: policyDistricts,
      };
    });
  }

  if (table === 'feedback') {
    return rows.map((row) => {
      const profile = state.profiles.find((item) => item.id === row.user_id);
      const policy = state.policies.find((item) => item.id === row.policy_id);
      return {
        ...row,
        profiles: profile
          ? { full_name: profile.full_name, avatar_url: profile.avatar_url || '' }
          : null,
        policies: policy ? { title: policy.title } : null,
      };
    });
  }

  if (table === 'sentiment_votes') {
    return rows.map((row) => {
      const policy = state.policies.find((item) => item.id === row.policy_id);
      return {
        ...row,
        policies: policy ? { title: policy.title } : null,
      };
    });
  }

  return rows;
};

const getTableRows = (state: LocalState, table: string): any[] | null => {
  if (table === 'engagement_analytics') {
    return computeEngagementAnalytics(state);
  }

  if (table in state) {
    return (state as any)[table];
  }
  return null;
};

const setTableRows = (state: LocalState, table: string, rows: any[]) => {
  if (!(table in state)) return;
  (state as any)[table] = rows;
};

const createInsertRow = (table: string, value: any) => {
  const now = nowIso();
  const base = deepClone(value || {});
  if (!base.id) base.id = makeId();

  if (table === 'profiles') {
    return {
      email_notifications: true,
      role: 'citizen',
      avatar_url: '',
      district_id: null,
      date_of_birth: null,
      ...base,
      created_at: base.created_at || now,
      updated_at: now,
    };
  }

  if (table === 'policies') {
    return {
      allow_anonymous: true,
      status: 'draft',
      scope: 'municipality',
      video_url: '',
      ...base,
      created_at: base.created_at || now,
      updated_at: now,
    };
  }

  if (table === 'feedback' || table === 'sentiment_votes') {
    return {
      ...base,
      created_at: base.created_at || now,
      updated_at: now,
    };
  }

  if (table === 'notifications') {
    return {
      is_read: false,
      related_policy_id: null,
      ...base,
      created_at: base.created_at || now,
    };
  }

  if (table === 'policy_views') {
    return {
      ...base,
      viewed_at: base.viewed_at || now,
    };
  }

  return {
    ...base,
    created_at: base.created_at || now,
  };
};

export const createLocalSupabaseClient = () => {
  return {
    auth: {
      getSession: async () => {
        const state = loadState();
        const sessionUserId = loadSessionUserId();
        const authUser = getAuthUserById(state, sessionUserId);
        return { data: { session: toAuthSession(authUser) }, error: null };
      },
      getUser: async () => {
        const state = loadState();
        const sessionUserId = loadSessionUserId();
        const authUser = getAuthUserById(state, sessionUserId);
        return { data: { user: toAuthSession(authUser)?.user || null }, error: null };
      },
      onAuthStateChange: (callback: AuthCallback) => {
        authListeners.add(callback);
        const state = loadState();
        const authUser = getAuthUserById(state, loadSessionUserId());
        callback('INITIAL_SESSION', toAuthSession(authUser));
        return {
          data: {
            subscription: {
              unsubscribe: () => authListeners.delete(callback),
            },
          },
        };
      },
      signUp: async ({
        email,
        password,
        options,
      }: {
        email: string;
        password: string;
        options?: { data?: { full_name?: string } };
      }) => {
        const normalizedEmail = email.trim().toLowerCase();
        const state = deepClone(loadState());
        const existing = state.auth_users.find((user) => user.email === normalizedEmail);
        if (existing) {
          return { data: null, error: { message: 'User already exists' } };
        }

        const newUser: LocalAuthUser = {
          id: makeId(),
          email: normalizedEmail,
          password,
          full_name: options?.data?.full_name || 'Citizen User',
          role: 'citizen',
          created_at: nowIso(),
        };

        state.auth_users.push(newUser);
        state.profiles.push({
          id: newUser.id,
          email: newUser.email,
          full_name: newUser.full_name,
          role: 'citizen',
          district_id: null as any,
          date_of_birth: '',
          avatar_url: '',
          email_notifications: true,
          created_at: newUser.created_at,
          updated_at: newUser.created_at,
        });

        saveState(state);
        saveSessionUserId(newUser.id);
        const session = toAuthSession(newUser);
        emitAuth('SIGNED_IN', session);
        return { data: { user: session?.user, session }, error: null };
      },
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        const state = loadState();
        const normalizedEmail = email.trim().toLowerCase();
        const user = state.auth_users.find(
          (item) => item.email === normalizedEmail && item.password === password
        );

        if (!user) {
          return { data: { user: null, session: null }, error: { message: 'Invalid credentials' } };
        }

        saveSessionUserId(user.id);
        const session = toAuthSession(user);
        emitAuth('SIGNED_IN', session);
        return { data: { user: session?.user, session }, error: null };
      },
      signOut: async () => {
        saveSessionUserId(null);
        emitAuth('SIGNED_OUT', null);
        return { error: null };
      },
      resetPasswordForEmail: async (_email: string) => {
        return { data: {}, error: null };
      },
    },
    from: (table: string) => new LocalQueryBuilder(table),
    rpc: async (name: string, args: Record<string, any> = {}) => {
      if (name === 'track_policy_view') {
        const policyId = args.policy_uuid;
        if (!policyId) return { data: null, error: { message: 'Missing policy_uuid' } };
        const state = deepClone(loadState());
        const sessionUserId = loadSessionUserId();
        if (!sessionUserId) return { data: null, error: null };

        const existing = state.policy_views.find(
          (view) =>
            view.policy_id === policyId &&
            view.user_id === sessionUserId &&
            view.viewed_at.slice(0, 10) === todayIsoDate()
        );
        if (!existing) {
          state.policy_views.push({
            id: makeId(),
            policy_id: policyId,
            user_id: sessionUserId,
            viewed_at: nowIso(),
          });
          saveState(state);
        }
        return { data: null, error: null };
      }

      if (name === 'get_dashboard_metrics') {
        const state = loadState();
        const period = typeof args.time_period === 'string' ? args.time_period : '30d';
        const metrics = computeDashboardMetrics(state, period);
        return { data: metrics, error: null };
      }

      return { data: null, error: { message: `RPC ${name} is not available in local mode` } };
    },
    channel: (name: string) => new LocalChannel(name),
    removeChannel: (channel: LocalChannel) => {
      channel.unsubscribe();
      return Promise.resolve({ data: null, error: null });
    },
  };
};

