import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Policy, PolicyStatus } from '../types/policy.types';
import { isCitizenVisiblePolicy } from '../lib/policyContent';

interface UsePoliciesOptions {
  status?: PolicyStatus | 'all';
  category?: string;
  search?: string;
  limit?: number;
  page?: number;
}

export const usePolicies = (options: UsePoliciesOptions = {}) => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchPolicies = useCallback(async (signal?: { cancelled: boolean }) => {
    setLoading(true);
    const timeout = setTimeout(() => {
      if (signal && !signal.cancelled) {
        signal.cancelled = true;
        setLoading(false);
        setError('Request timed out');
      }
    }, 10000);
    try {
      let query = supabase
        .from('policies')
        .select('*, categories(*), policy_topics(*)', { count: 'exact' });

      if (options.status && options.status !== 'all') {
        query = query.eq('status', options.status);
      } else if (!options.status) {
        query = query.in('status', ['active', 'under_review', 'closed']);
      }

      query = query.eq('is_published', true);

      const limit = options.limit || 12;
      const page = options.page || 1;
      const from = (page - 1) * limit;

      if (options.category) {
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .eq('name', options.category)
          .single();
        if (signal?.cancelled) { clearTimeout(timeout); return; }
        if (cat) query = query.eq('category_id', cat.id);
      }

      if (options.search) {
        const needle = options.search.trim().replace(/[%_]/g, '\\$&');
        query = query.or(
          `title.ilike.%${needle}%,title_no.ilike.%${needle}%,title_en.ilike.%${needle}%,description.ilike.%${needle}%,description_no.ilike.%${needle}%,description_en.ilike.%${needle}%`
        );
      }

      query = query.order('created_at', { ascending: false }).range(from, from + limit - 1);

      const { data, error, count } = await query;
      clearTimeout(timeout);
      if (signal?.cancelled) return;
      if (error) throw error;
      const normalized = ((data as any[]) || []).map((policy) => ({
        ...policy,
        category: policy.category || policy.categories || null,
        topics: ((policy.topics || policy.policy_topics || []) as any[]).sort(
          (a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)
        ),
      }));
      const visiblePolicies = normalized.filter((policy) => isCitizenVisiblePolicy(policy as Policy));
      setPolicies(visiblePolicies as Policy[]);
      setTotal(count || visiblePolicies.length);
      setError(null);
    } catch (err) {
      clearTimeout(timeout);
      if (signal?.cancelled) return;
      setError(err instanceof Error ? err.message : 'Failed to fetch policies');
    } finally {
      if (!signal?.cancelled) setLoading(false);
    }
  }, [options.status, options.category, options.search, options.limit, options.page]);

  useEffect(() => {
    const signal = { cancelled: false };
    void fetchPolicies(signal);
    return () => { signal.cancelled = true; };
  }, [fetchPolicies]);

  return { policies, loading, error, total, refetch: fetchPolicies };
};

export const usePolicy = (id: string) => {
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchPolicy = async () => {
      try {
        const { data, error } = await supabase
          .from('policies')
          .select(
            '*, categories(*), policy_tags(*), policy_attachments(*), policy_topics(*), policy_updates(*), events(*), policy_districts(district_id, districts(name))'
          )
          .eq('id', id)
          .single();
        if (error) throw error;
        const normalized = {
          ...(data as any),
          category: (data as any)?.category || (data as any)?.categories || null,
          tags: (data as any)?.tags || (data as any)?.policy_tags || [],
          attachments:
            (data as any)?.attachments || (data as any)?.policy_attachments || [],
          topics: ((data as any)?.topics || (data as any)?.policy_topics || []).sort(
            (left: any, right: any) => (left.sort_order || 0) - (right.sort_order || 0)
          ),
          updates: ((data as any)?.updates || (data as any)?.policy_updates || []).sort(
            (left: any, right: any) =>
              new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
          ),
          events: ((data as any)?.events || []).sort(
            (left: any, right: any) =>
              new Date(left.event_date).getTime() - new Date(right.event_date).getTime()
          ),
          districts: (data as any)?.districts || (data as any)?.policy_districts || [],
        };
        if (!isCitizenVisiblePolicy(normalized as Policy)) {
          setPolicy(null);
        } else {
          setPolicy(normalized as Policy);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch policy');
      } finally {
        setLoading(false);
      }
    };
    fetchPolicy();
  }, [id]);

  return { policy, loading, error };
};
