import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Bot, CheckCircle2, MessageCircleMore, Vote, ScanSearch } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePolicies } from '../../hooks/usePolicies';
import { supabase } from '../../lib/supabase';
import type { Policy, PolicyStatus } from '../../types/policy.types';
import LoadingSpinner from '../../components/common/LoadingSpinner';

interface PolicyEngagement {
  votes: number;
  feedback: number;
  userEngaged: boolean;
}

const statusLabel: Record<PolicyStatus, string> = {
  draft: 'Draft',
  active: 'In Progress',
  under_review: 'Reviewed',
  closed: 'Closed',
};

const statusChipClass: Record<PolicyStatus, string> = {
  draft: 'bg-slate-400/15 text-slate-700',
  active: 'bg-emerald-500/15 text-emerald-700',
  under_review: 'bg-cyan-600/15 text-cyan-800',
  closed: 'bg-indigo-500/15 text-indigo-700',
};

const formatDueDate = (date?: string) => {
  if (!date) return 'No deadline set';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'No deadline set';
  return `Respond by ${format(parsed, 'MMM do')}`;
};

export default function CitizenHome() {
  const { profile, user } = useAuth();
  const { policies, loading } = usePolicies({ status: 'active', limit: 20 });
  const [engagementByPolicy, setEngagementByPolicy] = useState<Record<string, PolicyEngagement>>(
    {}
  );
  const [latestFeedbackPolicy, setLatestFeedbackPolicy] = useState<Policy | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchEngagement = async () => {
      const [{ data: votes }, { data: feedback }] = await Promise.all([
        supabase.from('sentiment_votes').select('policy_id, user_id'),
        supabase.from('feedback').select('policy_id, user_id'),
      ]);

      if (!isMounted) return;

      const summary: Record<string, PolicyEngagement> = {};

      (votes || []).forEach((vote: { policy_id: string; user_id: string }) => {
        if (!summary[vote.policy_id]) {
          summary[vote.policy_id] = { votes: 0, feedback: 0, userEngaged: false };
        }
        summary[vote.policy_id].votes += 1;
        if (vote.user_id && vote.user_id === user?.id) {
          summary[vote.policy_id].userEngaged = true;
        }
      });

      (feedback || []).forEach((entry: { policy_id: string; user_id?: string | null }) => {
        if (!summary[entry.policy_id]) {
          summary[entry.policy_id] = { votes: 0, feedback: 0, userEngaged: false };
        }
        summary[entry.policy_id].feedback += 1;
        if (entry.user_id && entry.user_id === user?.id) {
          summary[entry.policy_id].userEngaged = true;
        }
      });

      setEngagementByPolicy(summary);

      const engagedPolicyIds = Object.entries(summary)
        .filter(([, value]) => value.userEngaged)
        .map(([policyId]) => policyId);

      if (!engagedPolicyIds.length) {
        setLatestFeedbackPolicy(null);
        return;
      }

      const { data: relatedPolicies } = await supabase
        .from('policies')
        .select('*')
        .in('id', engagedPolicyIds)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (!isMounted) return;
      setLatestFeedbackPolicy(((relatedPolicies || [])[0] as Policy) || null);
    };

    fetchEngagement();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const firstName = useMemo(
    () => profile?.full_name?.split(' ').filter(Boolean)[0] || 'Citizen',
    [profile?.full_name]
  );

  const activePolicy = policies[0] || null;
  const activePolicyStats = activePolicy
    ? engagementByPolicy[activePolicy.id] || { votes: 0, feedback: 0, userEngaged: false }
    : { votes: 0, feedback: 0, userEngaged: false };
  const feedbackPolicy = latestFeedbackPolicy || activePolicy;

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-[#69b8c4]/35 bg-[#237987] min-h-[640px]">
      <div className="absolute -top-36 -left-12 h-[320px] w-[420px] rounded-[120px] bg-gradient-to-br from-[#5bc4cf] via-[#2a8c98] to-transparent opacity-80" />
      <div className="absolute -top-10 right-0 h-[220px] w-[340px] rounded-bl-[120px] bg-[#2c8594] opacity-80" />
      <div className="absolute bottom-0 right-16 h-[280px] w-[380px] rounded-t-[180px] bg-[#2d8292] opacity-80" />
      <div className="absolute bottom-16 left-12 h-[120px] w-[240px] rounded-full bg-[#3ea3b2]/25 blur-xl" />

      <div className="relative z-10 px-4 py-6 sm:px-8 sm:py-9 lg:px-10 lg:py-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 text-center pt-2">
            <h1 className="text-3xl sm:text-4xl font-semibold text-white">Welcome, {firstName}!</h1>
            <p className="text-white/90 text-lg sm:text-xl mt-2">Your Civic Participation Hub</p>
          </div>
          <div className="hidden sm:flex h-14 w-14 rounded-full bg-[#8ec4ef] items-center justify-center text-2xl shadow-md">
            👤
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-8">
          <article>
            <h2 className="text-white text-2xl sm:text-[2.1rem] font-semibold mb-3">Active consultations</h2>
            <div className="rounded-[32px] bg-[#f8fafb] px-6 py-5 shadow-lg border border-white/35">
              {activePolicy ? (
                <>
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="text-[#13364c] text-2xl sm:text-3xl leading-[1.15] font-semibold max-w-[460px]">
                      {activePolicy.title}
                    </h3>
                    <div
                      aria-label="Active policy indicator"
                      className="h-8 w-14 rounded-full bg-emerald-500/25 p-1 flex items-center justify-end"
                    >
                      <span className="h-6 w-6 rounded-full bg-emerald-500 shadow-sm" />
                    </div>
                  </div>
                  <p className="text-[#173f56] text-xl sm:text-2xl mt-4">{formatDueDate(activePolicy.end_date)}</p>

                  <div className="mt-5 flex flex-col sm:flex-row gap-3">
                    <Link
                      to={`/policies/${activePolicy.id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#237987] hover:bg-[#1c6672] text-white px-5 py-2.5 text-base sm:text-lg font-medium transition-colors"
                    >
                      <MessageCircleMore className="h-5 w-5" />
                      Give Feedback
                    </Link>
                    <Link
                      to={`/policies/${activePolicy.id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#237987] hover:bg-[#1c6672] text-white px-5 py-2.5 text-base sm:text-lg font-medium transition-colors"
                    >
                      <Vote className="h-5 w-5" />
                      Vote Now
                    </Link>
                  </div>

                  <div className="mt-5 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4">
                    <p className="text-[#1b4259] text-base sm:text-lg">
                      {activePolicyStats.votes.toLocaleString()} Votes ·{' '}
                      {activePolicyStats.feedback.toLocaleString()} comments
                    </p>
                    <div className="h-20 w-full lg:w-[230px] rounded-[28px] bg-gradient-to-r from-[#6fb8d6] via-[#8dc7d9] to-[#5f9bc1] border border-[#cde4ec] overflow-hidden">
                      <div className="h-full w-full bg-[radial-gradient(circle_at_20%_70%,rgba(255,255,255,0.85),transparent_38%),radial-gradient(circle_at_85%_30%,rgba(255,255,255,0.75),transparent_35%),linear-gradient(90deg,#4f9dc4,#86bdd2)]" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-8">
                  <p className="text-[#173f56] text-xl font-medium">No active consultations right now.</p>
                  <p className="mt-2 text-[#3a6279] text-base">Check back soon for new municipal initiatives.</p>
                </div>
              )}
            </div>
          </article>

          <article>
            <h2 className="text-white text-2xl sm:text-[2.1rem] font-semibold mb-3 flex items-center gap-2">
              My Feedback status
              <CheckCircle2 className="h-6 w-6 text-white/90" />
            </h2>

            <div className="rounded-[32px] bg-[#f8fafb] px-6 py-6 shadow-lg border border-white/35">
              {feedbackPolicy ? (
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-[#13364c] text-2xl sm:text-3xl leading-tight font-semibold max-w-[410px]">
                    {feedbackPolicy.title}
                  </h3>
                  <span
                    className={`inline-flex items-center rounded-2xl px-4 py-2 text-sm sm:text-base font-medium uppercase tracking-wide ${statusChipClass[feedbackPolicy.status]}`}
                  >
                    {statusLabel[feedbackPolicy.status]}
                  </span>
                </div>
              ) : (
                <div>
                  <h3 className="text-[#13364c] text-2xl leading-tight font-semibold">No feedback submitted yet</h3>
                  <p className="mt-3 text-[#365a71] text-base">Your recent feedback activity will appear here.</p>
                </div>
              )}
            </div>
          </article>
        </div>

        <div className="mt-10 sm:mt-14 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
          <Link
            to={activePolicy ? `/policies/${activePolicy.id}` : '/policies'}
            className="w-full sm:w-auto min-w-[260px] inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#4caec0] via-[#74c38c] to-[#9ad05d] px-7 py-3.5 text-[#10364b] font-semibold text-base sm:text-xl shadow-md hover:brightness-105"
          >
            <Bot className="h-5 w-5" />
            Assisted Feedback
          </Link>
          <Link
            to="/policies"
            className="w-full sm:w-auto min-w-[260px] inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#77d0df] via-[#a7d4af] to-[#dfcf6c] px-7 py-3.5 text-[#10364b] font-semibold text-base sm:text-xl shadow-md hover:brightness-105"
          >
            <ScanSearch className="h-5 w-5" />
            Browse Consultations
          </Link>
        </div>
      </div>
    </section>
  );
}
