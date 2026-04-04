import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import type {
  AdminDistrictMetric,
  AdminPolicyWorkspace,
  AdminPolicyWorkspacePayload,
  AppSettings,
  Category,
  District,
  EngagementAnalytics,
  Policy,
  PolicyStatus,
} from '../types';

interface AdminPoliciesOptions {
  search?: string;
  status?: PolicyStatus | 'all';
  categoryId?: string;
  published?: 'all' | 'published' | 'unpublished';
  page?: number;
  limit?: number;
}

const normalizePolicy = (policy: any): Policy => ({
  ...policy,
  category: policy.category || policy.categories || null,
  tags: policy.tags || policy.policy_tags || [],
  attachments: policy.attachments || policy.policy_attachments || [],
  topics: (policy.topics || policy.policy_topics || []).sort(
    (left: any, right: any) => (left.sort_order || 0) - (right.sort_order || 0)
  ),
  updates: (policy.updates || policy.policy_updates || []).sort(
    (left: any, right: any) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
  ),
  events: (policy.events || []).sort(
    (left: any, right: any) => new Date(left.event_date).getTime() - new Date(right.event_date).getTime()
  ),
  districts: policy.districts || policy.policy_districts || [],
});

export const useAdminPolicies = (options: AdminPoliciesOptions = {}) => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchPolicies = useCallback(async (signal?: { cancelled: boolean }) => {
    setLoading(true);
    const timeoutId = setTimeout(() => {
      if (signal && !signal.cancelled) {
        signal.cancelled = true;
        setLoading(false);
        setError('Request timed out');
      }
    }, 10000);
    try {
      let query = supabase.from('policies').select('*, categories(*)', { count: 'exact' });

      if (options.status && options.status !== 'all') query = query.eq('status', options.status);
      if (options.categoryId) query = query.eq('category_id', options.categoryId);
      if (options.published === 'published') query = query.eq('is_published', true);
      if (options.published === 'unpublished') query = query.eq('is_published', false);

      const limit = options.limit || 20;
      const page = options.page || 1;
      const from = (page - 1) * limit;

      if (options.search) {
        const needle = options.search.trim().replace(/[%_]/g, '\\$&');
        query = query.or(
          `title.ilike.%${needle}%,title_no.ilike.%${needle}%,title_en.ilike.%${needle}%,description.ilike.%${needle}%,description_no.ilike.%${needle}%,description_en.ilike.%${needle}%`
        );
      }

      query = query.order('updated_at', { ascending: false }).range(from, from + limit - 1);

      const { data, count, error: queryError } = await query;
      clearTimeout(timeoutId);
      if (signal?.cancelled) return;
      if (queryError) throw queryError;

      const normalized = ((data || []) as any[]).map(normalizePolicy);
      setPolicies(normalized);
      setTotal(count || 0);
      setError(null);
    } catch (err) {
      clearTimeout(timeoutId);
      if (signal?.cancelled) return;
      setPolicies([]);
      setTotal(0);
      setError(err instanceof Error ? err.message : 'Failed to load admin policies');
    } finally {
      if (!signal?.cancelled) setLoading(false);
    }
  }, [options.categoryId, options.limit, options.page, options.published, options.search, options.status]);

  const deletePolicy = useCallback(async (policyId: string) => {
    const { error: rpcError } = await supabase.rpc('admin_delete_policy_workspace', { policy_id: policyId });
    if (rpcError) throw rpcError;
    await fetchPolicies();
  }, [fetchPolicies]);

  useEffect(() => {
    const signal = { cancelled: false };
    void fetchPolicies(signal);
    return () => { signal.cancelled = true; };
  }, [fetchPolicies]);

  return { policies, total, loading, error, refetch: fetchPolicies, deletePolicy };
};

export const useAdminPolicyWorkspace = (policyId?: string) => {
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspace = useCallback(async (signal?: { cancelled: boolean }) => {
    setLoading(true);
    const timeoutId = setTimeout(() => {
      if (signal && !signal.cancelled) {
        signal.cancelled = true;
        setLoading(false);
        setError('Request timed out');
      }
    }, 10000);
    try {
      const [categoriesResponse, districtsResponse, policyResponse] = await Promise.all([
        supabase.from('categories').select('*').order('created_at', { ascending: true }),
        supabase.from('districts').select('*').order('name', { ascending: true }),
        policyId
          ? supabase
              .from('policies')
              .select(
                '*, categories(*), policy_tags(*), policy_attachments(*), policy_topics(*), policy_updates(*), events(*), policy_districts(district_id, districts(name))'
              )
              .eq('id', policyId)
              .single()
          : Promise.resolve({ data: null, error: null }),
      ]);

      clearTimeout(timeoutId);
      if (signal?.cancelled) return;

      if (categoriesResponse.error) throw categoriesResponse.error;
      if (districtsResponse.error) throw districtsResponse.error;
      if ((policyResponse as any)?.error) throw (policyResponse as any).error;

      setCategories((categoriesResponse.data || []) as Category[]);
      setDistricts((districtsResponse.data || []) as District[]);
      setPolicy((policyResponse as any)?.data ? normalizePolicy((policyResponse as any).data) : null);
      setError(null);
    } catch (err) {
      clearTimeout(timeoutId);
      if (signal?.cancelled) return;
      setError(err instanceof Error ? err.message : 'Failed to load policy workspace');
    } finally {
      if (!signal?.cancelled) setLoading(false);
    }
  }, [policyId]);

  useEffect(() => {
    const signal = { cancelled: false };
    void fetchWorkspace(signal);
    return () => { signal.cancelled = true; };
  }, [fetchWorkspace]);

  const workspace = useMemo<AdminPolicyWorkspace | null>(() => {
    if (!policy) return null;
    return {
      policy,
      districts: (policy.districts || []).map((item) => item.district_id),
      topics: policy.topics || [],
      updates: policy.updates || [],
      events: policy.events || [],
      tags: policy.tags || [],
      attachments: policy.attachments || [],
    };
  }, [policy]);

  const saveWorkspace = useCallback(async (payload: AdminPolicyWorkspacePayload) => {
    const { data, error: rpcError } = await supabase.rpc('admin_upsert_policy_workspace', { payload });
    if (rpcError) throw rpcError;
    if (data && typeof data === 'object' && 'policy_id' in (data as Record<string, unknown>)) {
      return (data as { policy_id: string }).policy_id;
    }
    return policyId || '';
  }, [policyId]);

  const deleteWorkspace = useCallback(async (id: string) => {
    const { error: rpcError } = await supabase.rpc('admin_delete_policy_workspace', { policy_id: id });
    if (rpcError) throw rpcError;
  }, []);

  return {
    workspace,
    categories,
    districts,
    loading,
    error,
    refetch: fetchWorkspace,
    saveWorkspace,
    deleteWorkspace,
  };
};

export const useDistrictMetrics = (timePeriod = '30d', policyId?: string | null) => {
  const [metrics, setMetrics] = useState<AdminDistrictMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_district_participation_metrics', {
        time_period: timePeriod,
        policy_id: policyId || null,
      });
      if (rpcError) throw rpcError;
      setMetrics((Array.isArray(data) ? data : []) as AdminDistrictMetric[]);
      setError(null);
    } catch (err) {
      setMetrics([]);
      setError(err instanceof Error ? err.message : 'Failed to load district metrics');
    } finally {
      setLoading(false);
    }
  }, [policyId, timePeriod]);

  useEffect(() => {
    void fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, error, refetch: fetchMetrics };
};

export const usePolicyAnalytics = (timePeriod = '30d') => {
  const [analytics, setAnalytics] = useState<EngagementAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_policy_analytics', {
        time_period: timePeriod,
      });
      if (rpcError) throw rpcError;
      setAnalytics((Array.isArray(data) ? data : []) as EngagementAnalytics[]);
      setError(null);
    } catch (err) {
      setAnalytics([]);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [timePeriod]);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  return { analytics, loading, error, refetch: fetchAnalytics };
};

export const useAppSettings = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: queryError } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 'app-settings')
        .single();
      if (queryError) throw queryError;
      setSettings(data as AppSettings);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  const saveSettings = useCallback(async (payload: Partial<AppSettings>) => {
    const { data, error: mutationError } = await supabase
      .from('app_settings')
      .upsert({ id: 'app-settings', ...payload })
      .select()
      .single();
    if (mutationError) throw mutationError;
    setSettings(data as AppSettings);
  }, []);

  return { settings, loading, error, refetch: fetchSettings, saveSettings };
};

export const useCategoriesAdmin = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: queryError } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: true });
      if (queryError) throw queryError;
      setCategories((data || []) as Category[]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  const saveCategory = useCallback(async (payload: Partial<Category>) => {
    const insertPayload = {
      id: payload.id,
      name: payload.name,
      label_no: payload.label_no || payload.name,
      label_en: payload.label_en || payload.name,
      description: payload.description || null,
      color: payload.color || null,
      icon: payload.icon || null,
    };
    const { error: mutationError } = await supabase.from('categories').upsert(insertPayload);
    if (mutationError) throw mutationError;
    await fetchCategories();
  }, [fetchCategories]);

  const deleteCategory = useCallback(async (id: string) => {
    const { error: mutationError } = await supabase.from('categories').delete().eq('id', id);
    if (mutationError) throw mutationError;
    await fetchCategories();
  }, [fetchCategories]);

  return { categories, loading, error, refetch: fetchCategories, saveCategory, deleteCategory };
};
