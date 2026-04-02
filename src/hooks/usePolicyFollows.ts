import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export const usePolicyFollow = (policyId: string, userId?: string) => {
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchFollow = useCallback(async () => {
    if (!policyId || !userId) {
      setFollowing(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('policy_follows')
      .select('*')
      .eq('policy_id', policyId)
      .eq('user_id', userId);

    if (!error) {
      setFollowing(Array.isArray(data) && data.length > 0);
    }

    setLoading(false);
  }, [policyId, userId]);

  useEffect(() => {
    fetchFollow();
  }, [fetchFollow]);

  const toggleFollow = async () => {
    if (!policyId || !userId) return;

    if (following) {
      await supabase
        .from('policy_follows')
        .delete()
        .eq('policy_id', policyId)
        .eq('user_id', userId);
      setFollowing(false);
      return;
    }

    await supabase.from('policy_follows').insert({
      policy_id: policyId,
      user_id: userId,
    });
    setFollowing(true);
  };

  return { following, loading, toggleFollow, refetch: fetchFollow };
};
