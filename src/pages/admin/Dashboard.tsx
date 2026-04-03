import { useOutletContext } from 'react-router-dom';
import { Activity, CircleGauge, FileStack, Target, Users2 } from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboard';
import { useDistrictMetrics } from '../../hooks/useAdmin';
import MetricCard from '../../components/admin/MetricCard';
import FunnelChart from '../../components/charts/FunnelChart';
import DistrictGeoMap from '../../components/admin/DistrictGeoMap';
import SentimentOverviewPanel from '../../components/admin/SentimentOverviewPanel';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import type { AdminOutletContext } from '../../components/layouts/AdminLayout';
import { useLanguageStore } from '../../store/languageStore';
import { supabase } from '../../lib/supabase';
import type { District } from '../../types';
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const { timePeriod } = useOutletContext<AdminOutletContext>();
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);
  const { metrics, analytics, loading } = useDashboard(timePeriod);
  const { metrics: districtMetrics } = useDistrictMetrics(timePeriod);
  const [districts, setDistricts] = useState<District[]>([]);

  useEffect(() => {
    supabase.from('districts').select('*').order('name', { ascending: true }).then(({ data }) => {
      setDistricts((data || []) as District[]);
    });
  }, []);

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
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-[repeat(6,minmax(0,1fr))]">
        <MetricCard
          title={tx('Aktive saker', 'Active policies')}
          value={displayMetrics.active_policies}
          icon={<FileStack className="h-4 w-4" />}
          tone="soft"
        />
        <MetricCard
          title={tx('Totale deltakere', 'Total participants')}
          value={displayMetrics.total_participants.toLocaleString()}
          icon={<Users2 className="h-4 w-4" />}
          tone="soft"
        />
        <MetricCard
          title={tx('Deltakelsesgrad', 'Participation rate')}
          value={`${displayMetrics.engagement_rate}%`}
          icon={<Target className="h-4 w-4" />}
          tone="soft"
        />
        <MetricCard
          title={tx('Ungdomsdeltakelse', 'Youth participation')}
          value={`${displayMetrics.youth_participation}%`}
          icon={<Activity className="h-4 w-4" />}
          tone="soft"
        />
        <MetricCard
          title={tx('Snitt stemningsscore', 'Average sentiment score')}
          value={displayMetrics.avg_sentiment_score.toFixed(1)}
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
              {displayMetrics.top_issue === 'N/A'
                ? tx('Ingen tydelig toppsak ennå', 'No clear leading issue yet')
                : displayMetrics.top_issue}
            </p>
            <p className="text-[10px] leading-4 text-[#6b7f99]">
              {tx(
                'Dette feltet oppdateres nar innspill og stemmer bygger et tydelig tyngdepunkt.',
                'This updates once votes and feedback create a clear concentration around one issue.'
              )}
            </p>
            <div className="inline-flex rounded-full border border-[#e1e8f0] bg-[#f5f8fb] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#4e6a90]">
              {displayMetrics.top_issue === 'N/A' ? tx('Venter pa data', 'Waiting for data') : tx('Aktiv innsikt', 'Live insight')}
            </div>
          </div>
        </div>
      </div>

      <SentimentOverviewPanel
        sentiment={displayMetrics.sentiment_distribution}
        analytics={analytics}
      />

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="overflow-hidden rounded-[28px] border border-[#d4dde9] bg-white shadow-sm">
          <header className="border-b border-[#d8e0eb] px-5 py-4">
            <h2 className="text-xl font-semibold text-[#2a4a70] sm:text-2xl">
              {tx('Deltakelsestrakt', 'Participation funnel')}
            </h2>
          </header>
          <div className="p-4 lg:p-5">
            <FunnelChart data={displayMetrics.funnel_data} />
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-[#d4dde9] bg-white shadow-sm">
          <header className="border-b border-[#d8e0eb] px-5 py-4">
            <h2 className="text-xl font-semibold text-[#2a4a70] sm:text-2xl">
              {tx('Deltakelse per bydel', 'Participation per district')}
            </h2>
          </header>
          <div className="p-4 lg:p-5">
            <DistrictGeoMap
              districts={districts}
              metrics={districtMetrics}
              heightClassName="h-[300px]"
            />
          </div>
        </section>
      </div>

    </div>
  );
}
