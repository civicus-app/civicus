-- =============================================================================
-- Fix: Remove restrictive verified-session RLS policies from citizen-facing
-- tables (feedback, sentiment_votes, policy_views, policy_follows,
-- notifications, survey_responses, map_comments).
--
-- Root cause: The restrictive policies require is_current_session_verified()
-- which checks the verified_sessions table. For citizen users, this row may
-- not exist if:
--   (a) MFA is disabled and markSessionVerified edge function fails silently
--   (b) The session was refreshed and the old session_id no longer matches
--   (c) The verified_sessions row has expired
--
-- The existing permissive policies (e.g. "users create their own feedback"
-- checking auth.uid() = user_id) already provide proper authorization.
-- The citizen voting/feedback flow also has its own verification step
-- (MinID/BankID via useVerificationStore) which is independent of the
-- DB-level session verification.
--
-- Admin-only tables (policies, policy_districts, policy_tags, etc.) KEEP
-- their restrictive policies since admin operations are properly gated
-- through the full MFA flow.
-- =============================================================================

-- ── feedback ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "verified session required for feedback writes"  ON public.feedback;
DROP POLICY IF EXISTS "verified session required for feedback updates" ON public.feedback;
DROP POLICY IF EXISTS "verified session required for feedback deletes" ON public.feedback;

-- ── sentiment_votes ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "verified session required for vote writes"  ON public.sentiment_votes;
DROP POLICY IF EXISTS "verified session required for vote updates" ON public.sentiment_votes;
DROP POLICY IF EXISTS "verified session required for vote deletes" ON public.sentiment_votes;

-- ── policy_views ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "verified session required for policy view access" ON public.policy_views;

-- ── policy_follows ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "verified session required for policy follows" ON public.policy_follows;

-- ── notifications ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "verified session required for notification reads"   ON public.notifications;
DROP POLICY IF EXISTS "verified session required for notification updates" ON public.notifications;

-- ── survey_responses ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "verified session required for survey responses" ON public.survey_responses;

-- ── map_comments ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "verified session required for map comment writes"  ON public.map_comments;
DROP POLICY IF EXISTS "verified session required for map comment updates" ON public.map_comments;
DROP POLICY IF EXISTS "verified session required for map comment deletes" ON public.map_comments;
