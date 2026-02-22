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
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'closed', label: 'Closed' },
] as const;

export const TIME_PERIODS = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
] as const;

export const SENTIMENT_OPTIONS = [
  { value: 'positive', label: 'Positive', emoji: '👍', color: '#10B981' },
  { value: 'neutral', label: 'Neutral', emoji: '🤝', color: '#F59E0B' },
  { value: 'negative', label: 'Negative', emoji: '👎', color: '#EF4444' },
] as const;

export const APP_NAME = 'CIVICUS';
export const MUNICIPALITY_NAME = 'Tromsø Kommune';
export const ITEMS_PER_PAGE = 10;
