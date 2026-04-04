-- Remove the old MFA/trusted session policy if it exists
DROP POLICY IF EXISTS "verified session required for admin attachment writes" ON policy_attachments;

CREATE POLICY "Allow authenticated insert"
ON policy_attachments
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');
