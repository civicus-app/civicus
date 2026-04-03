-- Fix: the restrictive RLS policy "verified session required for admin policy writes"
-- was declared as FOR ALL, which includes SELECT. This silently returns 0 rows for
-- any authenticated user whose session is not in verified_sessions (e.g. when the
-- auth-mark-session-verified edge function fails or the session row expires).
--
-- Policy intent: only WRITES to the policies table (and its child tables) should
-- require session verification. Reads must remain open so citizens and admins can
-- browse policies after a normal password login.

-- Policies table: replace FOR ALL with FOR INSERT, UPDATE, DELETE
drop policy if exists "verified session required for admin policy writes" on public.policies;
create policy "verified session required for admin policy writes" on public.policies
as restrictive
for insert
to authenticated
with check (public.is_current_session_verified());

create policy "verified session required for admin policy updates" on public.policies
as restrictive
for update
to authenticated
using (public.is_current_session_verified())
with check (public.is_current_session_verified());

create policy "verified session required for admin policy deletes" on public.policies
as restrictive
for delete
to authenticated
using (public.is_current_session_verified());

-- Child tables: same fix — replace FOR ALL with explicit write operations only
drop policy if exists "verified session required for admin policy district writes" on public.policy_districts;
create policy "verified session required for admin policy district writes" on public.policy_districts
as restrictive
for insert
to authenticated
with check (public.is_current_session_verified());

create policy "verified session required for admin policy district updates" on public.policy_districts
as restrictive
for update
to authenticated
using (public.is_current_session_verified())
with check (public.is_current_session_verified());

create policy "verified session required for admin policy district deletes" on public.policy_districts
as restrictive
for delete
to authenticated
using (public.is_current_session_verified());

drop policy if exists "verified session required for admin policy tag writes" on public.policy_tags;
create policy "verified session required for admin policy tag writes" on public.policy_tags
as restrictive
for insert
to authenticated
with check (public.is_current_session_verified());

create policy "verified session required for admin policy tag updates" on public.policy_tags
as restrictive
for update
to authenticated
using (public.is_current_session_verified())
with check (public.is_current_session_verified());

create policy "verified session required for admin policy tag deletes" on public.policy_tags
as restrictive
for delete
to authenticated
using (public.is_current_session_verified());

drop policy if exists "verified session required for admin attachment writes" on public.policy_attachments;
create policy "verified session required for admin attachment writes" on public.policy_attachments
as restrictive
for insert
to authenticated
with check (public.is_current_session_verified());

create policy "verified session required for admin attachment updates" on public.policy_attachments
as restrictive
for update
to authenticated
using (public.is_current_session_verified())
with check (public.is_current_session_verified());

create policy "verified session required for admin attachment deletes" on public.policy_attachments
as restrictive
for delete
to authenticated
using (public.is_current_session_verified());

drop policy if exists "verified session required for admin policy topic writes" on public.policy_topics;
create policy "verified session required for admin policy topic writes" on public.policy_topics
as restrictive
for insert
to authenticated
with check (public.is_current_session_verified());

create policy "verified session required for admin policy topic updates" on public.policy_topics
as restrictive
for update
to authenticated
using (public.is_current_session_verified())
with check (public.is_current_session_verified());

create policy "verified session required for admin policy topic deletes" on public.policy_topics
as restrictive
for delete
to authenticated
using (public.is_current_session_verified());

drop policy if exists "verified session required for admin policy update writes" on public.policy_updates;
create policy "verified session required for admin policy update writes" on public.policy_updates
as restrictive
for insert
to authenticated
with check (public.is_current_session_verified());

create policy "verified session required for admin policy update updates" on public.policy_updates
as restrictive
for update
to authenticated
using (public.is_current_session_verified())
with check (public.is_current_session_verified());

create policy "verified session required for admin policy update deletes" on public.policy_updates
as restrictive
for delete
to authenticated
using (public.is_current_session_verified());

drop policy if exists "verified session required for admin event writes" on public.events;
create policy "verified session required for admin event writes" on public.events
as restrictive
for insert
to authenticated
with check (public.is_current_session_verified());

create policy "verified session required for admin event updates" on public.events
as restrictive
for update
to authenticated
using (public.is_current_session_verified())
with check (public.is_current_session_verified());

create policy "verified session required for admin event deletes" on public.events
as restrictive
for delete
to authenticated
using (public.is_current_session_verified());
