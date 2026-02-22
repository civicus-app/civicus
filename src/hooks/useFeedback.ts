import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
    const { error } = await supabase.from('feedback').insert({
      policy_id: policyId,
      user_id: user.id,
      content,
      is_anonymous: isAnonymous,
      sentiment,
    });
    if (error) throw error;
    await fetchFeedback();
  };

  return { feedback, loading, error, submitFeedback, refetch: fetchFeedback };
};

export const useSentimentVote = (policyId: string) => {
  const [userVote, setUserVote] = useState<SentimentVote | null>(null);
  const [sentimentCounts, setSentimentCounts] = useState({ positive: 0, neutral: 0, negative: 0 });
  const [loading, setLoading] = useState(true);

  const fetchVotes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: votes } = await supabase.from('sentiment_votes').select('*').eq('policy_id', policyId);
    if (votes) {
      setSentimentCounts({
        positive: votes.filter((v: any) => v.sentiment === 'positive').length,
        neutral: votes.filter((v: any) => v.sentiment === 'neutral').length,
        negative: votes.filter((v: any) => v.sentiment === 'negative').length,
      });
      if (user) {
        const myVote = votes.find((v: any) => v.user_id === user.id);
        setUserVote((myVote as SentimentVote) || null);
      } else {
        setUserVote(null);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!policyId) return;
    fetchVotes();
  }, [policyId]);

  const castVote = async (sentiment: SentimentType) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Must be logged in');
    if (userVote) {
      await supabase.from('sentiment_votes').update({ sentiment }).eq('id', userVote.id);
    } else {
      await supabase.from('sentiment_votes').insert({ policy_id: policyId, user_id: user.id, sentiment });
    }
    await fetchVotes();
  };

  return { userVote, sentimentCounts, loading, castVote };
};
