-- Migration: Restrict feedback visibility to only the user who submitted it and admins
-- Date: 2026-04-04

-- Drop the old permissive select policy
DROP POLICY IF EXISTS "feedback is readable by everyone" ON public.feedback;

-- Create a new select policy: only the user who submitted or admins can read
CREATE POLICY "feedback is readable by self or admins" ON public.feedback
FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
