import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { authMfa } from '../lib/authMfa';
import type { Feedback, SentimentVote, SentimentType } from '../types/policy.types';

export const useFeedback = (policyId: string) => {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*, profiles(full_name, avatar_url)')
        .eq('policy_id', policyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setFeedback((data as Feedback[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch feedback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (policyId) fetchFeedback(); }, [policyId]);

  const submitFeedback = async (content: string, isAnonymous: boolean, sentiment?: SentimentType) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Must be logged in');

    const doInsert = async () => {
      const { error } = await supabase.from('feedback').insert({
        policy_id: policyId,
        user_id: user.id,
        content,
        is_anonymous: isAnonymous,
        sentiment,
      });
      if (error) throw error;
    };

    try {
      await doInsert();
    } catch (err) {
      const msg = typeof err === 'object' && err !== null && 'message' in err
        ? String((err as { message: unknown }).message) : '';
      if (msg.includes('verified session') || msg.includes('row-level security')) {
        try { await authMfa.markSessionVerified(); } catch { /* ignore */ }
        await doInsert();
      } else {
        throw err;
      }
    }

    await fetchFeedback();
  };

  return { feedback, loading, error, submitFeedback, refetch: fetchFeedback };
};

// ─── localStorage helpers ────────────────────────────────────────────────────
const voteKey = (userId: string, policyId: string) => `sv_${userId}_${policyId}`;

function getCachedVote(userId: string, policyId: string): SentimentVote | null {
  try {
    const raw = localStorage.getItem(voteKey(userId, policyId));
    return raw ? (JSON.parse(raw) as SentimentVote) : null;
  } catch {
    return null;
  }
}

function setCachedVote(userId: string, policyId: string, vote: SentimentVote) {
  try {
    localStorage.setItem(voteKey(userId, policyId), JSON.stringify(vote));
  } catch {
    // ignore storage errors
  }
}
// ─────────────────────────────────────────────────────────────────────────────

// Fetches the current user's votes for a list of policies in ONE query.
// Returns a map of policyId → SentimentVote, falling back to localStorage.
export const useUserVotesMap = (policyIds: string[], refreshKey?: unknown) => {
  const [votesMap, setVotesMap] = useState<Record<string, SentimentVote>>({});

  useEffect(() => {
    if (!policyIds.length) {
      setVotesMap({});
      return;
    }
    let cancelled = false;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled) return;
      if (!user) {
        setVotesMap({});
        return;
      }

      const cached: Record<string, SentimentVote> = {};
      for (const id of policyIds) {
        const v = getCachedVote(user.id, id);
        // Skip stale entries that have no real DB id (from a previously failed insert)
        if (v && v.id) cached[id] = v;
      }
      if (Object.keys(cached).length && !cancelled) setVotesMap(cached);

      supabase
        .from('sentiment_votes')
        .select('id, user_id, policy_id, sentiment')
        .eq('user_id', user.id)
        .in('policy_id', policyIds)
        .then(({ data }) => {
          if (cancelled || !data) return;
          const map: Record<string, SentimentVote> = { ...cached };
          for (const v of data as any[]) {
            map[v.policy_id] = v as SentimentVote;
            setCachedVote(user.id, v.policy_id, v as SentimentVote);
          }
          setVotesMap(map);
        });
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [policyIds.join(','), refreshKey]);

  return votesMap;
};

export const useSentimentVote = (policyId: string, refreshKey?: unknown) => {
  const [userVote, setUserVote] = useState<SentimentVote | null>(null);
  const [sentimentCounts, setSentimentCounts] = useState({ positive: 0, neutral: 0, negative: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!policyId) { setLoading(false); return; }
    let cancelled = false;
    const safeSet = <T>(setter: (v: T) => void) => (v: T) => { if (!cancelled) setter(v); };

    const run = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;

      const [{ data: votes }, { data: myVote }] = await Promise.all([
        supabase.from('sentiment_votes').select('sentiment').eq('policy_id', policyId),
        user
          ? supabase
              .from('sentiment_votes')
              .select('id, user_id, sentiment')
              .eq('policy_id', policyId)
              .eq('user_id', user.id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      if (cancelled) return;

      if (votes) {
        const counts = { positive: 0, neutral: 0, negative: 0 };
        for (const v of votes as any[]) {
          if (v.sentiment === 'positive') counts.positive++;
          else if (v.sentiment === 'neutral') counts.neutral++;
          else if (v.sentiment === 'negative') counts.negative++;
        }
        safeSet(setSentimentCounts)(counts);
      }

      const dbVote = (myVote as SentimentVote | null) ?? null;
      if (dbVote) {
        if (user) setCachedVote(user.id, policyId, dbVote);
        safeSet(setUserVote)(dbVote);
      } else if (user) {
        const cached = getCachedVote(user.id, policyId);
        safeSet(setUserVote)(cached?.id ? cached : null);
      } else {
        safeSet(setUserVote)(null);
      }
      safeSet(setLoading)(false);
    };

    void run();
    return () => { cancelled = true; };
  }, [policyId, refreshKey]);

  const castVote = async (sentiment: SentimentType) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Must be logged in');

    const isVerifiedSessionError = (err: unknown) => {
      if (typeof err !== 'object' || err === null || !('message' in err)) return false;
      const msg = String((err as { message: unknown }).message);
      return msg.includes('verified session') || msg.includes('row-level security');
    };

    const doWrite = async () => {
      // Guard: treat a cached vote with an empty/invalid id as "no vote yet"
      const hasValidExistingVote = userVote && userVote.id && userVote.id.length > 10;

      if (hasValidExistingVote) {
        const { error: updateError } = await supabase
          .from('sentiment_votes')
          .update({ sentiment })
          .eq('id', userVote!.id);
        if (updateError) throw updateError;
        return { ...userVote!, sentiment } as SentimentVote;
      } else {
        const { data, error: insertError } = await supabase
          .from('sentiment_votes')
          .insert({ policy_id: policyId, user_id: user.id, sentiment })
          .select('id, user_id, sentiment')
          .single();
        if (insertError) throw insertError;
        return data as SentimentVote;
      }
    };

    let savedVote: SentimentVote;
    try {
      savedVote = await doWrite();
    } catch (err) {
      if (isVerifiedSessionError(err)) {
        // Session stamp missing — re-verify and retry once
        try { await authMfa.markSessionVerified(); } catch { /* ignore */ }
        savedVote = await doWrite();
      } else {
        throw err;
      }
    }

    // Only cache votes that have a real DB id
    if (savedVote.id) setCachedVote(user.id, policyId, savedVote);
    setUserVote(savedVote);

    // Refresh sentiment counts from DB
    const { data: freshVotes } = await supabase
      .from('sentiment_votes')
      .select('sentiment')
      .eq('policy_id', policyId);
    if (freshVotes) {
      const counts = { positive: 0, neutral: 0, negative: 0 };
      for (const v of freshVotes as any[]) {
        if (v.sentiment === 'positive') counts.positive++;
        else if (v.sentiment === 'neutral') counts.neutral++;
        else if (v.sentiment === 'negative') counts.negative++;
      }
      setSentimentCounts(counts);
    }
  };

  return { userVote, sentimentCounts, loading, castVote };
};
