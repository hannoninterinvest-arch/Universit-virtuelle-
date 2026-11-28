// The user identifier comes from the authenticated session. The email and its
// verified status are read from Neon Auth, never from a browser or URL parameter.
export const redeemStaffInvitationSql = `WITH eligible AS MATERIALIZED (
  SELECT u.id,u.email FROM neon_auth."user" u
  JOIN university.staff_invitations i ON i.email=lower(u.email)
  WHERE u.id=$1 AND u."emailVerified"=true AND i.redeemed_at IS NULL
    AND coalesce(u.banned,false)=false
  FOR UPDATE OF i
), granted AS (
  INSERT INTO university.staff_members(user_id)
  SELECT id FROM eligible ON CONFLICT DO NOTHING RETURNING user_id
), redeemed AS (
  UPDATE university.staff_invitations i SET redeemed_at=now(),redeemed_by=e.id
  FROM eligible e WHERE i.email=lower(e.email)
    AND (EXISTS(SELECT 1 FROM granted g WHERE g.user_id=e.id)
      OR EXISTS(SELECT 1 FROM university.staff_members s WHERE s.user_id=e.id))
  RETURNING redeemed_by
)
SELECT 1 FROM granted
UNION SELECT 1 FROM university.staff_members WHERE user_id=$1`;
