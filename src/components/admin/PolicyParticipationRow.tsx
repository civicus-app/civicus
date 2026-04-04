import { Eye, MessageSquare, Vote, Users, TrendingUp } from 'lucide-react';
import type { EngagementAnalytics } from '../../types/policy.types';
import { useLanguageStore } from '../../store/languageStore';

interface PolicyParticipationRowProps {
  analytics: EngagementAnalytics;
}

const PolicyParticipationRow = ({ analytics }: PolicyParticipationRowProps) => {
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);

  const viewed   = analytics.views_count;
  const engaged  = analytics.engaged_users;
  const feedback = analytics.feedback_count;
  const votes    = analytics.votes_count;

  const voteConversion = viewed > 0 ? (votes / viewed) * 100 : 0;
  const engagementRate = viewed > 0 ? (engaged / viewed) * 100 : 0;
  const feedbackRate = viewed > 0 ? (feedback / viewed) * 100 : 0;

  const posPct = votes > 0 ? (analytics.positive_count / votes) * 100 : 0;
  const neuPct = votes > 0 ? (analytics.neutral_count / votes) * 100 : 0;
  const negPct = votes > 0 ? (analytics.negative_count / votes) * 100 : 0;

  const summaryMetrics = [
    {
      key: 'views',
      label: tx('Visninger', 'Views'),
      value: viewed,
      Icon: Eye,
      iconClassName: 'text-sky-600',
      surfaceClassName: 'bg-sky-50 border-sky-100',
    },
    {
      key: 'engaged',
      label: tx('Engasjerte', 'Engaged'),
      value: engaged,
      Icon: Users,
      iconClassName: 'text-violet-600',
      surfaceClassName: 'bg-violet-50 border-violet-100',
    },
    {
      key: 'comments',
      label: tx('Kommentarer', 'Comments'),
      value: feedback,
      Icon: MessageSquare,
      iconClassName: 'text-cyan-600',
      surfaceClassName: 'bg-cyan-50 border-cyan-100',
    },
    {
      key: 'votes',
      label: tx('Stemmer', 'Votes'),
      value: votes,
      Icon: Vote,
      iconClassName: 'text-emerald-600',
      surfaceClassName: 'bg-emerald-50 border-emerald-100',
    },
  ];

  const voteConversionLabel =
    voteConversion >= 20
      ? tx('Høy deltakelse', 'High participation')
      : voteConversion >= 8
      ? tx('Moderat deltakelse', 'Moderate participation')
      : tx('Trenger oppmerksomhet', 'Needs attention');

  const voteConversionTone =
    voteConversion >= 20
      ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
      : voteConversion >= 8
      ? 'text-amber-700 bg-amber-50 border-amber-100'
      : 'text-rose-700 bg-rose-50 border-rose-100';

  const funnelRows = [
    { key: 'viewed', label: tx('Så saken', 'Saw policy'), value: viewed, percent: 100, barClassName: 'bg-slate-900' },
    { key: 'engaged', label: tx('Interagerte', 'Interacted'), value: engaged, percent: engagementRate, barClassName: 'bg-violet-500' },
    { key: 'comments', label: tx('Kommenterte', 'Commented'), value: feedback, percent: feedbackRate, barClassName: 'bg-cyan-500' },
    { key: 'votes', label: tx('Stemte', 'Voted'), value: votes, percent: voteConversion, barClassName: 'bg-emerald-500' },
  ];

  return (
    <article className="rounded-[24px] border border-[#d9e3ee] bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] p-5 shadow-[0_12px_30px_rgba(18,53,94,0.06)] transition-colors hover:border-[#c8d7e8]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="min-w-0 flex-1 truncate text-base font-semibold text-[#173151] sm:text-lg">
              {analytics.title}
            </h3>
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${voteConversionTone}`}>
              <TrendingUp className="h-3.5 w-3.5" />
              {voteConversionLabel}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
            {summaryMetrics.map(({ key, label, value, Icon, iconClassName, surfaceClassName }) => (
              <div key={key} className={`rounded-2xl border px-3.5 py-3 ${surfaceClassName}`}>
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b7f99]">
                  <Icon className={`h-3.5 w-3.5 ${iconClassName}`} />
                  {label}
                </div>
                <p className="mt-2 text-xl font-semibold tabular-nums text-[#173151]">
                  {value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        <aside className="w-full shrink-0 rounded-[22px] border border-[#dce7f2] bg-[#fdfefe] p-4 lg:w-[240px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b7f99]">
            {tx('Primær KPI', 'Primary KPI')}
          </p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-3xl font-semibold tabular-nums text-[#102a43]">
                {voteConversion.toFixed(0)}%
              </p>
              <p className="mt-1 text-sm text-[#516781]">
                {tx('av visningene endte i stemme', 'of viewers ended in a vote')}
              </p>
            </div>
            <div className="rounded-2xl bg-[#edf6ff] px-3 py-2 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5d7593]">
                {tx('Kommentar-rate', 'Comment rate')}
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-[#173151]">
                {feedbackRate.toFixed(0)}%
              </p>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e6edf5]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#0f766e_0%,#10b981_100%)]"
              style={{ width: `${Math.min(voteConversion, 100)}%` }}
            />
          </div>
        </aside>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(240px,0.75fr)]">
        <section className="rounded-[22px] border border-[#e2ebf4] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#173151]">
                {tx('Deltakelsesflyt', 'Participation flow')}
              </p>
              <p className="text-xs text-[#6b7f99]">
                {tx('Fra visning til handling', 'From exposure to action')}
              </p>
            </div>
            <p className="text-xs font-medium text-[#6b7f99]">
              {engagementRate.toFixed(0)}% {tx('engasjert', 'engaged')}
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {funnelRows.map((row) => (
              <div key={row.key} className="grid grid-cols-[88px_minmax(0,1fr)_64px] items-center gap-3">
                <span className="text-xs font-medium text-[#5d7593]">{row.label}</span>
                <div className="h-2 overflow-hidden rounded-full bg-[#edf2f7]">
                  <div className={`h-full rounded-full ${row.barClassName}`} style={{ width: `${Math.min(row.percent, 100)}%` }} />
                </div>
                <span className="text-right text-xs font-semibold tabular-nums text-[#173151]">
                  {row.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[22px] border border-[#e2ebf4] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#173151]">
                {tx('Stemningsmiks', 'Sentiment mix')}
              </p>
              <p className="text-xs text-[#6b7f99]">
                {tx('Fordeling av stemmene', 'Distribution of submitted votes')}
              </p>
            </div>
            <p className="text-xs font-medium text-[#6b7f99]">
              {votes.toLocaleString()} {tx('stemmer', 'votes')}
            </p>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#edf2f7]">
            <div className="flex h-full w-full overflow-hidden rounded-full">
              <div className="bg-emerald-500" style={{ width: `${posPct}%` }} />
              <div className="bg-amber-400" style={{ width: `${neuPct}%` }} />
              <div className="bg-rose-500" style={{ width: `${negPct}%` }} />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-emerald-50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                {tx('Positive', 'Positive')}
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-emerald-800">{posPct.toFixed(0)}%</p>
            </div>
            <div className="rounded-2xl bg-amber-50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">
                {tx('Nøytrale', 'Neutral')}
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-amber-800">{neuPct.toFixed(0)}%</p>
            </div>
            <div className="rounded-2xl bg-rose-50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-700">
                {tx('Negative', 'Negative')}
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-rose-800">{negPct.toFixed(0)}%</p>
            </div>
          </div>
        </section>
      </div>
    </article>
  );
};

export default PolicyParticipationRow;
