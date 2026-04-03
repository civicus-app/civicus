import { Link } from 'react-router-dom';
import {
  Bus,
  Home,
  Leaf,
  Music,
  BookOpen,
  Building2,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '../ui/badge';
import type { Policy } from '../../types/policy.types';
import { useLanguageStore } from '../../store/languageStore';
import { getCategoryLabel, getPolicyTitle } from '../../lib/policyContent';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Transportation: Bus,
  Housing: Home,
  Environment: Leaf,
  Culture: Music,
  Education: BookOpen,
};

const DEFAULT_COLOR = '#3B82F6';

interface PolicyCardProps {
  policy: Policy;
  engagementCount?: number;
}

export default function PolicyCard({ policy }: PolicyCardProps) {
  const language = useLanguageStore((state) => state.language);
  const statusLabel: Record<string, string> = {
    active: language === 'en' ? 'Active' : 'Aktiv',
    under_review: language === 'en' ? 'Under review' : 'Under vurdering',
    closed: language === 'en' ? 'Closed' : 'Lukket',
    draft: language === 'en' ? 'Draft' : 'Utkast',
  };

  const bgColor = policy.category?.color || DEFAULT_COLOR;
  const categoryName = policy.category?.name || '';
  const Icon = CATEGORY_ICONS[categoryName] ?? Building2;

  return (
    <Link to={`/policies/${policy.id}`}>
      <div
        className="rounded-[20px] aspect-square flex flex-col items-center justify-center gap-3 p-6 cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
        style={{ backgroundColor: bgColor }}
      >
        <Icon className="h-14 w-14 text-white" strokeWidth={1.5} />
        <p className="text-center text-white font-semibold text-sm leading-snug line-clamp-2 max-w-[80%]">
          {getPolicyTitle(policy, language)}
        </p>
        {policy.category && (
          <span className="text-white/70 text-xs font-medium">
            {getCategoryLabel(policy.category, language)}
          </span>
        )}
        <Badge
          variant={policy.status as 'active' | 'under_review' | 'closed' | 'draft'}
          className="bg-white/20 text-white border-white/30 text-xs"
        >
          {statusLabel[policy.status]}
        </Badge>
      </div>
    </Link>
  );
}
