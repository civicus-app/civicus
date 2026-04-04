import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useLanguageStore } from '../../store/languageStore';
import { useDistrictMetrics, usePolicyAnalytics } from '../../hooks/useAdmin';
import DistrictGeoMap from '../../components/admin/DistrictGeoMap';
import { supabase } from '../../lib/supabase';
import type { District } from '../../types';

// Custom tooltip component for premium look
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const tooltipTitle = payload[0]?.payload?.fullTitle || label;
    return (
      <div className="rounded-xl border border-slate-200/60 bg-white/95 backdrop-blur-sm p-4 shadow-2xl shadow-slate-900/10">
        <p className="text-sm font-semibold text-slate-900 mb-2">{tooltipTitle}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-600">{entry.name}:</span>
            <span className="font-semibold text-slate-900">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CHART_COLORS = {
  views: '#0f172a',
  votes: '#7c3aed',
  feedback: '#059669',
};

export default function Analytics() {
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);
  const [timePeriod, setTimePeriod] = useState('30d');
  const [districts, setDistricts] = useState<District[]>([]);
  const { analytics, loading } = usePolicyAnalytics(timePeriod);
  const { metrics: districtMetrics } = useDistrictMetrics(timePeriod);

  useEffect(() => {
    supabase.from('districts').select('*').order('name', { ascending: true }).then(({ data }) => {
      setDistricts((data || []) as District[]);
    });
  }, []);

  const activeAnalytics = useMemo(
    () =>
      analytics.filter(
        (item) =>
          item.engaged_users > 0 ||
          item.views_count > 0 ||
          item.votes_count > 0 ||
          item.feedback_count > 0
      ),
    [analytics]
  );

  const barData = useMemo(
    () =>
      activeAnalytics.slice(0, 8).map((item, index) => ({
        name: item.title.length > 18 ? `${item.title.slice(0, 18)}...` : item.title,
        shortLabel: `P${index + 1}`,
        fullTitle: item.title,
        views: item.views_count,
        votes: item.votes_count,
        feedback: item.feedback_count,
      })),
    [activeAnalytics]
  );

  const chartPolicyLookup = useMemo(
    () =>
      new Map(
        activeAnalytics.slice(0, 8).map((item, index) => [item.policy_id, `P${index + 1}`])
      ),
    [activeAnalytics]
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight sm:text-3xl">
            {tx('Analyse', 'Analytics')}
          </h1>
          <p className="text-slate-600 mt-2">
            {tx('Tidsavgrenset innsyn i publiserte og upubliserte saker', 'Time-scoped insight into published and unpublished policies')}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <label className="text-sm font-medium text-slate-700">
            {tx('Tidsperiode', 'Time period')}:
          </label>
          <select
            value={timePeriod}
            onChange={(event) => setTimePeriod(event.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 shadow-sm hover:border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-400/20 focus:outline-none transition-colors"
          >
            <option value="7d">{tx('Siste 7 dager', 'Last 7 days')}</option>
            <option value="30d">{tx('Siste 30 dager', 'Last 30 days')}</option>
            <option value="90d">{tx('Siste 90 dager', 'Last 90 days')}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-slate-900">
              {tx('Engasjement per sak', 'Engagement by policy')}
            </CardTitle>
            <p className="text-sm text-slate-600 mt-1">
              {tx('Visninger, stemmer og tilbakemeldinger', 'Views, votes and feedback')}
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            {barData.length ? (
              <div className="relative">
                <div className="md:hidden">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={barData}
                      margin={{ top: 20, right: 8, left: -18, bottom: 10 }}
                      barCategoryGap="20%"
                    >
                      <defs>
                        <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0f172a" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#1e293b" stopOpacity={0.7} />
                        </linearGradient>
                        <linearGradient id="votesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#a855f7" stopOpacity={0.7} />
                        </linearGradient>
                        <linearGradient id="feedbackGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#059669" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0.7} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="2 4"
                        stroke="#f1f5f9"
                        strokeOpacity={0.8}
                        strokeWidth={1}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="shortLabel"
                        axisLine={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                        tickLine={false}
                        tick={{
                          fontSize: 11,
                          fill: '#334155',
                          fontWeight: 700,
                          fontFamily: 'system-ui, -apple-system, sans-serif'
                        }}
                        height={28}
                        interval={0}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 11,
                          fill: '#64748b',
                          fontWeight: 500,
                          fontFamily: 'system-ui, -apple-system, sans-serif'
                        }}
                        tickFormatter={(value) => value.toLocaleString()}
                        width={34}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        wrapperStyle={{
                          paddingTop: '16px',
                          fontSize: '12px',
                          fontWeight: 600,
                          fontFamily: 'system-ui, -apple-system, sans-serif',
                          color: '#334155'
                        }}
                        iconType="rect"
                        iconSize={12}
                      />
                      <Bar
                        dataKey="views"
                        fill="url(#viewsGradient)"
                        name={tx('Visninger', 'Views')}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={24}
                      />
                      <Bar
                        dataKey="votes"
                        fill="url(#votesGradient)"
                        name={tx('Stemmer', 'Votes')}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={24}
                      />
                      <Bar
                        dataKey="feedback"
                        fill="url(#feedbackGradient)"
                        name={tx('Tilbakemeldinger', 'Feedback')}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={24}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="mt-3 text-xs text-slate-500">
                    {tx('P1–P8 matcher saksoversikten under.', 'P1–P8 map to the policy overview below.')}
                  </p>
                </div>

                <div className="hidden md:block">
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                      data={barData}
                      margin={{ top: 20, right: 40, left: 20, bottom: 50 }}
                      barCategoryGap="25%"
                    >
                      <defs>
                        <linearGradient id="viewsGradientDesktop" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0f172a" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#1e293b" stopOpacity={0.7} />
                        </linearGradient>
                        <linearGradient id="votesGradientDesktop" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#a855f7" stopOpacity={0.7} />
                        </linearGradient>
                        <linearGradient id="feedbackGradientDesktop" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#059669" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0.7} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="2 4"
                        stroke="#f1f5f9"
                        strokeOpacity={0.8}
                        strokeWidth={1}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="shortLabel"
                        axisLine={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                        tickLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                        tick={{
                          fontSize: 13,
                          fill: '#334155',
                          fontWeight: 600,
                          fontFamily: 'system-ui, -apple-system, sans-serif'
                        }}
                        textAnchor="middle"
                        height={70}
                        interval={0}
                        padding={{ left: 10, right: 10 }}
                      />
                      <YAxis
                        axisLine={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                        tickLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                        tick={{
                          fontSize: 12,
                          fill: '#334155',
                          fontWeight: 500,
                          fontFamily: 'system-ui, -apple-system, sans-serif'
                        }}
                        tickFormatter={(value) => value.toLocaleString()}
                        width={60}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        wrapperStyle={{
                          paddingTop: '24px',
                          fontSize: '14px',
                          fontWeight: 600,
                          fontFamily: 'system-ui, -apple-system, sans-serif',
                          color: '#334155'
                        }}
                        iconType="rect"
                        iconSize={14}
                      />
                      <Bar
                        dataKey="views"
                        fill="url(#viewsGradientDesktop)"
                        name={tx('Visninger', 'Views')}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={60}
                      />
                      <Bar
                        dataKey="votes"
                        fill="url(#votesGradientDesktop)"
                        name={tx('Stemmer', 'Votes')}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={60}
                      />
                      <Bar
                        dataKey="feedback"
                        fill="url(#feedbackGradientDesktop)"
                        name={tx('Tilbakemeldinger', 'Feedback')}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={60}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Subtle background pattern */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.02]">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)`,
                    backgroundSize: '20px 20px'
                  }} />
                </div>
              </div>
            ) : (
              <div className="flex h-[360px] items-center justify-center rounded-2xl border-2 border-dashed border-slate-200/60 bg-gradient-to-br from-slate-50/50 to-slate-100/30">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-slate-600">
                    {tx('Ingen aktivitet i valgt periode ennå.', 'No activity in the selected period yet.')}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {tx('Data vil vises når brukere begynner å engasjere seg', 'Data will appear as users start engaging')}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-slate-900">
              {tx('Deltakelse per bydel', 'Participation by district')}
            </CardTitle>
            <p className="text-sm text-slate-600 mt-1">
              {tx('Geografisk fordeling av engasjement', 'Geographic distribution of engagement')}
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <DistrictGeoMap districts={districts} metrics={districtMetrics} />
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-200/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-slate-900">
            {tx('Saksoversikt', 'Policy overview')}
          </CardTitle>
          <p className="text-sm text-slate-600 mt-1">
            {tx('Detaljert statistikk for hver sak', 'Detailed statistics for each policy')}
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3 md:hidden">
            {activeAnalytics.map((item) => (
              <article key={item.policy_id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {chartPolicyLookup.get(item.policy_id) ? (
                        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[#eaf2fb] px-2 text-[11px] font-semibold text-[#2f73c3]">
                          {chartPolicyLookup.get(item.policy_id)}
                        </span>
                      ) : null}
                      <p className="font-medium text-slate-900">{item.title}</p>
                    </div>
                  </div>
                  <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    item.is_published ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                  }`}>
                    {item.is_published ? tx('Publisert', 'Published') : tx('Skjult', 'Hidden')}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    item.status === 'active'
                      ? 'bg-blue-100 text-blue-800'
                      : item.status === 'under_review'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-slate-100 text-slate-800'
                  }`}>
                    {item.status === 'active'
                      ? tx('Aktiv', 'Active')
                      : item.status === 'under_review'
                      ? tx('Under vurdering', 'Under review')
                      : tx('Lukket', 'Closed')}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-slate-50 px-2 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{tx('Visninger', 'Views')}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{item.views_count.toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-2 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{tx('Stemmer', 'Votes')}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{item.votes_count.toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-2 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{tx('Feedback', 'Feedback')}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{item.feedback_count.toLocaleString()}</p>
                  </div>
                </div>
              </article>
            ))}
            {!activeAnalytics.length ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-10 text-center text-sm text-slate-600">
                {tx('Ingen saker med aktivitet i valgt periode.', 'No policies have activity in the selected period.')}
              </div>
            ) : null}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200/60">
                <tr className="bg-gradient-to-r from-slate-50/80 to-slate-100/40">
                  {[tx('Kart', 'Chart'), tx('Sak', 'Policy'), tx('Synlighet', 'Visibility'), tx('Status', 'Status'), tx('Visninger', 'Views'), tx('Stemmer', 'Votes'), tx('Tilbakemeldinger', 'Feedback')].map((heading) => (
                    <th key={heading} className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeAnalytics.map((item, index) => (
                  <tr key={item.policy_id} className={`hover:bg-slate-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}`}>
                    <td className="px-6 py-4">
                      {chartPolicyLookup.get(item.policy_id) ? (
                        <span className="inline-flex min-w-10 items-center justify-center rounded-full bg-[#eaf2fb] px-3 py-1 text-xs font-semibold text-[#2f73c3]">
                          {chartPolicyLookup.get(item.policy_id)}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">{item.title}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.is_published
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {item.is_published ? tx('Publisert', 'Published') : tx('Skjult', 'Hidden')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.status === 'active'
                          ? 'bg-blue-100 text-blue-800'
                          : item.status === 'under_review'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {item.status === 'active'
                          ? tx('Aktiv', 'Active')
                          : item.status === 'under_review'
                          ? tx('Under vurdering', 'Under review')
                          : tx('Lukket', 'Closed')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-medium">{item.views_count.toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-700 font-medium">{item.votes_count.toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-700 font-medium">{item.feedback_count.toLocaleString()}</td>
                  </tr>
                ))}
                {!activeAnalytics.length ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600">
                            {tx('Ingen saker med aktivitet i valgt periode.', 'No policies have activity in the selected period.')}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {tx('Prøv å velge en lengre tidsperiode', 'Try selecting a longer time period')}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
