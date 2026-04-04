import { memo } from 'react';
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
import { useSentimentVote } from '../../hooks/useFeedback';
import type { SentimentVote } from '../../types/policy.types';

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
  onSelect: (policy: Policy) => void;
  showVoteStatus?: boolean;
  refreshKey?: unknown;
  preloadedVote?: SentimentVote | null;
}

const STATUS_LABELS_EN: Record<string, string> = {
  active: 'Active',
  under_review: 'Under review',
  closed: 'Closed',
  draft: 'Draft',
};
const STATUS_LABELS_NO: Record<string, string> = {
  active: 'Aktiv',
  under_review: 'Under vurdering',
  closed: 'Lukket',
  draft: 'Utkast',
};


const VOTE_DOT: Record<string, string> = {
  positive: '#22c55e',
  neutral:  '#eab308',
  negative: '#ef4444',
};

const VOTE_EMOJI: Record<string, string> = {
  positive: '👍',
  neutral:  '😐',
  negative: '👎',
};

function PolicyCard({ policy, onSelect, showVoteStatus = false, refreshKey, preloadedVote }: PolicyCardProps) {
  const language = useLanguageStore((state) => state.language);
  const statusLabels = language === 'en' ? STATUS_LABELS_EN : STATUS_LABELS_NO;

  const bgColor = policy.category?.color || DEFAULT_COLOR;
  const Icon = CATEGORY_ICONS[policy.category?.name || ''] ?? Building2;

  // Use preloaded vote from parent batch query when available; fall back to per-card hook
  const { userVote: hookVote } = useSentimentVote(
    preloadedVote !== undefined ? '' : policy.id,
    refreshKey
  );
  const userVote = preloadedVote !== undefined ? preloadedVote : hookVote;
  const votedSentiment = userVote?.sentiment;

  return (
    <button type="button" onClick={() => onSelect(policy)} className="w-full text-left">
      <div
        className="relative flex min-h-[220px] w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-[20px] p-5 shadow-sm transition-opacity hover:opacity-90 sm:min-h-[260px] sm:gap-3 sm:p-6"
        style={{ backgroundColor: bgColor }}
      >
        {showVoteStatus && votedSentiment ? (
          <div className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow text-base backdrop-blur-sm"
               title={votedSentiment}>
            {VOTE_EMOJI[votedSentiment]}
            <span
              className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white"
              style={{ backgroundColor: VOTE_DOT[votedSentiment] }}
            />
          </div>
        ) : null}
        <Icon className="h-12 w-12 text-white sm:h-14 sm:w-14" strokeWidth={1.5} />
        <p className="max-w-[88%] text-center text-sm font-semibold leading-snug text-white line-clamp-2 sm:max-w-[80%]">
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
          {statusLabels[policy.status]}
        </Badge>
      </div>
    </button>
  );
}

export default memo(PolicyCard);
