CREATE TABLE IF NOT EXISTS university.staff_invitations (
  email text PRIMARY KEY CHECK (email=lower(trim(email))),
  created_at timestamptz NOT NULL DEFAULT now(),
  redeemed_at timestamptz,
  redeemed_by uuid REFERENCES neon_auth."user"(id),
  CHECK ((redeemed_at IS NULL)=(redeemed_by IS NULL))
);
REVOKE ALL ON university.staff_invitations FROM PUBLIC;
