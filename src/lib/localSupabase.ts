import type {
  AppSettings,
  AdminDistrictMetric,
  Category,
  DashboardMetrics,
  EngagementAnalytics,
  Event,
  Feedback,
  Notification,
  Policy,
  PolicyAttachment,
  PolicyFollow,
  PolicyTag,
  PolicyTopic,
  PolicyUpdate,
  AdminPolicyWorkspacePayload,
  SentimentType,
  SentimentVote,
} from '../types/policy.types';
import type {
  AccountMode,
  AuthChallengeStatus,
  VerifiedSessionSource,
} from '../types/auth.types';
import type { District, Profile } from '../types/user.types';
import { DISTRICT_GEOJSON_BY_NAME } from './districtGeometry';

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

interface LocalAdminInvite {
  id: string;
  code_hash: string;
  email: string | null;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
  revoked_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface LocalAuthEmailChallenge {
  id: string;
  email: string;
  user_id: string | null;
  purpose: 'signup' | 'login';
  account_mode: AccountMode;
  invite_id: string | null;
  code_hash: string;
  verification_token_hash: string | null;
  status: AuthChallengeStatus;
  attempts: number;
  max_attempts: number;
  expires_at: string;
  resend_available_at: string;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

interface LocalTrustedDevice {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  revoked_at: string | null;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

interface LocalVerifiedSession {
  id: string;
  user_id: string;
  session_id: string;
  role: Role;
  source: VerifiedSessionSource;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

interface LocalSessionState {
  user_id: string;
  session_id: string;
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
  policy_topics: PolicyTopic[];
  policy_updates: PolicyUpdate[];
  events: Event[];
  sentiment_votes: SentimentVote[];
  feedback: Feedback[];
  policy_views: LocalPolicyView[];
  policy_follows: PolicyFollow[];
  notifications: Notification[];
  app_settings: AppSettings[];
  admin_invites: LocalAdminInvite[];
  auth_email_challenges: LocalAuthEmailChallenge[];
  trusted_devices: LocalTrustedDevice[];
  verified_sessions: LocalVerifiedSession[];
}

type AuthEvent = 'INITIAL_SESSION' | 'SIGNED_IN' | 'SIGNED_OUT' | 'USER_UPDATED';
type AuthCallback = (event: AuthEvent, session: any) => void;
type QueryResult<T = any> = { data: T; error: any; count?: number | null };

const DB_STORAGE_KEY = 'civicus.local.db.v1';
const SESSION_STORAGE_KEY = 'civicus.local.session.v2';

const authListeners = new Set<AuthCallback>();
const activeChannels = new Set<LocalChannel>();

let inMemoryState: LocalState | null = null;
let inMemorySessionState: LocalSessionState | null = null;

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

const localHash = (value: string) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `local_${(hash >>> 0).toString(16)}`;
};

const randomNumericCode = () =>
  String(Math.floor(100000 + Math.random() * 900000));

const randomSecret = () => `${makeId()}_${Math.random().toString(36).slice(2, 10)}`;

const createSeedState = (): LocalState => {
  const now = nowIso();

  const adminId = makeId();
  const citizenId = makeId();
  const citizen2Id = makeId();

  const districts: District[] = [
    { id: makeId(), name: 'Tromsoya', municipality: 'Tromso', geojson: DISTRICT_GEOJSON_BY_NAME.Tromsoya, population: 41000, created_at: now, updated_at: now },
    { id: makeId(), name: 'Fastlandet', municipality: 'Tromso', geojson: DISTRICT_GEOJSON_BY_NAME.Fastlandet, population: 14000, created_at: now, updated_at: now },
    { id: makeId(), name: 'Kvaloya', municipality: 'Tromso', geojson: DISTRICT_GEOJSON_BY_NAME.Kvaloya, population: 10000, created_at: now, updated_at: now },
    { id: makeId(), name: 'Hakoya', municipality: 'Tromso', geojson: DISTRICT_GEOJSON_BY_NAME.Hakoya, population: 400, created_at: now, updated_at: now },
  ];

  const categories: Category[] = [
    { id: makeId(), name: 'Housing', label_no: 'Bolig', label_en: 'Housing', description: 'Housing development and policies', color: '#3B82F6', created_at: now },
    { id: makeId(), name: 'Transportation', label_no: 'Transport', label_en: 'Transportation', description: 'Public transport and mobility', color: '#10B981', created_at: now },
    { id: makeId(), name: 'Environment', label_no: 'Miljo', label_en: 'Environment', description: 'Environmental and climate policies', color: '#22C55E', created_at: now },
    { id: makeId(), name: 'Education', label_no: 'Utdanning', label_en: 'Education', description: 'Schools and educational initiatives', color: '#F59E0B', created_at: now },
    { id: makeId(), name: 'Healthcare', label_no: 'Helse', label_en: 'Healthcare', description: 'Public health services', color: '#EF4444', created_at: now },
    { id: makeId(), name: 'Culture', label_no: 'Kultur', label_en: 'Culture', description: 'Cultural programs and facilities', color: '#8B5CF6', created_at: now },
    { id: makeId(), name: 'Other', label_no: 'Annet', label_en: 'Other', description: 'General municipal matters', color: '#6B7280', created_at: now },
  ];

  const categoryByName = (name: string) => categories.find((category) => category.name === name)!;
  const districtByName = (name: string) => districts.find((district) => district.name === name)!;

  const policies: Policy[] = [
    {
      id: makeId(),
      title: 'Expand Public Bus Routes in Outer Districts',
      title_no: 'Utvid kollektivtilbudet i ytre bydeler',
      title_en: 'Expand Public Bus Routes in Outer Districts',
      description:
        'This proposal introduces expanded evening and weekend bus routes across Fastlandet and Kvaloya to improve accessibility for students, workers, and seniors.',
      description_no:
        'Dette forslaget utvider kvelds- og helgeruter pa Fastlandet og Kvaloya for a bedre tilgjengeligheten for studenter, arbeidstakere og eldre.',
      description_en:
        'This proposal introduces expanded evening and weekend bus routes across Fastlandet and Kvaloya to improve accessibility for students, workers, and seniors.',
      category_id: categoryByName('Transportation').id,
      status: 'active',
      scope: 'district',
      start_date: '2026-01-20',
      end_date: '2026-03-20',
      allow_anonymous: true,
      video_url: '',
      is_published: true,
      published_at: now,
      created_by: adminId,
      created_at: now,
      updated_at: now,
    },
    {
      id: makeId(),
      title: 'Affordable Youth Housing Development Program',
      title_no: 'Rimelig boligprogram for unge',
      title_en: 'Affordable Youth Housing Development Program',
      description:
        'The municipality is considering a mixed-income housing initiative focused on citizens aged 18-35. Feedback is requested on rent ceilings and location priorities.',
      description_no:
        'Kommunen vurderer et boliginitiativ for innbyggere mellom 18 og 35 ar. Vi ber om innspill pa leietak og lokasjonsprioriteringer.',
      description_en:
        'The municipality is considering a mixed-income housing initiative focused on citizens aged 18-35. Feedback is requested on rent ceilings and location priorities.',
      category_id: categoryByName('Housing').id,
      status: 'active',
      scope: 'municipality',
      start_date: '2026-01-10',
      end_date: '2026-03-10',
      allow_anonymous: true,
      video_url: '',
      is_published: true,
      published_at: now,
      created_by: adminId,
      created_at: now,
      updated_at: now,
    },
    {
      id: makeId(),
      title: 'City Center Low-Emission Zone',
      title_no: 'Lavutslippssone i sentrum',
      title_en: 'City Center Low-Emission Zone',
      description:
        'Introduce a phased low-emission zone in central Tromso to reduce air pollution and traffic noise. Citizens can comment on timing and implementation approach.',
      description_no:
        'Innfør en trinnvis lavutslippssone i sentrum for a redusere luftforurensning og trafikkstoy. Innbyggere kan kommentere tidsplan og gjennomforing.',
      description_en:
        'Introduce a phased low-emission zone in central Tromso to reduce air pollution and traffic noise. Citizens can comment on timing and implementation approach.',
      category_id: categoryByName('Environment').id,
      status: 'under_review',
      scope: 'municipality',
      start_date: '2025-12-01',
      end_date: '2026-02-01',
      allow_anonymous: false,
      video_url: '',
      is_published: true,
      published_at: now,
      created_by: adminId,
      created_at: now,
      updated_at: now,
    },
    {
      id: makeId(),
      title: 'School Digital Learning Expansion',
      title_no: 'Utvidelse av digital undervisning i skolen',
      title_en: 'School Digital Learning Expansion',
      description:
        'Pilot investment in digital learning tools and teacher training for upper-secondary schools. Public feedback was collected during the consultation window.',
      description_no:
        'Pilotinvestering i digitale laeringsverktoy og laereropplaering for videregaende skoler. Offentlig tilbakemelding ble samlet inn i horingsperioden.',
      description_en:
        'Pilot investment in digital learning tools and teacher training for upper-secondary schools. Public feedback was collected during the consultation window.',
      category_id: categoryByName('Education').id,
      status: 'closed',
      scope: 'municipality',
      start_date: '2025-10-01',
      end_date: '2025-12-01',
      allow_anonymous: true,
      video_url: '',
      is_published: true,
      published_at: now,
      created_by: adminId,
      created_at: now,
      updated_at: now,
    },
    {
      id: makeId(),
      title: 'Neighborhood Cultural Hubs Funding',
      title_no: 'Stotte til lokale kulturhus',
      title_en: 'Neighborhood Cultural Hubs Funding',
      description:
        'Draft proposal for decentralized cultural hub grants. Intended to increase community-led programs across districts.',
      description_no:
        'Utkast til desentraliserte kulturmidler for lokale kulturhus. Skal styrke innbyggerdrevne programmer pa tvers av bydeler.',
      description_en:
        'Draft proposal for decentralized cultural hub grants. Intended to increase community-led programs across districts.',
      category_id: categoryByName('Culture').id,
      status: 'draft',
      scope: 'district',
      start_date: '2026-02-15',
      end_date: '2026-04-15',
      allow_anonymous: true,
      video_url: '',
      is_published: false,
      published_at: null,
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

  const policy_topics: PolicyTopic[] = [
    {
      id: makeId(),
      policy_id: policyByTitle('Expand Public Bus Routes in Outer Districts').id,
      slug: 'bedre-sykkelveier',
      label_no: 'Bedre Bussruter',
      label_en: 'Better Bus Service',
      description_no: 'Kveldsruter, helgetilbud og dekning i ytterdistriktene.',
      description_en: 'Evening routes, weekend service, and coverage in outer districts.',
      icon_key: 'bedre-sykkelveier',
      sort_order: 1,
      created_at: now,
    },
    {
      id: makeId(),
      policy_id: policyByTitle('Expand Public Bus Routes in Outer Districts').id,
      slug: 'budsjett-kostnad',
      label_no: 'Kostnad og Finansiering',
      label_en: 'Cost and Funding',
      description_no: 'Hva utvidelsen koster og hvordan den finansieres.',
      description_en: 'What the expansion costs and how it will be funded.',
      icon_key: 'budsjett-kostnad',
      sort_order: 2,
      created_at: now,
    },
    {
      id: makeId(),
      policy_id: policyByTitle('Expand Public Bus Routes in Outer Districts').id,
      slug: 'anleggsperioder',
      label_no: 'Gjennomforing',
      label_en: 'Delivery Plan',
      description_no: 'Fasevis utrulling og milepaeler for oppstart.',
      description_en: 'Phased rollout and milestones for implementation.',
      icon_key: 'anleggsperioder',
      sort_order: 3,
      created_at: now,
    },
    {
      id: makeId(),
      policy_id: policyByTitle('Affordable Youth Housing Development Program').id,
      slug: 'flere-gronne-soner',
      label_no: 'Bomiljo og Kvalitet',
      label_en: 'Living Quality',
      description_no: 'Hvordan prosjektet skaper gode bomiljoer for unge.',
      description_en: 'How the project creates better living environments for young residents.',
      icon_key: 'flere-gronne-soner',
      sort_order: 1,
      created_at: now,
    },
    {
      id: makeId(),
      policy_id: policyByTitle('Affordable Youth Housing Development Program').id,
      slug: 'budsjett-kostnad',
      label_no: 'Leieniva og Budsjett',
      label_en: 'Rent Levels and Budget',
      description_no: 'Leietak, kommunale bidrag og prioriteringer.',
      description_en: 'Rent ceilings, municipal support, and tradeoffs.',
      icon_key: 'budsjett-kostnad',
      sort_order: 2,
      created_at: now,
    },
  ];

  const policy_updates: PolicyUpdate[] = [
    {
      id: makeId(),
      policy_id: policyByTitle('Expand Public Bus Routes in Outer Districts').id,
      title: 'Consultation window extended',
      content:
        'The municipality extended the consultation period by two weeks to allow more residents in Fastlandet and Kvaloya to provide input.',
      update_type: 'deadline',
      created_by: adminId,
      created_at: now,
    },
    {
      id: makeId(),
      policy_id: policyByTitle('Affordable Youth Housing Development Program').id,
      title: 'Location shortlist published',
      content:
        'Three candidate development areas are now being evaluated, with proximity to public transport and campuses as key criteria.',
      update_type: 'info',
      created_by: adminId,
      created_at: now,
    },
    {
      id: makeId(),
      policy_id: policyByTitle('City Center Low-Emission Zone').id,
      title: 'Proposal moved to review',
      content:
        'The proposal is under review after the consultation period closed. An implementation recommendation will be published next month.',
      update_type: 'status_change',
      created_by: adminId,
      created_at: now,
    },
  ];

  const events: Event[] = [
    {
      id: makeId(),
      policy_id: policyByTitle('Expand Public Bus Routes in Outer Districts').id,
      title: 'Open information meeting',
      description: 'Meet the project team and discuss route priorities with planners and transport staff.',
      event_date: '2026-02-18T18:00:00.000Z',
      location: 'Tromso Library, Main Hall',
      mode: 'hybrid',
      registration_url: 'https://example.com/events/bus-routes',
      created_at: now,
    },
  ];

  const profiles: Profile[] = [
    {
      id: adminId,
      email: 'admin-profile@seed.local',
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
      email: 'alex.hansen@seed.local',
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
      email: 'mina.olsen@seed.local',
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

  const auth_users: LocalAuthUser[] = [];

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

  const admin_invites: LocalAdminInvite[] = [
    {
      id: makeId(),
      code_hash: localHash('CIVICUS-ADMIN-ACCESS'),
      email: null,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      used_at: null,
      used_by: null,
      revoked_at: null,
      created_by: adminId,
      created_at: now,
      updated_at: now,
    },
  ];

  const app_settings: AppSettings[] = [
    {
      id: 'app-settings',
      municipality_name: 'Tromso Kommune',
      contact_email: 'contact@tromso.kommune.no',
      contact_phone: '+47 77 79 00 00',
      website: 'https://tromso.kommune.no',
      ai_sentiment_enabled: true,
      ai_trend_detection_enabled: true,
      ai_summaries_enabled: true,
      created_at: now,
      updated_at: now,
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
    policy_topics,
    policy_updates,
    events,
    sentiment_votes,
    feedback,
    policy_views,
    policy_follows: [],
    notifications,
    app_settings,
    admin_invites,
    auth_email_challenges: [],
    trusted_devices: [],
    verified_sessions: [],
  };
};

const hasLocalStorage = () => typeof window !== 'undefined' && !!window.localStorage;

const normalizeState = (state: Partial<LocalState>): LocalState => ({
  auth_users: state.auth_users || [],
  profiles: state.profiles || [],
  districts: state.districts || [],
  categories: state.categories || [],
  policies: state.policies || [],
  policy_districts: state.policy_districts || [],
  policy_tags: state.policy_tags || [],
  policy_attachments: state.policy_attachments || [],
  policy_topics: state.policy_topics || [],
  policy_updates: state.policy_updates || [],
  events: state.events || [],
  sentiment_votes: state.sentiment_votes || [],
  feedback: state.feedback || [],
  policy_views: state.policy_views || [],
  policy_follows: state.policy_follows || [],
  notifications: state.notifications || [],
  app_settings: state.app_settings || createSeedState().app_settings,
  admin_invites: state.admin_invites || [],
  auth_email_challenges: state.auth_email_challenges || [],
  trusted_devices: state.trusted_devices || [],
  verified_sessions: state.verified_sessions || [],
});

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
    const parsed = normalizeState(JSON.parse(raw) as Partial<LocalState>);
    inMemoryState = parsed;
    window.localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(parsed));
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

const loadSessionState = (): LocalSessionState | null => {
  if (inMemorySessionState !== null) return inMemorySessionState;
  if (!hasLocalStorage()) return null;

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as LocalSessionState | string;
    if (typeof parsed === 'string') {
      inMemorySessionState = {
        user_id: parsed,
        session_id: makeId(),
      };
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(inMemorySessionState));
      return inMemorySessionState;
    }
    if (parsed?.user_id && parsed?.session_id) {
      inMemorySessionState = parsed;
      return parsed;
    }
  } catch {
    // Ignore invalid cached session payloads.
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY);
  return null;
};

const saveSessionState = (sessionState: LocalSessionState | null) => {
  inMemorySessionState = sessionState;
  if (!hasLocalStorage()) return;
  if (sessionState) {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionState));
  } else {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  }
};

const getAuthUserById = (state: LocalState, userId?: string | null) => {
  if (!userId) return null;
  return state.auth_users.find((user) => user.id === userId) || null;
};

const toAuthSession = (authUser: LocalAuthUser | null, sessionId?: string | null) => {
  if (!authUser) return null;
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  return {
    access_token: `local-token-${sessionId || authUser.id}`,
    refresh_token: `local-refresh-${sessionId || authUser.id}`,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: expiresAt,
    session_id: sessionId || authUser.id,
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

const getCurrentSessionContext = (state: LocalState) => {
  const sessionState = loadSessionState();
  const authUser = getAuthUserById(state, sessionState?.user_id);
  const profile = state.profiles.find((item) => item.id === authUser?.id) || null;
  return { sessionState, authUser, profile };
};

const getCurrentVerifiedSession = (state: LocalState) => {
  const { sessionState, authUser } = getCurrentSessionContext(state);
  if (!sessionState || !authUser) return null;
  return (
    state.verified_sessions.find(
      (item) =>
        item.user_id === authUser.id &&
        item.session_id === sessionState.session_id &&
        item.expires_at > nowIso()
    ) || null
  );
};

const markExistingChallengesCancelled = (
  state: LocalState,
  email: string,
  purpose: 'signup' | 'login'
) => {
  state.auth_email_challenges.forEach((challenge) => {
    if (
      challenge.email === email &&
      challenge.purpose === purpose &&
      (challenge.status === 'pending' || challenge.status === 'verified')
    ) {
      challenge.status = 'cancelled';
      challenge.updated_at = nowIso();
    }
  });
};

const buildOtpChallenge = (
  params: Pick<LocalAuthEmailChallenge, 'email' | 'user_id' | 'purpose' | 'account_mode' | 'invite_id'>
) => {
  const now = nowIso();
  const code = randomNumericCode();

  const challenge: LocalAuthEmailChallenge = {
    id: makeId(),
    email: params.email,
    user_id: params.user_id,
    purpose: params.purpose,
    account_mode: params.account_mode,
    invite_id: params.invite_id,
    code_hash: localHash(code),
    verification_token_hash: null,
    status: 'pending',
    attempts: 0,
    max_attempts: 5,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    resend_available_at: new Date(Date.now() + 60 * 1000).toISOString(),
    verified_at: null,
    created_at: now,
    updated_at: now,
  };

  return { challenge, code };
};

const validateChallengeCode = (
  challenge: LocalAuthEmailChallenge,
  code: string
): { valid: boolean; error?: string } => {
  if (challenge.expires_at <= nowIso()) {
    challenge.status = 'expired';
    challenge.updated_at = nowIso();
    return { valid: false, error: 'The verification code has expired' };
  }

  if (challenge.attempts >= challenge.max_attempts) {
    challenge.status = 'expired';
    challenge.updated_at = nowIso();
    return { valid: false, error: 'Too many attempts. Request a new code.' };
  }

  if (challenge.code_hash !== localHash(code.trim())) {
    challenge.attempts += 1;
    challenge.updated_at = nowIso();
    if (challenge.attempts >= challenge.max_attempts) {
      challenge.status = 'expired';
    }
    return { valid: false, error: 'Invalid verification code' };
  }

  return { valid: true };
};

const ensureSessionVerified = (
  state: LocalState,
  authUser: LocalAuthUser,
  source: VerifiedSessionSource
) => {
  const sessionState = loadSessionState();
  if (!sessionState) return null;

  const now = nowIso();
  const existing = state.verified_sessions.find(
    (item) => item.user_id === authUser.id && item.session_id === sessionState.session_id
  );
  const baseRow = {
    user_id: authUser.id,
    session_id: sessionState.session_id,
    role: authUser.role,
    source,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    updated_at: now,
  };

  if (existing) {
    Object.assign(existing, baseRow);
    return existing;
  }

  const row: LocalVerifiedSession = {
    id: makeId(),
    ...baseRow,
    created_at: now,
  };
  state.verified_sessions.push(row);
  return row;
};

const invokeLocalFunction = async (name: string, body: Record<string, any> = {}) => {
  const state = deepClone(loadState());
  const { authUser, profile } = getCurrentSessionContext(state);

  if (name === 'auth-dev-signup') {
    const normalizedEmail = String(body.email || '').trim().toLowerCase();
    const accountMode = body.accountMode === 'admin' ? 'admin' : 'citizen';
    const fullName = String(body.fullName || '').trim();
    const password = String(body.password || '');

    if (!normalizedEmail) {
      return { data: null, error: { message: 'Email is required' } };
    }

    if (fullName.length < 2) {
      return { data: null, error: { message: 'Full name must be at least 2 characters' } };
    }

    if (password.length < 8) {
      return { data: null, error: { message: 'Password must be at least 8 characters' } };
    }

    if (state.auth_users.some((item) => item.email === normalizedEmail)) {
      return { data: null, error: { message: 'An account already exists for this email' } };
    }

    let inviteId: string | null = null;
    if (accountMode === 'admin') {
      const codeHash = localHash(String(body.inviteCode || '').trim());
      const invite = state.admin_invites.find(
        (item) =>
          item.code_hash === codeHash &&
          !item.used_at &&
          !item.revoked_at &&
          item.expires_at > nowIso() &&
          (!item.email || item.email === normalizedEmail)
      );

      if (!invite) {
        return { data: null, error: { message: 'Invalid or expired admin invite code' } };
      }

      inviteId = invite.id;
    }

    const newUser: LocalAuthUser = {
      id: makeId(),
      email: normalizedEmail,
      password,
      full_name: fullName,
      role: accountMode === 'admin' ? 'admin' : 'citizen',
      created_at: nowIso(),
    };

    state.auth_users.push(newUser);
    state.profiles.push({
      id: newUser.id,
      email: newUser.email,
      full_name: newUser.full_name,
      role: newUser.role,
      district_id: null as any,
      date_of_birth: '',
      avatar_url: '',
      email_notifications: true,
      created_at: newUser.created_at,
      updated_at: newUser.created_at,
    });

    if (inviteId) {
      const invite = state.admin_invites.find((item) => item.id === inviteId);
      if (invite) {
        invite.used_at = nowIso();
        invite.used_by = newUser.id;
        invite.updated_at = nowIso();
      }
    }

    saveState(state);
    return { data: { success: true }, error: null };
  }

  if (name === 'auth-start-signup') {
    const normalizedEmail = String(body.email || '').trim().toLowerCase();
    const accountMode = body.accountMode === 'admin' ? 'admin' : 'citizen';

    if (!normalizedEmail) {
      return { data: null, error: { message: 'Email is required' } };
    }

    if (state.auth_users.some((item) => item.email === normalizedEmail)) {
      return { data: null, error: { message: 'An account already exists for this email' } };
    }

    let inviteId: string | null = null;
    if (accountMode === 'admin') {
      const codeHash = localHash(String(body.inviteCode || '').trim());
      const invite = state.admin_invites.find(
        (item) =>
          item.code_hash === codeHash &&
          !item.used_at &&
          !item.revoked_at &&
          item.expires_at > nowIso() &&
          (!item.email || item.email === normalizedEmail)
      );

      if (!invite) {
        return { data: null, error: { message: 'Invalid or expired admin invite code' } };
      }
      inviteId = invite.id;
    }

    const existingPending = state.auth_email_challenges.find(
      (item) =>
        item.email === normalizedEmail &&
        item.purpose === 'signup' &&
        item.status === 'pending' &&
        item.resend_available_at > nowIso()
    );
    if (existingPending) {
      return {
        data: null,
        error: { message: 'Please wait before requesting another verification code' },
      };
    }

    markExistingChallengesCancelled(state, normalizedEmail, 'signup');
    const { challenge, code } = buildOtpChallenge({
      email: normalizedEmail,
      user_id: null,
      purpose: 'signup',
      account_mode: accountMode,
      invite_id: inviteId,
    });
    state.auth_email_challenges.push(challenge);
    saveState(state);
    return {
      data: {
        challengeId: challenge.id,
        email: normalizedEmail,
        accountMode,
        expiresAt: challenge.expires_at,
        resendAvailableAt: challenge.resend_available_at,
        debugCode: code,
      },
      error: null,
    };
  }

  if (name === 'auth-verify-signup-code') {
    const normalizedEmail = String(body.email || '').trim().toLowerCase();
    const challenge = [...state.auth_email_challenges]
      .filter(
        (item) =>
          item.email === normalizedEmail &&
          item.purpose === 'signup' &&
          item.status === 'pending'
      )
      .sort((left, right) => right.created_at.localeCompare(left.created_at))[0];

    if (!challenge) {
      return { data: null, error: { message: 'No active signup challenge found' } };
    }

    const validation = validateChallengeCode(challenge, String(body.code || ''));
    if (!validation.valid) {
      saveState(state);
      return { data: null, error: { message: validation.error } };
    }

    const verificationToken = randomSecret();
    challenge.status = 'verified';
    challenge.verified_at = nowIso();
    challenge.verification_token_hash = localHash(verificationToken);
    challenge.updated_at = nowIso();
    saveState(state);

    return {
      data: {
        verificationToken,
        email: normalizedEmail,
        accountMode: challenge.account_mode,
      },
      error: null,
    };
  }

  if (name === 'auth-complete-signup') {
    const normalizedEmail = String(body.email || '').trim().toLowerCase();
    const challenge = [...state.auth_email_challenges]
      .filter(
        (item) =>
          item.email === normalizedEmail &&
          item.purpose === 'signup' &&
          item.status === 'verified'
      )
      .sort((left, right) => right.updated_at.localeCompare(left.updated_at))[0];

    if (!challenge) {
      return { data: null, error: { message: 'Verify your email before creating an account' } };
    }

    if (challenge.verification_token_hash !== localHash(String(body.verificationToken || ''))) {
      return { data: null, error: { message: 'The signup verification has expired' } };
    }

    if (state.auth_users.some((item) => item.email === normalizedEmail)) {
      return { data: null, error: { message: 'An account already exists for this email' } };
    }

    const newUser: LocalAuthUser = {
      id: makeId(),
      email: normalizedEmail,
      password: String(body.password || ''),
      full_name: String(body.fullName || 'Citizen User'),
      role: challenge.account_mode === 'admin' ? 'admin' : 'citizen',
      created_at: nowIso(),
    };

    state.auth_users.push(newUser);
    state.profiles.push({
      id: newUser.id,
      email: newUser.email,
      full_name: newUser.full_name,
      role: newUser.role,
      district_id: null as any,
      date_of_birth: '',
      avatar_url: '',
      email_notifications: true,
      created_at: newUser.created_at,
      updated_at: newUser.created_at,
    });

    challenge.status = 'completed';
    challenge.updated_at = nowIso();

    if (challenge.invite_id) {
      const invite = state.admin_invites.find((item) => item.id === challenge.invite_id);
      if (invite) {
        invite.used_at = nowIso();
        invite.used_by = newUser.id;
        invite.updated_at = nowIso();
      }
    }

    saveState(state);
    return { data: { success: true }, error: null };
  }

  if (name === 'auth-start-login-otp') {
    if (!authUser || !profile) {
      return { data: null, error: { message: 'Sign in before requesting a verification code' } };
    }

    const existingPending = state.auth_email_challenges.find(
      (item) =>
        item.email === authUser.email &&
        item.user_id === authUser.id &&
        item.purpose === 'login' &&
        item.status === 'pending' &&
        item.resend_available_at > nowIso()
    );
    if (existingPending) {
      return {
        data: null,
        error: { message: 'Please wait before requesting another verification code' },
      };
    }

    markExistingChallengesCancelled(state, authUser.email, 'login');
    const { challenge, code } = buildOtpChallenge({
      email: authUser.email,
      user_id: authUser.id,
      purpose: 'login',
      account_mode: profile.role === 'admin' || profile.role === 'super_admin' ? 'admin' : 'citizen',
      invite_id: null,
    });
    state.auth_email_challenges.push(challenge);
    saveState(state);
    return {
      data: {
        challengeId: challenge.id,
        email: authUser.email,
        accountMode: challenge.account_mode,
        expiresAt: challenge.expires_at,
        resendAvailableAt: challenge.resend_available_at,
        debugCode: code,
      },
      error: null,
    };
  }

  if (name === 'auth-verify-login-otp') {
    if (!authUser || !profile) {
      return { data: null, error: { message: 'Sign in before verifying a code' } };
    }

    const challenge = [...state.auth_email_challenges]
      .filter(
        (item) =>
          item.user_id === authUser.id &&
          item.purpose === 'login' &&
          item.status === 'pending'
      )
      .sort((left, right) => right.created_at.localeCompare(left.created_at))[0];

    if (!challenge) {
      return { data: null, error: { message: 'No active login challenge found' } };
    }

    const validation = validateChallengeCode(challenge, String(body.code || ''));
    if (!validation.valid) {
      saveState(state);
      return { data: null, error: { message: validation.error } };
    }

    challenge.status = 'completed';
    challenge.verified_at = nowIso();
    challenge.updated_at = nowIso();
    ensureSessionVerified(state, authUser, 'otp');

    let trustedDeviceToken: string | undefined;
    let trustedDeviceExpiresAt: string | undefined;
    if (body.rememberDevice && profile.role === 'citizen') {
      trustedDeviceToken = randomSecret();
      trustedDeviceExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      state.trusted_devices.push({
        id: makeId(),
        user_id: authUser.id,
        token_hash: localHash(trustedDeviceToken),
        expires_at: trustedDeviceExpiresAt,
        revoked_at: null,
        last_used_at: nowIso(),
        created_at: nowIso(),
        updated_at: nowIso(),
      });
    }

    saveState(state);
    return {
      data: {
        verified: true,
        role: profile.role,
        trustedDeviceToken,
        trustedDeviceExpiresAt,
      },
      error: null,
    };
  }

  if (name === 'auth-verify-trusted-device') {
    if (!authUser || !profile) {
      return { data: null, error: { message: 'Sign in before verifying this device' } };
    }

    if (profile.role === 'admin' || profile.role === 'super_admin') {
      return { data: null, error: { message: 'Admins must verify each login with a code' } };
    }

    const tokenHash = localHash(String(body.token || ''));
    const device = state.trusted_devices.find(
      (item) =>
        item.user_id === authUser.id &&
        item.token_hash === tokenHash &&
        !item.revoked_at &&
        item.expires_at > nowIso()
    );

    if (!device) {
      return { data: null, error: { message: 'Trusted device expired or was not recognized' } };
    }

    device.last_used_at = nowIso();
    device.updated_at = nowIso();
    ensureSessionVerified(state, authUser, 'trusted_device');
    saveState(state);

    return {
      data: {
        verified: true,
        role: profile.role,
      },
      error: null,
    };
  }

  if (name === 'auth-mark-session-verified') {
    if (!authUser || !profile) {
      return { data: null, error: { message: 'Sign in before verifying this session' } };
    }

    ensureSessionVerified(state, authUser, 'otp');
    saveState(state);

    return {
      data: {
        verified: true,
        role: profile.role,
      },
      error: null,
    };
  }

  return { data: null, error: { message: `Function ${name} is not available in local mode` } };
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

const computePolicyAnalytics = (state: LocalState, timePeriod = '30d'): EngagementAnalytics[] => {
  const days = parseRelativeDays(timePeriod);

  return state.policies
    .filter((policy) => policy.status !== 'draft')
    .map((policy) => {
      const votes = state.sentiment_votes.filter(
        (vote) => vote.policy_id === policy.id && isInsideWindow(vote.created_at, days)
      );
      const feedback = state.feedback.filter(
        (item) => item.policy_id === policy.id && isInsideWindow(item.created_at, days)
      );
      const views = state.policy_views.filter(
        (view) => view.policy_id === policy.id && isInsideWindow(view.viewed_at, days)
      );

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
        title: policy.title_en || policy.title_no || policy.title,
        status: policy.status,
        is_published: policy.is_published ?? false,
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

const computeEngagementAnalytics = (state: LocalState): EngagementAnalytics[] =>
  computePolicyAnalytics(state, '90d');

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
    active_policies: state.policies.filter((policy) => policy.status === 'active' && policy.is_published !== false).length,
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

const computeDistrictMetrics = (
  state: LocalState,
  timePeriod = '30d',
  policyId?: string | null
): AdminDistrictMetric[] => {
  const days = parseRelativeDays(timePeriod);
  const districtEntries = state.districts.map((district) => ({
    district_id: district.id,
    district_name: district.name,
    geojson: district.geojson || null,
    participants: 0,
    views: 0,
    votes: 0,
    feedback: 0,
  }));

  const byId = new Map(districtEntries.map((entry) => [entry.district_id, entry]));
  const profileDistrict = new Map(
    state.profiles.filter((profile) => profile.district_id).map((profile) => [profile.id, profile.district_id as string])
  );

  state.policy_views.forEach((view) => {
    if (!isInsideWindow(view.viewed_at, days)) return;
    if (policyId && view.policy_id !== policyId) return;
    const districtId = profileDistrict.get(view.user_id);
    if (!districtId) return;
    const item = byId.get(districtId);
    if (item) item.views += 1;
  });

  state.sentiment_votes.forEach((vote) => {
    if (!isInsideWindow(vote.created_at, days)) return;
    if (policyId && vote.policy_id !== policyId) return;
    const districtId = profileDistrict.get(vote.user_id);
    if (!districtId) return;
    const item = byId.get(districtId);
    if (item) item.votes += 1;
  });

  state.feedback.forEach((item) => {
    if (!item.user_id || !isInsideWindow(item.created_at, days)) return;
    if (policyId && item.policy_id !== policyId) return;
    const districtId = profileDistrict.get(item.user_id);
    if (!districtId) return;
    const metric = byId.get(districtId);
    if (metric) metric.feedback += 1;
  });

  districtEntries.forEach((entry) => {
    entry.participants = entry.views + entry.votes + entry.feedback;
  });

  return districtEntries;
};

const upsertPolicyWorkspaceLocal = (state: LocalState, payload: AdminPolicyWorkspacePayload, userId?: string | null) => {
  const now = nowIso();
  const incoming = payload.policy;
  const policyId = incoming.id || makeId();
  const existing = state.policies.find((policy) => policy.id === policyId);
  const persistedPolicy: Policy = {
    ...(existing || (createInsertRow('policies', {}) as Policy)),
    ...existing,
    ...incoming,
    id: policyId,
    title: incoming.title_no || incoming.title || incoming.title_en || '',
    description: incoming.description_no || incoming.description || incoming.description_en || '',
    title_no: incoming.title_no || incoming.title || '',
    title_en: incoming.title_en || '',
    description_no: incoming.description_no || incoming.description || '',
    description_en: incoming.description_en || '',
    is_published: incoming.is_published ?? false,
    published_at:
      incoming.is_published
        ? incoming.published_at || existing?.published_at || now
        : null,
    created_by: existing?.created_by || incoming.created_by || userId || null,
    created_at: existing?.created_at || now,
    updated_at: now,
  };

  if (existing) {
    Object.assign(existing, persistedPolicy);
  } else {
    state.policies.push(persistedPolicy);
  }

  state.policy_districts = state.policy_districts.filter((item) => item.policy_id !== policyId);
  payload.district_ids.forEach((districtId) => {
    state.policy_districts.push({ policy_id: policyId, district_id: districtId });
  });

  state.policy_tags = state.policy_tags.filter((item) => item.policy_id !== policyId);
  payload.tags.forEach((tag) => {
    if (!tag.trim()) return;
    state.policy_tags.push({
      id: makeId(),
      policy_id: policyId,
      tag: tag.trim(),
      created_at: now,
    });
  });

  state.policy_topics = state.policy_topics.filter((item) => item.policy_id !== policyId);
  payload.topics.forEach((topic, index) => {
    state.policy_topics.push({
      id: topic.id || makeId(),
      policy_id: policyId,
      slug: topic.slug,
      label_no: topic.label_no,
      label_en: topic.label_en,
      description_no: topic.description_no || '',
      description_en: topic.description_en || '',
      icon_key: topic.icon_key || '',
      sort_order: topic.sort_order ?? index,
      created_at: topic.created_at || now,
    });
  });

  state.policy_updates = state.policy_updates.filter((item) => item.policy_id !== policyId);
  payload.updates.forEach((update) => {
    state.policy_updates.push({
      id: update.id || makeId(),
      policy_id: policyId,
      title: update.title,
      content: update.content,
      update_type: update.update_type || 'info',
      created_by: update.created_by || userId || null,
      created_at: update.created_at || now,
    });
  });

  state.events = state.events.filter((item) => item.policy_id !== policyId);
  payload.events.forEach((event) => {
    state.events.push({
      id: event.id || makeId(),
      policy_id: policyId,
      title: event.title,
      description: event.description || '',
      event_date: event.event_date,
      location: event.location || '',
      mode: event.mode,
      registration_url: event.registration_url || '',
      created_at: event.created_at || now,
    });
  });

  return persistedPolicy;
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
    } else if (this.table === 'policy_follows') {
      inserted.forEach((row) => {
        const idx = tableRows.findIndex(
          (follow: PolicyFollow) =>
            follow.policy_id === row.policy_id && follow.user_id === row.user_id
        );
        if (idx < 0) {
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
      const topics = state.policy_topics
        .filter((item) => item.policy_id === row.id)
        .sort((left, right) => left.sort_order - right.sort_order);
      const updates = state.policy_updates
        .filter((item) => item.policy_id === row.id)
        .sort((left, right) => right.created_at.localeCompare(left.created_at));
      const events = state.events
        .filter((item) => item.policy_id === row.id)
        .sort((left, right) => left.event_date.localeCompare(right.event_date));
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
        topics,
        policy_topics: topics,
        updates,
        policy_updates: updates,
        events,
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
      title_no: base.title_no || base.title || '',
      title_en: base.title_en || '',
      description_no: base.description_no || base.description || '',
      description_en: base.description_en || '',
      is_published: base.is_published ?? false,
      published_at: base.published_at ?? null,
      ...base,
      created_at: base.created_at || now,
      updated_at: now,
    };
  }

  if (table === 'categories') {
    return {
      label_no: base.label_no || base.name || '',
      label_en: base.label_en || base.name || '',
      ...base,
      created_at: base.created_at || now,
    };
  }

  if (table === 'app_settings') {
    return {
      id: base.id || 'app-settings',
      municipality_name: base.municipality_name || 'Tromso Kommune',
      contact_email: base.contact_email ?? null,
      contact_phone: base.contact_phone ?? null,
      website: base.website ?? null,
      ai_sentiment_enabled: base.ai_sentiment_enabled ?? true,
      ai_trend_detection_enabled: base.ai_trend_detection_enabled ?? true,
      ai_summaries_enabled: base.ai_summaries_enabled ?? true,
      ...base,
      created_at: base.created_at || now,
      updated_at: now,
    };
  }

  if (
    table === 'feedback' ||
    table === 'sentiment_votes' ||
    table === 'policy_topics' ||
    table === 'policy_updates' ||
    table === 'events' ||
    table === 'policy_follows'
  ) {
    return {
      ...base,
      created_at: base.created_at || now,
      ...(table === 'feedback' || table === 'sentiment_votes' ? { updated_at: now } : {}),
    };
  }

  if (
    table === 'admin_invites' ||
    table === 'auth_email_challenges' ||
    table === 'trusted_devices' ||
    table === 'verified_sessions'
  ) {
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
        const sessionState = loadSessionState();
        const authUser = getAuthUserById(state, sessionState?.user_id);
        return {
          data: { session: toAuthSession(authUser, sessionState?.session_id || null) },
          error: null,
        };
      },
      getUser: async () => {
        const state = loadState();
        const sessionState = loadSessionState();
        const authUser = getAuthUserById(state, sessionState?.user_id);
        return {
          data: { user: toAuthSession(authUser, sessionState?.session_id || null)?.user || null },
          error: null,
        };
      },
      onAuthStateChange: (callback: AuthCallback) => {
        authListeners.add(callback);
        const state = loadState();
        const sessionState = loadSessionState();
        const authUser = getAuthUserById(state, sessionState?.user_id);
        callback('INITIAL_SESSION', toAuthSession(authUser, sessionState?.session_id || null));
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
        const sessionState = { user_id: newUser.id, session_id: makeId() };
        saveSessionState(sessionState);
        const session = toAuthSession(newUser, sessionState.session_id);
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

        const sessionState = { user_id: user.id, session_id: makeId() };
        saveSessionState(sessionState);
        const session = toAuthSession(user, sessionState.session_id);
        emitAuth('SIGNED_IN', session);
        return { data: { user: session?.user, session }, error: null };
      },
      signOut: async () => {
        saveSessionState(null);
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
        const sessionState = loadSessionState();
        if (!sessionState?.user_id) return { data: null, error: null };

        const existing = state.policy_views.find(
          (view) =>
            view.policy_id === policyId &&
            view.user_id === sessionState.user_id &&
            view.viewed_at.slice(0, 10) === todayIsoDate()
        );
        if (!existing) {
          state.policy_views.push({
            id: makeId(),
            policy_id: policyId,
            user_id: sessionState.user_id,
            viewed_at: nowIso(),
          });
          saveState(state);
        }
        return { data: null, error: null };
      }

      if (name === 'is_current_session_verified') {
        const state = loadState();
        return { data: !!getCurrentVerifiedSession(state), error: null };
      }

      if (name === 'get_dashboard_metrics') {
        const state = loadState();
        const period = typeof args.time_period === 'string' ? args.time_period : '30d';
        const metrics = computeDashboardMetrics(state, period);
        return { data: metrics, error: null };
      }

      if (name === 'get_district_participation_metrics') {
        const state = loadState();
        const period = typeof args.time_period === 'string' ? args.time_period : '30d';
        const data = computeDistrictMetrics(
          state,
          period,
          typeof args.policy_id === 'string' ? args.policy_id : null
        );
        return { data, error: null };
      }

      if (name === 'get_policy_analytics') {
        const state = loadState();
        const period = typeof args.time_period === 'string' ? args.time_period : '30d';
        return { data: computePolicyAnalytics(state, period), error: null };
      }

      if (name === 'admin_upsert_policy_workspace') {
        const state = deepClone(loadState());
        const sessionState = loadSessionState();
        const policy = upsertPolicyWorkspaceLocal(
          state,
          (args.payload || {}) as AdminPolicyWorkspacePayload,
          sessionState?.user_id
        );
        saveState(state);
        return { data: policy, error: null };
      }

      if (name === 'admin_delete_policy_workspace') {
        const state = deepClone(loadState());
        const policyId = String(args.policy_id || '');
        state.policies = state.policies.filter((policy) => policy.id !== policyId);
        state.policy_districts = state.policy_districts.filter((item) => item.policy_id !== policyId);
        state.policy_tags = state.policy_tags.filter((item) => item.policy_id !== policyId);
        state.policy_attachments = state.policy_attachments.filter((item) => item.policy_id !== policyId);
        state.policy_topics = state.policy_topics.filter((item) => item.policy_id !== policyId);
        state.policy_updates = state.policy_updates.filter((item) => item.policy_id !== policyId);
        state.events = state.events.filter((item) => item.policy_id !== policyId);
        state.feedback = state.feedback.filter((item) => item.policy_id !== policyId);
        state.sentiment_votes = state.sentiment_votes.filter((item) => item.policy_id !== policyId);
        state.policy_views = state.policy_views.filter((item) => item.policy_id !== policyId);
        state.policy_follows = state.policy_follows.filter((item) => item.policy_id !== policyId);
        saveState(state);
        return { data: { success: true }, error: null };
      }

      return { data: null, error: { message: `RPC ${name} is not available in local mode` } };
    },
    functions: {
      invoke: async (name: string, options?: { body?: Record<string, any> }) =>
        invokeLocalFunction(name, options?.body || {}),
    },
    channel: (name: string) => new LocalChannel(name),
    removeChannel: (channel: LocalChannel) => {
      channel.unsubscribe();
      return Promise.resolve({ data: null, error: null });
    },
  };
};
