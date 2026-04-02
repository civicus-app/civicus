export const POLICY_CATEGORIES = [
  'Housing',
  'Transportation',
  'Environment',
  'Education',
  'Healthcare',
  'Culture',
  'Other',
] as const;

export const POLICY_STATUSES = [
  { value: 'draft', label: 'Utkast' },
  { value: 'active', label: 'Aktiv' },
  { value: 'under_review', label: 'Under vurdering' },
  { value: 'closed', label: 'Lukket' },
] as const;

export const TIME_PERIODS = [
  { value: '7d', label: 'Siste 7 dager' },
  { value: '30d', label: 'Siste 30 dager' },
  { value: '90d', label: 'Siste 90 dager' },
] as const;

export const SENTIMENT_OPTIONS = [
  { value: 'positive', label: 'Positiv', emoji: '+', color: '#10B981' },
  { value: 'neutral', label: 'Noytral', emoji: '0', color: '#F59E0B' },
  { value: 'negative', label: 'Negativ', emoji: '-', color: '#EF4444' },
] as const;

export const APP_NAME = 'CIVICUS';
export const MUNICIPALITY_NAME = 'Tromso Kommune';
export const ITEMS_PER_PAGE = 10;
