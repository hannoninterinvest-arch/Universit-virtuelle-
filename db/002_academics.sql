CREATE TABLE IF NOT EXISTS university.academic_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  academic_year text NOT NULL,
  level text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS university.class_memberships (
  class_id uuid NOT NULL REFERENCES university.academic_classes(id),
  student_id uuid NOT NULL REFERENCES neon_auth."user"(id),
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (class_id,student_id)
);
CREATE INDEX IF NOT EXISTS memberships_student_idx ON university.class_memberships(student_id,class_id) WHERE active;
CREATE TABLE IF NOT EXISTS university.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES university.academic_classes(id),
  code text NOT NULL,
  name text NOT NULL,
  teacher text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  coefficient numeric(8,3) NOT NULL DEFAULT 1 CHECK (coefficient>0),
  classroom_url text NOT NULL DEFAULT '',
  classroom_code text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id,code),
  UNIQUE (id,class_id)
);
CREATE TABLE IF NOT EXISTS university.course_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES university.subjects(id),
  title text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('link','pdf','classroom','video')),
  url text NOT NULL,
  summary text NOT NULL DEFAULT '',
  published boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS resources_subject_order_idx ON university.course_resources(subject_id,sort_order,created_at);
CREATE TABLE IF NOT EXISTS university.timetable_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL,
  subject_id uuid NOT NULL,
  title text NOT NULL,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 1 AND 7),
  start_time time NOT NULL,
  end_time time NOT NULL CHECK (end_time>start_time),
  start_date date,
  end_date date,
  meeting_url text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date>=start_date),
  FOREIGN KEY (subject_id,class_id) REFERENCES university.subjects(id,class_id)
);
CREATE INDEX IF NOT EXISTS timetable_class_idx ON university.timetable_entries(class_id,weekday,start_time) WHERE active;
CREATE TABLE IF NOT EXISTS university.grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL,
  subject_id uuid NOT NULL,
  student_id uuid NOT NULL,
  assessment text NOT NULL,
  score numeric(8,3) NOT NULL CHECK (score>=0),
  max_score numeric(8,3) NOT NULL CHECK (max_score>0),
  weight numeric(8,3) NOT NULL DEFAULT 1 CHECK (weight>0),
  assessment_date date NOT NULL,
  comment text NOT NULL DEFAULT '',
  published boolean NOT NULL DEFAULT false,
  version integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (score<=max_score),
  FOREIGN KEY (subject_id,class_id) REFERENCES university.subjects(id,class_id),
  FOREIGN KEY (class_id,student_id) REFERENCES university.class_memberships(class_id,student_id)
);
CREATE INDEX IF NOT EXISTS grades_student_idx ON university.grades(student_id,class_id,subject_id) WHERE published;
CREATE TABLE IF NOT EXISTS university.academic_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id uuid NOT NULL REFERENCES neon_auth."user"(id),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  class_id uuid REFERENCES university.academic_classes(id),
  changes jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON ALL TABLES IN SCHEMA university FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA university FROM PUBLIC;
