import type { Category, Policy } from '../types/policy.types';

export type UiLanguage = 'no' | 'en';

export const getPolicyTitle = (policy: Pick<Policy, 'title' | 'title_no' | 'title_en'>, language: UiLanguage) => {
  if (language === 'en') return policy.title_en || policy.title_no || policy.title;
  return policy.title_no || policy.title || policy.title_en || '';
};

export const getPolicyDescription = (
  policy: Pick<Policy, 'description' | 'description_no' | 'description_en'>,
  language: UiLanguage
) => {
  if (language === 'en') return policy.description_en || policy.description_no || policy.description;
  return policy.description_no || policy.description || policy.description_en || '';
};

export const getCategoryLabel = (
  category: Pick<Category, 'name' | 'label_no' | 'label_en'> | null | undefined,
  language: UiLanguage
) => {
  if (!category) return '';
  if (language === 'en') return category.label_en || category.name || category.label_no || '';
  return category.label_no || category.name || category.label_en || '';
};

export const isCitizenVisiblePolicy = (policy: Pick<Policy, 'status' | 'is_published'>) =>
  policy.is_published !== false &&
  ['active', 'under_review', 'closed'].includes(policy.status);
