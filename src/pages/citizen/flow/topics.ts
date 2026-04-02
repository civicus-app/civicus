import type { PolicyTopic } from '../../../types/policy.types';

export const DEFAULT_FLOW_TOPICS: PolicyTopic[] = [
  {
    id: 'default-bedre-sykkelveier',
    policy_id: 'default',
    slug: 'bedre-sykkelveier',
    label_no: 'Bedre Sykkelveier',
    label_en: 'Better Bike Lanes',
    description_no: 'Tryggere ruter for hverdag, skolevei og pendling.',
    description_en: 'Safer routes for everyday travel, school runs, and commuting.',
    icon_key: 'bedre-sykkelveier',
    sort_order: 1,
    created_at: '',
  },
  {
    id: 'default-flere-gronne-soner',
    policy_id: 'default',
    slug: 'flere-gronne-soner',
    label_no: 'Flere Gronne Soner',
    label_en: 'More Green Zones',
    description_no: 'Tiltak for luftkvalitet, trivsel og mer bynatur.',
    description_en: 'Measures for air quality, comfort, and more urban greenery.',
    icon_key: 'flere-gronne-soner',
    sort_order: 2,
    created_at: '',
  },
  {
    id: 'default-budsjett-kostnad',
    policy_id: 'default',
    slug: 'budsjett-kostnad',
    label_no: 'Budsjett & Kostnad',
    label_en: 'Budget & Cost',
    description_no: 'Kostnader, finansiering og prioriteringer.',
    description_en: 'Costs, financing, and delivery priorities.',
    icon_key: 'budsjett-kostnad',
    sort_order: 3,
    created_at: '',
  },
  {
    id: 'default-anleggsperioder',
    policy_id: 'default',
    slug: 'anleggsperioder',
    label_no: 'Anleggsperioder',
    label_en: 'Construction Periods',
    description_no: 'Hvordan prosjektet gjennomfores med minst mulig belastning.',
    description_en: 'How the project is delivered with minimal disruption.',
    icon_key: 'anleggsperioder',
    sort_order: 4,
    created_at: '',
  },
] as const;

export const getFlowTopics = (topics?: PolicyTopic[]) => {
  if (!topics?.length) return DEFAULT_FLOW_TOPICS;
  return [...topics].sort((left, right) => left.sort_order - right.sort_order);
};

export const getTopicLabel = (
  slug: string,
  language: 'no' | 'en' = 'no',
  topics?: PolicyTopic[]
) => {
  const topic = getFlowTopics(topics).find((item) => item.slug === slug);
  if (!topic) {
    return language === 'en' ? 'Topic' : 'Tema';
  }
  return language === 'en' ? topic.label_en : topic.label_no;
};
