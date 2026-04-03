import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { DashboardMetrics, EngagementAnalytics } from '../types/policy.types';

const EMPTY_METRICS: DashboardMetrics = {
  active_policies: 0,
  total_participants: 0,
  engagement_rate: 0,
  youth_participation: 0,
  avg_sentiment_score: 0,
  top_issue: 'N/A',
  funnel_data: {
    viewed: 0,
    interacted: 0,
    feedback_given: 0,
    votes_cast: 0,
  },
  sentiment_distribution: {
    positive: 0,
    neutral: 0,
    negative: 0,
  },
};

export const useDashboard = (timePeriod = '30d') => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [analytics, setAnalytics] = useState<EngagementAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, [timePeriod]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_dashboard_metrics', { time_period: timePeriod });
      if (error) throw error;
      setMetrics(data as DashboardMetrics);

      const { data: analyticsData, error: analyticsError } = await supabase
        .rpc('get_policy_analytics', { time_period: timePeriod });
      if (analyticsError) throw analyticsError;
      setAnalytics(((analyticsData as any[]) || []) as EngagementAnalytics[]);
      setError(null);
    } catch (err) {
      setMetrics(EMPTY_METRICS);
      setAnalytics([]);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  return { metrics, analytics, loading, error, refetch: fetchMetrics };
};
