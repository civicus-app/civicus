import { useOutletContext } from 'react-router-dom';
import { useDashboard } from '../../hooks/useDashboard';
import MetricCard from '../../components/admin/MetricCard';
import FunnelChart from '../../components/charts/FunnelChart';
import DistrictMap from '../../components/admin/DistrictMap';
import AIInsights from '../../components/admin/AIInsights';
import SentimentOverviewPanel from '../../components/admin/SentimentOverviewPanel';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import type { AdminOutletContext } from '../../components/layouts/AdminLayout';
import { useLanguageStore } from '../../store/languageStore';

export default function AdminDashboard() {
  const { timePeriod } = useOutletContext<AdminOutletContext>();
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);
  const { metrics, analytics, loading, error } = useDashboard(timePeriod);

  if (loading) return <LoadingSpinner fullScreen />;
  if (!metrics) return null;

  const displayMetrics = metrics;

  const sentimentLabel =
    displayMetrics.avg_sentiment_score >= 4
      ? tx('Positiv', 'Positive')
      : displayMetrics.avg_sentiment_score >= 2.5
      ? tx('Noytral', 'Neutral')
      : tx('Negativ', 'Negative');

  return (
    <div className="space-y-4 lg:space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">
        <MetricCard title={tx('Aktive saker', 'Active policies')} value={displayMetrics.active_policies} />
        <MetricCard
          title={tx('Totale deltakere', 'Total participants')}
          value={displayMetrics.total_participants.toLocaleString()}
        />
        <MetricCard
          title={tx('Deltakelsesgrad', 'Participation rate')}
          value={`${displayMetrics.engagement_rate}%`}
        />
        <MetricCard
          title={tx('Ungdomsdeltakelse', 'Youth participation')}
          value={`${displayMetrics.youth_participation}%`}
        />
        <MetricCard
          title={tx('Snitt stemningsscore', 'Average sentiment score')}
          value={displayMetrics.avg_sentiment_score.toFixed(1)}
          label={sentimentLabel}
        />

        <div className="bg-white border border-[#d4dde9] rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-[#f2f5fa] border-b border-[#d8e0eb]">
            <p className="text-sm sm:text-base font-semibold text-[#2a4a70]">
              {tx('Topp tema:', 'Top issue:')}
            </p>
          </div>
          <div className="px-4 py-4">
            <p className="text-lg sm:text-xl lg:text-2xl leading-tight font-semibold text-[#2f5076] break-words">
              {displayMetrics.top_issue}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <section className="bg-white border border-[#d4dde9] rounded-xl shadow-sm">
          <header className="px-5 py-4 border-b border-[#d8e0eb]">
            <h2 className="text-xl sm:text-2xl font-semibold text-[#2a4a70]">
              {tx('Deltakelsestrakt', 'Participation funnel')}
            </h2>
          </header>
          <div className="p-4 lg:p-5">
            <FunnelChart data={displayMetrics.funnel_data} />
          </div>
        </section>

        <section className="bg-white border border-[#d4dde9] rounded-xl shadow-sm">
          <header className="px-5 py-4 border-b border-[#d8e0eb]">
            <h2 className="text-xl sm:text-2xl font-semibold text-[#2a4a70]">
              {tx('Deltakelse per bydel', 'Participation per district')}
            </h2>
          </header>
          <div className="p-4 lg:p-5">
            <DistrictMap />
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-4">
        <SentimentOverviewPanel
          sentiment={displayMetrics.sentiment_distribution}
          analytics={analytics}
        />

        <section className="bg-white border border-[#d4dde9] rounded-xl shadow-sm flex flex-col">
          <header className="px-5 py-4 border-b border-[#d8e0eb]">
            <h2 className="text-xl sm:text-2xl font-semibold text-[#2a4a70]">
              {tx('AI-oppsummering', 'AI summary')}
            </h2>
          </header>
          <div className="p-4 lg:p-5 flex-1">
            <AIInsights />
            {error ? (
              <p className="mt-3 text-xs text-[#6b7f99]">
                {tx('Noe analyse-data kunne ikke lastes:', 'Some analytics data could not be loaded:')} {error}
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
