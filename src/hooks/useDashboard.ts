import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { DashboardMetrics, EngagementAnalytics } from '../types/policy.types';
import type { District } from '../types';

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
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async (signal?: { cancelled: boolean }) => {
    setLoading(true);
    const timeout = setTimeout(() => {
      if (signal && !signal.cancelled) {
        signal.cancelled = true;
        setMetrics(EMPTY_METRICS);
        setAnalytics([]);
        setLoading(false);
        setError('Request timed out');
      }
    }, 10000);
    try {
      const [metricsResponse, analyticsResponse, districtsResponse] = await Promise.all([
        supabase.rpc('get_dashboard_metrics', { time_period: timePeriod }),
        supabase.rpc('get_policy_analytics', { time_period: timePeriod }),
        supabase.from('districts').select('*').order('name', { ascending: true }),
      ]);
      clearTimeout(timeout);
      if (signal?.cancelled) return;
      if (metricsResponse.error) throw metricsResponse.error;
      if (analyticsResponse.error) throw analyticsResponse.error;
      setMetrics(metricsResponse.data as DashboardMetrics);
      setAnalytics(((analyticsResponse.data as any[]) || []) as EngagementAnalytics[]);
      setDistricts((districtsResponse.data || []) as District[]);
      setError(null);
    } catch (err) {
      clearTimeout(timeout);
      if (signal?.cancelled) return;
      setMetrics(EMPTY_METRICS);
      setAnalytics([]);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      if (!signal?.cancelled) setLoading(false);
    }
  }, [timePeriod]);

  useEffect(() => {
    const signal = { cancelled: false };
    void fetchMetrics(signal);
    return () => { signal.cancelled = true; };
  }, [fetchMetrics]);

  return { metrics, analytics, districts, loading, error, refetch: fetchMetrics };
};
