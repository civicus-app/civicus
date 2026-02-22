import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePolicies } from '../../hooks/usePolicies';
import { useDashboard } from '../../hooks/useDashboard';
import MetricCard from '../../components/admin/MetricCard';
import FunnelChart from '../../components/charts/FunnelChart';
import DistrictMap from '../../components/admin/DistrictMap';
import AIInsights from '../../components/admin/AIInsights';
import SentimentOverviewPanel from '../../components/admin/SentimentOverviewPanel';
import PolicyCard from '../../components/citizen/PolicyCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function CitizenHome() {
  const { profile } = useAuth();
  const { policies, loading: policiesLoading } = usePolicies({
    status: 'active',
    limit: 6,
  });
  const { metrics, analytics, loading: dashboardLoading } = useDashboard('30d');

  if (dashboardLoading && policiesLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!metrics) return null;

  const displayMetrics = metrics;

  const sentimentLabel =
    displayMetrics.avg_sentiment_score >= 4
      ? 'Positive'
      : displayMetrics.avg_sentiment_score >= 2.5
      ? 'Neutral'
      : 'Negative';

  return (
    <div className="space-y-4 lg:space-y-5">
      <section className="bg-white border border-[#d4dde9] rounded-xl shadow-sm">
        <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <p className="text-sm font-semibold text-[#4f6c90] uppercase tracking-wide">
              Citizen Dashboard
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold text-[#29496c] mt-1">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'Citizen'}
            </h1>
            <p className="text-[#56708f] mt-2 max-w-2xl">
              Track municipal participation and policy momentum across Tromso.
            </p>
          </div>
          <Link
            to="/policies"
            className="inline-flex items-center px-4 py-2.5 rounded-md bg-[#3279cb] text-white hover:bg-[#2a68b3] transition-colors"
          >
            Explore Policies
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">
        <MetricCard title="Active Policies" value={displayMetrics.active_policies} />
        <MetricCard
          title="Total Participants"
          value={displayMetrics.total_participants.toLocaleString()}
        />
        <MetricCard
          title="Engagement Rate"
          value={`${displayMetrics.engagement_rate}%`}
        />
        <MetricCard
          title="Youth Participation"
          value={`${displayMetrics.youth_participation}%`}
        />
        <MetricCard
          title="Avg Sentiment Score"
          value={displayMetrics.avg_sentiment_score.toFixed(1)}
          label={sentimentLabel}
        />

        <div className="bg-white border border-[#d4dde9] rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-[#f2f5fa] border-b border-[#d8e0eb]">
            <p className="text-sm sm:text-base font-semibold text-[#2a4a70]">
              Top Issue:
            </p>
          </div>
          <div className="px-4 py-4">
            <p className="text-lg sm:text-xl lg:text-2xl leading-tight font-semibold text-[#2f5076] break-words">
              {displayMetrics.top_issue}
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white border border-[#d4dde9] rounded-xl shadow-sm">
          <header className="px-5 py-4 border-b border-[#d8e0eb]">
            <h2 className="text-xl sm:text-2xl font-semibold text-[#2a4a70]">
              Engagement Funnel
            </h2>
          </header>
          <div className="p-4 lg:p-5">
            <FunnelChart data={displayMetrics.funnel_data} />
          </div>
        </div>

        <div className="bg-white border border-[#d4dde9] rounded-xl shadow-sm">
          <header className="px-5 py-4 border-b border-[#d8e0eb]">
            <h2 className="text-xl sm:text-2xl font-semibold text-[#2a4a70]">
              Participation by District
            </h2>
          </header>
          <div className="p-4 lg:p-5">
            <DistrictMap />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-4">
        <SentimentOverviewPanel
          sentiment={displayMetrics.sentiment_distribution}
          analytics={analytics}
        />
        <div className="bg-white border border-[#d4dde9] rounded-xl shadow-sm flex flex-col">
          <header className="px-5 py-4 border-b border-[#d8e0eb]">
            <h2 className="text-xl sm:text-2xl font-semibold text-[#2a4a70]">
              AI Insight Summary
            </h2>
          </header>
          <div className="p-4 lg:p-5 flex-1">
            <AIInsights />
          </div>
        </div>
      </section>

      <section className="bg-white border border-[#d4dde9] rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-[#d8e0eb] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#2f70ba]" />
            <h2 className="text-2xl font-semibold text-[#2a4a70]">Active Policies</h2>
          </div>
          <Link
            to="/policies"
            className="text-sm text-[#2f70ba] font-semibold hover:underline flex items-center"
          >
            View all <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </div>

        <div className="p-4 lg:p-5">
          {policiesLoading ? (
            <LoadingSpinner />
          ) : policies.length === 0 ? (
            <p className="text-[#5b7391]">No active policies right now.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {policies.map((policy) => (
                <PolicyCard key={policy.id} policy={policy} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
