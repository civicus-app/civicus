import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Badge } from '../ui/badge';
import type { DashboardMetrics, EngagementAnalytics } from '../../types/policy.types';
import { useLanguageStore } from '../../store/languageStore';

interface SentimentOverviewPanelProps {
  sentiment: DashboardMetrics['sentiment_distribution'];
  analytics: EngagementAnalytics[];
  rows?: {
    title: string;
    status: 'draft' | 'active' | 'under_review' | 'closed';
    engagement: number;
    rate: number;
  }[];
}

const COLORS = {
  positive: '#2daf56',
  neutral: '#f29b2a',
  negative: '#e54545',
};

export default function SentimentOverviewPanel({
  sentiment,
  analytics,
  rows,
}: SentimentOverviewPanelProps) {
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);
  const total = sentiment.positive + sentiment.neutral + sentiment.negative;

  const pieData = [
    { key: 'positive', name: tx('Positiv', 'Positive'), value: sentiment.positive },
    { key: 'neutral', name: tx('Noytral', 'Neutral'), value: sentiment.neutral },
    { key: 'negative', name: tx('Negativ', 'Negative'), value: sentiment.negative },
  ].filter((item) => item.value > 0);

  const activeAnalytics = analytics.filter(
    (item) =>
      item.engaged_users > 0 ||
      item.views_count > 0 ||
      item.votes_count > 0 ||
      item.feedback_count > 0
  );
  const maxEngagement = Math.max(...activeAnalytics.map((item) => item.engaged_users), 1);
  const policyRows =
    rows && rows.length
      ? rows
      : activeAnalytics.slice(0, 4).map((item) => ({
          title: item.title,
          status: item.status as 'draft' | 'active' | 'under_review' | 'closed',
          engagement: item.engaged_users,
          rate: Math.round((item.engaged_users / maxEngagement) * 100),
        }));

  return (
    <div className="overflow-hidden rounded-[28px] border border-[#d4dde9] bg-white shadow-sm">
      <div className="border-b border-[#d8e0eb] px-5 py-4">
        <h2 className="text-xl font-semibold text-[#2a4a70] sm:text-2xl">
          {tx('Stemningsoversikt', 'Sentiment overview')}
        </h2>
      </div>

      <div className="space-y-6 p-4 lg:p-5">
        <div className="flex flex-col items-center justify-center gap-5 text-center">
          <div className="relative mx-auto h-[150px] w-[150px] shrink-0 sm:h-[170px] sm:w-[170px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData.length ? pieData : [{ key: 'empty', name: 'empty', value: 1 }]}
                  dataKey="value"
                  innerRadius={48}
                  outerRadius={74}
                  stroke="#ffffff"
                  strokeWidth={2}
                  paddingAngle={2}
                >
                  {(pieData.length ? pieData : [{ key: 'empty' }]).map((entry) => (
                    <Cell
                      key={entry.key}
                      fill={
                        entry.key === 'empty'
                          ? '#dfe7f0'
                          : COLORS[entry.key as keyof typeof COLORS]
                      }
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7288a2]">
                {tx('Registrert', 'Recorded')}
              </p>
              <p className="mt-1 text-[1.65rem] font-semibold leading-none tracking-[-0.04em] text-[#173151]">
                {total.toLocaleString()}
              </p>
              <p className="mt-1 text-[11px] leading-4 text-[#617792]">
                {tx('reaksjoner', 'responses')}
              </p>
            </div>
          </div>

          <div className="grid w-full max-w-3xl grid-cols-3 gap-2">
            <SentimentStat
              label={tx('Positiv', 'Positive')}
              value={sentiment.positive}
              total={total}
              color={COLORS.positive}
            />
            <SentimentStat
              label={tx('Noytral', 'Neutral')}
              value={sentiment.neutral}
              total={total}
              color={COLORS.neutral}
            />
            <SentimentStat
              label={tx('Negativ', 'Negative')}
              value={sentiment.negative}
              total={total}
              color={COLORS.negative}
            />
          </div>
        </div>

        <div className="rounded-[24px] border border-[#d7dfea] bg-[#fbfcfe] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#173151]">
                {tx('Mest engasjerende saker', 'Most engaging policies')}
              </p>
              <p className="mt-1 text-xs text-[#617792]">
                {tx(
                  'De fire sakene med hoyest aktivitet i valgt periode',
                  'The four policies with the highest activity in the selected period'
                )}
              </p>
            </div>
            <Link
              to="/admin/policies"
              className="shrink-0 text-sm font-semibold text-[#2f70ba] hover:underline"
            >
              {tx('Se alle', 'View all')}
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {policyRows.length ? (
              policyRows.map((item) => (
                <div
                  key={`${item.title}-${item.status}`}
                  className="rounded-2xl border border-[#dde5ef] bg-white px-4 py-3"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#173151]">
                        {item.title}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant={item.status}>
                          {item.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-[#617792]">
                          {item.engagement.toLocaleString()} {tx('engasjerte', 'engaged')}
                        </span>
                      </div>
                    </div>

                    <div className="md:min-w-[180px]">
                      <div className="flex items-center justify-between gap-3 text-xs text-[#617792]">
                        <span className="pr-2">{tx('Engasjementsgrad', 'Engagement rate')}</span>
                        <span className="shrink-0 font-semibold text-[#173151]">{item.rate}%</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e8eef5]">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,#2f73c3_0%,#7aa6dd_100%)]"
                          style={{ width: `${Math.max(4, Math.min(100, item.rate))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-[#d5deea] bg-white px-4 py-8 text-center text-sm text-[#5a7190]">
                {tx('Ingen engasjementsdata tilgjengelig enda.', 'No engagement analytics available yet.')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface SentimentStatProps {
  label: string;
  value: number;
  total: number;
  color: string;
}

function SentimentStat({ label, value, total, color }: SentimentStatProps) {
  const percentage = total ? Math.round((value / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-[#dde5ef] bg-white px-2 py-2 text-center shadow-[0_8px_20px_rgba(24,49,81,0.04)]">
      <p className="text-lg font-semibold leading-none sm:text-xl" style={{ color }}>
        {percentage}%
      </p>
      <p className="mt-1 text-[11px] font-medium text-[#2a4a70] sm:text-xs">{label}</p>
    </div>
  );
}
