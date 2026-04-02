import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { TIME_PERIODS } from '../../lib/constants';
import type { EngagementAnalytics } from '../../types/policy.types';
import { useLanguageStore } from '../../store/languageStore';

export default function Analytics() {
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);
  const [timePeriod, setTimePeriod] = useState('30d');
  const [analytics, setAnalytics] = useState<EngagementAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      const { data } = await supabase.from('engagement_analytics').select('*').order('engaged_users', { ascending: false });
      if (data) setAnalytics(data as EngagementAnalytics[]);
      setLoading(false);
    };
    fetchAnalytics();
  }, [timePeriod]);

  const barData = analytics.slice(0, 8).map(a => ({
    name: a.title.length > 20 ? a.title.slice(0, 20) + '...' : a.title,
    views: a.views_count,
    votes: a.votes_count,
    feedback: a.feedback_count,
  }));

  const sentimentData = analytics.slice(0, 8).map(a => ({
    name: a.title.length > 15 ? a.title.slice(0, 15) + '...' : a.title,
    positive: a.positive_count,
    neutral: a.neutral_count,
    negative: a.negative_count,
  }));

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{tx('Analyse', 'Analytics')}</h1>
          <p className="text-gray-500 text-sm">{tx('Fordypning i engasjementsdata', 'Deep dive into engagement data')}</p>
        </div>
        <Select value={timePeriod} onValueChange={setTimePeriod}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TIME_PERIODS.map(p => (
              <SelectItem key={p.value} value={p.value}>
                {p.value === '7d'
                  ? tx('Siste 7 dager', 'Last 7 days')
                  : p.value === '30d'
                  ? tx('Siste 30 dager', 'Last 30 days')
                  : tx('Siste 90 dager', 'Last 90 days')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>{tx('Engasjement per sak', 'Engagement by policy')}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} margin={{ top: 0, right: 10, bottom: 40, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="views" fill="#3B82F6" name={tx('Visninger', 'Views')} />
                <Bar dataKey="votes" fill="#8B5CF6" name={tx('Stemmer', 'Votes')} />
                <Bar dataKey="feedback" fill="#10B981" name={tx('Tilbakemeldinger', 'Feedback')} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{tx('Stemning per sak', 'Sentiment by policy')}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={sentimentData} margin={{ top: 0, right: 10, bottom: 40, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="positive" fill="#10B981" name={tx('Positiv', 'Positive')} stackId="a" />
                <Bar dataKey="neutral" fill="#F59E0B" name={tx('Noytral', 'Neutral')} stackId="a" />
                <Bar dataKey="negative" fill="#EF4444" name={tx('Negativ', 'Negative')} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{tx('Saksoversikt', 'Policy overview')}</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {[tx('Sak', 'Policy'), tx('Visninger', 'Views'), tx('Stemmer', 'Votes'), tx('Tilbakemeldinger', 'Feedback'), tx('Engasjerte brukere', 'Engaged users'), tx('Snitt stemning', 'Avg sentiment')].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {analytics.map(a => (
                  <tr key={a.policy_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{a.title}</td>
                    <td className="px-4 py-3 text-gray-600">{a.views_count}</td>
                    <td className="px-4 py-3 text-gray-600">{a.votes_count}</td>
                    <td className="px-4 py-3 text-gray-600">{a.feedback_count}</td>
                    <td className="px-4 py-3 font-medium">{a.engaged_users}</td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${a.avg_sentiment_score >= 4 ? 'text-green-600' : a.avg_sentiment_score >= 2.5 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {a.avg_sentiment_score?.toFixed(1) || tx('Ikke tilgjengelig', 'N/A')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
