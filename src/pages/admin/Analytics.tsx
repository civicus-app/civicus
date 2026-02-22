import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { TIME_PERIODS } from '../../lib/constants';
import type { EngagementAnalytics } from '../../types/policy.types';

export default function Analytics() {
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
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 text-sm">Deep dive into policy engagement data</p>
        </div>
        <Select value={timePeriod} onValueChange={setTimePeriod}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TIME_PERIODS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Engagement by Policy</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} margin={{ top: 0, right: 10, bottom: 40, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="views" fill="#3B82F6" name="Views" />
                <Bar dataKey="votes" fill="#8B5CF6" name="Votes" />
                <Bar dataKey="feedback" fill="#10B981" name="Feedback" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Sentiment by Policy</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={sentimentData} margin={{ top: 0, right: 10, bottom: 40, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="positive" fill="#10B981" name="Positive" stackId="a" />
                <Bar dataKey="neutral" fill="#F59E0B" name="Neutral" stackId="a" />
                <Bar dataKey="negative" fill="#EF4444" name="Negative" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Policy Engagement Table</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Policy', 'Views', 'Votes', 'Feedback', 'Engaged Users', 'Avg Sentiment'].map(h => (
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
                        {a.avg_sentiment_score?.toFixed(1) || 'N/A'}
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
