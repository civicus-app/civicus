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

  const maxEngagement = Math.max(...analytics.map((item) => item.engaged_users), 1);
  const tableRows =
    rows && rows.length
      ? rows
      : analytics.slice(0, 4).map((item) => ({
          title: item.title,
          status: item.status as 'draft' | 'active' | 'under_review' | 'closed',
          engagement: item.engaged_users,
          rate: Math.round((item.engaged_users / maxEngagement) * 100),
        }));

  return (
    <div className="bg-white border border-[#d4dde9] rounded-xl shadow-sm h-full">
      <div className="px-5 py-4 border-b border-[#d8e0eb]">
        <h2 className="text-xl sm:text-2xl font-semibold text-[#2a4a70]">
          {tx('Stemningsoversikt', 'Sentiment Overview')}
        </h2>
      </div>

      <div className="p-4 lg:p-5 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 items-start">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-[148px] h-[148px] sm:w-[172px] sm:h-[172px] mx-auto sm:mx-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  innerRadius={42}
                  outerRadius={71}
                  stroke="#ffffff"
                  strokeWidth={2}
                  paddingAngle={2}
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.key}
                      fill={COLORS[entry.key as keyof typeof COLORS]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2.5">
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

        <div className="border border-[#d5deea] rounded-md overflow-x-auto">
          <table className="w-full min-w-[470px]">
            <thead className="bg-[#edf2f8]">
              <tr className="text-left">
                <th className="px-3 py-2.5 text-sm font-semibold text-[#2d4d71]">
                  {tx('Sak', 'Policy')}
                </th>
                <th className="px-3 py-2.5 text-sm font-semibold text-[#2d4d71]">
                  {tx('Status', 'Status')}
                </th>
                <th className="px-3 py-2.5 text-right text-sm font-semibold text-[#2d4d71]">
                  {tx('Engasjement', 'Engagement')}
                </th>
                <th className="px-3 py-2.5 text-right text-sm font-semibold text-[#2d4d71]">
                  {tx('Grad', 'Rate')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e1e7f0] bg-white">
              {tableRows.length ? (
                tableRows.map((item) => {
                  return (
                    <tr key={`${item.title}-${item.status}`}>
                      <td className="px-3 py-2.5 text-sm text-[#2a4a70] font-medium max-w-[220px] truncate">
                        {item.title}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge variant={item.status}>
                          {item.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-right text-sm font-semibold text-[#2b4a6d]">
                        {item.engagement.toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5 text-right text-sm font-semibold text-[#2ca85d]">
                        {item.rate}%
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-sm text-[#5a7190]">
                    {tx('Ingen engasjementsdata tilgjengelig enda.', 'No engagement analytics available yet.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="px-3 py-2.5 bg-[#f7f9fc] border-t border-[#e1e7f0] flex justify-end">
            <Link
              to="/admin/policies"
              className="text-sm text-[#2f70ba] font-semibold hover:underline"
            >
              {tx('Se alle', 'View all')} &gt;
            </Link>
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
    <div className="flex items-baseline gap-2">
      <span className="text-2xl sm:text-3xl font-semibold leading-none" style={{ color }}>
        {percentage}%
      </span>
      <span className="text-base sm:text-lg text-[#2a4a70]">{label}</span>
    </div>
  );
}
