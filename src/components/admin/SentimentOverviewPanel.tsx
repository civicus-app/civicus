import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis } from 'recharts';
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

const STATUS_LABELS = {
  draft: { no: 'Utkast', en: 'Draft' },
  active: { no: 'Aktiv', en: 'Active' },
  under_review: { no: 'Under vurdering', en: 'Under review' },
  closed: { no: 'Lukket', en: 'Closed' },
} as const;

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
      : activeAnalytics.map((item) => ({
          title: item.title,
          status: item.status as 'draft' | 'active' | 'under_review' | 'closed',
          engagement: item.engaged_users,
          rate: Math.round((item.engaged_users / maxEngagement) * 100),
        }));
  const sortedPolicyRows = [...policyRows].sort((a, b) => b.engagement - a.engagement);
  const mobilePolicyRows = sortedPolicyRows.slice(0, 4).map((item, index) => ({
    ...item,
    shortLabel: `P${index + 1}`,
  }));
  const formatStatusLabel = (status: keyof typeof STATUS_LABELS) =>
    language === 'en' ? STATUS_LABELS[status].en : STATUS_LABELS[status].no;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[#d8e0eb] px-5 py-4">
        <h2 className="text-xl font-semibold text-[#2a4a70] sm:text-2xl">
          {tx('Stemningsoversikt', 'Sentiment overview')}
        </h2>
      </div>

      <div className="space-y-6 p-4 sm:flex-1 sm:overflow-y-auto lg:p-5">
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
                  'Saker med aktivitet i valgt periode',
                  'Policies with activity in the selected period'
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

          <div className="mt-4">
            {sortedPolicyRows.length ? (
              <>
                <div className="sm:hidden">
                  <div className="rounded-2xl border border-[#dde5ef] bg-white p-3 shadow-sm">
                    <div className="h-[164px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mobilePolicyRows} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                          <CartesianGrid vertical={false} stroke="#edf2f7" />
                          <XAxis
                            dataKey="shortLabel"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#5d7593', fontSize: 10, fontWeight: 700 }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#7b91aa', fontSize: 10 }}
                            width={26}
                          />
                          <Bar dataKey="engagement" radius={[8, 8, 0, 0]} fill="#2f73c3" maxBarSize={42} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="mt-3 space-y-2">
                      {mobilePolicyRows.map((item) => (
                        <div
                          key={`${item.shortLabel}-${item.title}-${item.status}`}
                          className="grid grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-[#e6edf5] bg-[#fbfcfe] px-3 py-2"
                        >
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#eaf2fb] text-[11px] font-semibold text-[#2f73c3]">
                            {item.shortLabel}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-[#173151]">{item.title}</p>
                            <p className="text-[11px] text-[#6b7f99]">{formatStatusLabel(item.status)}</p>
                          </div>
                          <span className="text-xs font-semibold tabular-nums text-[#173151]">
                            {item.engagement.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="hidden flex-wrap gap-3 sm:flex">
                  {sortedPolicyRows.slice(0, 4).map((item, index) => (
                    <div
                      key={`${item.title}-${item.status}`}
                      className="flex flex-col items-center rounded-xl border border-[#dde5ef] bg-white px-3 py-3 text-center shadow-sm"
                    >
                      <p className="truncate text-xs font-semibold text-[#173151] w-24">
                        {item.title}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant={item.status} className="text-[10px] px-2 py-0.5">
                          {formatStatusLabel(item.status)}
                        </Badge>
                      </div>
                      <div className="mt-3 relative h-16 w-16">
                        <svg className="h-full w-full transform -rotate-90" viewBox="0 0 60 60">
                          <circle
                            cx="30"
                            cy="30"
                            r="26"
                            fill="none"
                            stroke="#e8eef5"
                            strokeWidth="4"
                          />
                          <circle
                            cx="30"
                            cy="30"
                            r="26"
                            fill="none"
                            stroke={`url(#grad-${index})`}
                            strokeWidth="4"
                            strokeDasharray={`${(item.rate / 100) * (2 * Math.PI * 26)} ${2 * Math.PI * 26}`}
                            strokeLinecap="round"
                          />
                          <defs>
                            <linearGradient id={`grad-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#2f73c3" />
                              <stop offset="100%" stopColor="#7aa6dd" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-lg font-bold text-[#173151]">{item.rate}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#d5deea] bg-white px-4 py-6 text-center text-sm text-[#5a7190]">
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
