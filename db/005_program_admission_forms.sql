CREATE TABLE IF NOT EXISTS university.program_admission_forms(program_id uuid PRIMARY KEY REFERENCES university.programs(id),draft jsonb NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(draft)='array'),published_fields jsonb CHECK(published_fields IS NULL OR jsonb_typeof(published_fields)='array'),version integer NOT NULL DEFAULT 1,published_version integer,updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE university.applications ADD COLUMN IF NOT EXISTS program_id uuid REFERENCES university.programs(id), ADD COLUMN IF NOT EXISTS form_version integer, ADD COLUMN IF NOT EXISTS form_snapshot jsonb, ADD COLUMN IF NOT EXISTS form_answers jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS applications_program_unique ON university.applications(user_id,program_id) WHERE program_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS applications_legacy_unique ON university.applications(user_id) WHERE program_id IS NULL;
ALTER TABLE university.applications DROP CONSTRAINT IF EXISTS applications_user_id_key;
REVOKE ALL ON university.program_admission_forms FROM PUBLIC;
