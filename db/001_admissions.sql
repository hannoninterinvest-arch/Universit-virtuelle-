CREATE SCHEMA IF NOT EXISTS university;
CREATE TABLE IF NOT EXISTS university.staff_members (
  user_id uuid PRIMARY KEY REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
  granted_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS university.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(data) = 'object'),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','needs_changes','accepted','rejected')),
  version integer NOT NULL DEFAULT 1,
  admin_note text NOT NULL DEFAULT '',
  reviewed_by uuid REFERENCES neon_auth."user"(id),
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS applications_status_date_idx ON university.applications(status, updated_at DESC);
CREATE TABLE IF NOT EXISTS university.application_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES university.applications(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES neon_auth."user"(id),
  event text NOT NULL CHECK (event IN ('draft','submitted','needs_changes','accepted','rejected')),
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS application_events_timeline_idx ON university.application_events(application_id, created_at);
REVOKE ALL ON SCHEMA university FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA university FROM PUBLIC;
