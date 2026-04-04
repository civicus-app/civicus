import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Activity, CircleGauge, FileStack, Target, Users2 } from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboard';
import { useDistrictMetrics } from '../../hooks/useAdmin';
import MetricCard from '../../components/admin/MetricCard';
import DistrictGeoMap from '../../components/admin/DistrictGeoMap';
import SentimentOverviewPanel from '../../components/admin/SentimentOverviewPanel';
import PolicyParticipationRow from '../../components/admin/PolicyParticipationRow';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import type { AdminOutletContext } from '../../components/layouts/AdminLayout';
import { useLanguageStore } from '../../store/languageStore';

export default function AdminDashboard() {
  const { timePeriod } = useOutletContext<AdminOutletContext>();
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);
  const { metrics, analytics, districts, loading } = useDashboard(timePeriod);
  const { metrics: districtMetrics } = useDistrictMetrics(timePeriod);

  const activeAnalytics = useMemo(
    () => analytics.filter((item) => item.views_count > 0 || item.engaged_users > 0),
    [analytics]
  );

  const featuredAnalytics = useMemo(
    () =>
      [...activeAnalytics]
        .sort(
          (left, right) =>
            right.engaged_users + right.votes_count + right.feedback_count -
            (left.engaged_users + left.votes_count + left.feedback_count)
        )
        .slice(0, 5),
    [activeAnalytics]
  );

  const averageVoteConversion = useMemo(() => {
    if (!featuredAnalytics.length) return 0;
    const total = featuredAnalytics.reduce((sum, item) => {
      if (item.views_count === 0) return sum;
      return sum + (item.votes_count / item.views_count) * 100;
    }, 0);
    return total / featuredAnalytics.length;
  }, [featuredAnalytics]);

  if (loading) return <LoadingSpinner fullScreen />;
  if (!metrics) return null;

  const sentimentLabel =
    metrics.avg_sentiment_score >= 4
      ? tx('Positiv', 'Positive')
      : metrics.avg_sentiment_score >= 2.5
      ? tx('Noytral', 'Neutral')
      : tx('Negativ', 'Negative');

  return (
    <div className="space-y-4 lg:space-y-5">
      <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 xl:grid-cols-[repeat(6,minmax(0,1fr))]">
        <MetricCard
          title={tx('Aktive saker', 'Active policies')}
          value={metrics.active_policies}
          icon={<FileStack className="h-4 w-4" />}
          tone="soft"
        />
        <MetricCard
          title={tx('Totale deltakere', 'Total participants')}
          value={metrics.total_participants.toLocaleString()}
          icon={<Users2 className="h-4 w-4" />}
          tone="soft"
        />
        <MetricCard
          title={tx('Deltakelsesgrad', 'Participation rate')}
          value={`${metrics.engagement_rate}%`}
          icon={<Target className="h-4 w-4" />}
          tone="soft"
        />
        <MetricCard
          title={tx('Ungdomsdeltakelse', 'Youth participation')}
          value={`${metrics.youth_participation}%`}
          icon={<Activity className="h-4 w-4" />}
          tone="soft"
        />
        <MetricCard
          title={tx('Snitt stemningsscore', 'Average sentiment score')}
          value={metrics.avg_sentiment_score.toFixed(1)}
          label={sentimentLabel}
          icon={<CircleGauge className="h-4 w-4" />}
          tone="soft"
        />

        <div className="overflow-hidden rounded-[18px] border border-[#dbe3ec] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbfd_100%)] shadow-[0_8px_22px_rgba(24,49,81,0.045)]">
          <div className="border-b border-[#e4ebf3] px-2.5 py-2">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#7388a2]">
              {tx('Topp tema', 'Top issue')}
            </p>
          </div>
          <div className="space-y-1 px-2.5 py-2.5">
            <p className="text-[13px] leading-tight font-semibold text-[#173151] sm:text-sm">
              {metrics.top_issue === 'N/A'
                ? tx('Ingen tydelig toppsak ennå', 'No clear leading issue yet')
                : metrics.top_issue}
            </p>
            <p className="text-[10px] leading-4 text-[#6b7f99]">
              {tx(
                'Dette feltet oppdateres nar innspill og stemmer bygger et tydelig tyngdepunkt.',
                'This updates once votes and feedback create a clear concentration around one issue.'
              )}
            </p>
            <div className="inline-flex rounded-full border border-[#e1e8f0] bg-[#f5f8fb] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#4e6a90]">
              {metrics.top_issue === 'N/A' ? tx('Venter pa data', 'Waiting for data') : tx('Aktiv innsikt', 'Live insight')}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
        <section className="overflow-hidden rounded-[28px] border border-[#d4dde9] bg-white shadow-sm sm:h-[560px] xl:h-[700px]">
          <SentimentOverviewPanel
            sentiment={metrics.sentiment_distribution}
            analytics={analytics}
          />
        </section>

        <section className="h-[460px] overflow-hidden rounded-[28px] border border-[#d4dde9] bg-white shadow-sm sm:h-[560px] xl:h-[700px]">
          <header className="border-b border-[#d8e0eb] px-4 py-4 sm:px-5">
            <h2 className="text-xl font-semibold text-[#2a4a70] sm:text-2xl">
              {tx('Deltakelse per bydel', 'Participation per district')}
            </h2>
          </header>
          <div className="h-[calc(100%-80px)] p-3 sm:p-4 lg:p-5">
            <DistrictGeoMap
              districts={districts}
              metrics={districtMetrics}
              heightClassName="h-full"
            />
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-[28px] border border-[#d4dde9] bg-white shadow-sm">
        <header className="border-b border-[#d8e0eb] px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#2a4a70] sm:text-2xl">
                {tx('Politisk deltakelse', 'Policy participation')}
              </h2>
              <p className="mt-1 text-sm text-[#6b7f99]">
                {tx(
                  'Flaggskipvisning med tydelig hoved-KPI, deltakelsesflyt og stemningsmiks per sak.',
                  'Flagship view with a clear primary KPI, participation flow, and sentiment mix per policy.'
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#dde6f0] bg-[#f7fafc] px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#7086a0]">
                  {tx('Sporer', 'Tracking')}
                </p>
                <p className="mt-1 text-lg font-semibold text-[#173151]">
                  {featuredAnalytics.length}
                </p>
              </div>
              <div className="rounded-2xl border border-[#dde6f0] bg-[#f7fafc] px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#7086a0]">
                  {tx('Snitt stemmekonvertering', 'Avg vote conversion')}
                </p>
                <p className="mt-1 text-lg font-semibold text-[#173151]">
                  {averageVoteConversion.toFixed(0)}%
                </p>
              </div>
              <div className="rounded-2xl border border-[#dde6f0] bg-[#f7fafc] px-3 py-2 col-span-2 sm:col-span-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#7086a0]">
                  {tx('Sortering', 'Sort order')}
                </p>
                <p className="mt-1 text-sm font-semibold text-[#173151]">
                  {tx('Mest aktivitet først', 'Most active first')}
                </p>
              </div>
            </div>
          </div>
        </header>
        <div className="p-3 sm:p-4 lg:p-5">
          <div className="space-y-4">
            {featuredAnalytics.map((policyAnalytics) => (
                <PolicyParticipationRow
                  key={policyAnalytics.policy_id}
                  analytics={policyAnalytics}
                />
              ))}
          </div>
          {featuredAnalytics.length === 0 && (
            <div className="text-center py-8 text-[#5a7190]">
              {tx('Ingen deltakelsesdata tilgjengelig ennå.', 'No participation data available yet.')}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
