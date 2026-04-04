import { useEffect, useRef, useState } from 'react';
import { X, MessageSquare, ThumbsUp, ThumbsDown, Minus, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLanguageStore } from '../../store/languageStore';
import type { Feedback } from '../../types/policy.types';
import { formatDate } from '../../lib/utils';

interface PolicyFeedbackDrawerProps {
  policyId: string;
  policyTitle: string;
  onClose: () => void;
}

const SENTIMENT_CONFIG = {
  positive: { icon: ThumbsUp,  bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', emoji: '👍' },
  neutral:  { icon: Minus,     bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   emoji: '😐' },
  negative: { icon: ThumbsDown,bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700',     emoji: '👎' },
} as const;

export default function PolicyFeedbackDrawer({ policyId, policyTitle, onClose }: PolicyFeedbackDrawerProps) {
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from('feedback')
      .select('*, profiles(full_name, avatar_url)')
      .eq('policy_id', policyId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        setFeedback((data as Feedback[]) || []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [policyId]);

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const counts = feedback.reduce(
    (acc, f) => {
      if (f.sentiment) acc[f.sentiment] = (acc[f.sentiment] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end bg-slate-950/40 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div
        ref={drawerRef}
        className="relative flex h-full w-full flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-200 sm:max-w-[480px]"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#e8eef5] px-4 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 shrink-0 text-[#3a5c87]" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6b7f99]">
                {tx('Tilbakemeldinger', 'Feedback')}
              </span>
            </div>
            <h2 className="mt-1.5 truncate text-lg font-semibold text-[#173151]">{policyTitle}</h2>
          </div>
          <button
            onClick={onClose}
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d8e2ef] text-[#537197] transition hover:bg-[#eef3f8]"
            aria-label={tx('Lukk', 'Close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sentiment summary */}
        {!loading && feedback.length > 0 && (
          <div className="grid grid-cols-3 gap-2 border-b border-[#e8eef5] px-4 py-4 sm:gap-3 sm:px-6">
            {(['positive', 'neutral', 'negative'] as const).map((s) => {
              const cfg = SENTIMENT_CONFIG[s];
              return (
                <div key={s} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${cfg.bg} ${cfg.border}`}>
                  <span className="text-lg leading-none">{cfg.emoji}</span>
                  <span className={`text-xl font-bold tabular-nums leading-none ${cfg.text}`}>
                    {counts[s] ?? 0}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Feed */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#d7e2f0] border-t-[#2f70ba]" />
            </div>
          ) : feedback.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <MessageSquare className="h-10 w-10 text-[#c8d5e4]" />
              <p className="text-sm font-medium text-[#6b7f99]">
                {tx('Ingen tilbakemeldinger ennå', 'No feedback yet')}
              </p>
              <p className="text-xs text-[#9aafc5]">
                {tx('Tilbakemeldinger fra borgere vises her.', 'Citizen feedback will appear here.')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {feedback.map((item) => {
                const cfg = item.sentiment ? SENTIMENT_CONFIG[item.sentiment] : null;
                const name = item.is_anonymous
                  ? tx('Anonym', 'Anonymous')
                  : item.profiles?.full_name || tx('Ukjent bruker', 'Unknown user');
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-[#e8eef5] bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8eef5] text-[#537197]">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#173151]">{name}</p>
                          <p className="text-[11px] text-[#9aafc5]">{formatDate(item.created_at)}</p>
                        </div>
                      </div>
                      {cfg && (
                        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                          {cfg.emoji} {item.sentiment}
                        </span>
                      )}
                    </div>
                    {item.content && (
                      <p className="mt-3 text-sm leading-relaxed text-[#4e6482]">{item.content}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer count */}
        {!loading && feedback.length > 0 && (
          <div className="border-t border-[#e8eef5] px-4 py-3 text-xs text-[#9aafc5] sm:px-6">
            {tx(`${feedback.length} tilbakemeldinger totalt`, `${feedback.length} feedback entries total`)}
          </div>
        )}
      </div>
    </div>
  );
}
