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
      activeAnalytics.slice(0, 8).map((item) => ({
        name: item.title.length > 18 ? `${item.title.slice(0, 18)}...` : item.title,
        views: item.views_count,
        votes: item.votes_count,
        feedback: item.feedback_count,
      })),
    [activeAnalytics]
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#173151]">{tx('Analyse', 'Analytics')}</h1>
          <p className="text-sm text-[#6b7f99]">
            {tx('Tidsavgrenset innsyn i publiserte og upubliserte saker', 'Time-scoped insight into published and unpublished policies')}
          </p>
        </div>
        <select
          value={timePeriod}
          onChange={(event) => setTimePeriod(event.target.value)}
          className="h-11 rounded-2xl border border-[#d7dfeb] bg-white px-4 text-sm font-medium text-[#173151]"
        >
          <option value="7d">{tx('Siste 7 dager', 'Last 7 days')}</option>
          <option value="30d">{tx('Siste 30 dager', 'Last 30 days')}</option>
          <option value="90d">{tx('Siste 90 dager', 'Last 90 days')}</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{tx('Engasjement per sak', 'Engagement by policy')}</CardTitle>
          </CardHeader>
          <CardContent>
            {barData.length ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-25} textAnchor="end" interval={0} height={60} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="views" fill="#3b82f6" name={tx('Visninger', 'Views')} />
                  <Bar dataKey="votes" fill="#8b5cf6" name={tx('Stemmer', 'Votes')} />
                  <Bar dataKey="feedback" fill="#10b981" name={tx('Tilbakemeldinger', 'Feedback')} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[320px] items-center justify-center rounded-2xl border border-dashed border-[#d7dfeb] text-sm text-[#6b7f99]">
                {tx('Ingen aktivitet i valgt periode ennå.', 'No activity in the selected period yet.')}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tx('Deltakelse per bydel', 'Participation by district')}</CardTitle>
          </CardHeader>
          <CardContent>
            <DistrictGeoMap districts={districts} metrics={districtMetrics} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{tx('Saksoversikt', 'Policy overview')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-[#f7f9fc]">
                <tr>
                  {[tx('Sak', 'Policy'), tx('Synlighet', 'Visibility'), tx('Status', 'Status'), tx('Visninger', 'Views'), tx('Stemmer', 'Votes'), tx('Tilbakemeldinger', 'Feedback')].map((heading) => (
                    <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7f99]">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebf0f6]">
                {activeAnalytics.map((item) => (
                  <tr key={item.policy_id}>
                    <td className="px-4 py-3 font-medium text-[#173151]">{item.title}</td>
                    <td className="px-4 py-3 text-[#4e6482]">{item.is_published ? tx('Publisert', 'Published') : tx('Skjult', 'Hidden')}</td>
                    <td className="px-4 py-3 text-[#4e6482]">{item.status}</td>
                    <td className="px-4 py-3 text-[#4e6482]">{item.views_count}</td>
                    <td className="px-4 py-3 text-[#4e6482]">{item.votes_count}</td>
                    <td className="px-4 py-3 text-[#4e6482]">{item.feedback_count}</td>
                  </tr>
                ))}
                {!activeAnalytics.length ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-[#6b7f99]">
                      {tx('Ingen saker med aktivitet i valgt periode.', 'No policies have activity in the selected period.')}
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
