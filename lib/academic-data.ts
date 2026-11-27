import 'server-only';
import { db } from './db';
import type { AcademicClass,Subject,CourseResource,TimetableEntry,Grade } from './academics';
const membershipJoin=`JOIN university.class_memberships m ON m.class_id=c.id AND m.student_id=$1 AND m.active`;
export async function studentClasses(studentId:string) {
  return (await db.query<AcademicClass>(`SELECT c.id,c.code,c.name,c.academic_year,c.level,c.description,c.active,c.version FROM university.academic_classes c ${membershipJoin} WHERE c.active ORDER BY c.academic_year DESC,c.name`,[studentId])).rows;
}
export async function studentSubjects(studentId:string) {
  return (await db.query<Subject>(`SELECT s.id,s.class_id,s.code,s.name,s.teacher,s.description,s.coefficient,s.classroom_url,s.classroom_code,s.active,s.version,c.name AS class_name,c.code AS class_code,c.academic_year,
    (SELECT count(*) FROM university.course_resources r WHERE r.subject_id=s.id AND r.published) AS resource_count
    FROM university.subjects s JOIN university.academic_classes c ON c.id=s.class_id ${membershipJoin} WHERE c.active AND s.active ORDER BY c.name,s.name`,[studentId])).rows;
}
export async function studentResources(studentId:string,subjectId:string) {
  return (await db.query<CourseResource>(`SELECT r.id,r.subject_id,r.title,r.kind,r.url,r.summary,r.published,r.sort_order,r.version FROM university.course_resources r
    JOIN university.subjects s ON s.id=r.subject_id JOIN university.academic_classes c ON c.id=s.class_id ${membershipJoin}
    WHERE c.active AND s.active AND r.published AND s.id=$2 ORDER BY r.sort_order,r.created_at`,[studentId,subjectId])).rows;
}
export async function studentResource(studentId:string,id:string) {
  return (await db.query<CourseResource>(`SELECT r.id,r.subject_id,r.title,r.kind,r.url,r.summary,r.published,r.sort_order,r.version,s.name AS subject_name,c.name AS class_name
    FROM university.course_resources r JOIN university.subjects s ON s.id=r.subject_id JOIN university.academic_classes c ON c.id=s.class_id ${membershipJoin}
    WHERE c.active AND s.active AND r.published AND r.id=$2`,[studentId,id])).rows[0]??null;
}
export async function studentTimetable(studentId:string) {
  return (await db.query<TimetableEntry>(`SELECT t.id,t.class_id,t.subject_id,t.title,t.weekday,t.start_time::text,t.end_time::text,t.start_date::text,t.end_date::text,t.meeting_url,t.active,t.version,s.name AS subject_name,s.teacher,c.name AS class_name
    FROM university.timetable_entries t JOIN university.subjects s ON s.id=t.subject_id JOIN university.academic_classes c ON c.id=t.class_id ${membershipJoin}
    WHERE c.active AND s.active AND t.active ORDER BY t.weekday,t.start_time`,[studentId])).rows;
}
export async function studentGrades(studentId:string) {
  return (await db.query<Grade>(`SELECT g.id,g.class_id,g.subject_id,g.student_id,g.assessment,g.score::text,g.max_score::text,g.weight::text,g.assessment_date::text,g.comment,g.published,g.version,s.name AS subject_name,s.coefficient::text,c.name AS class_name
    FROM university.grades g JOIN university.subjects s ON s.id=g.subject_id JOIN university.academic_classes c ON c.id=g.class_id ${membershipJoin}
    WHERE c.active AND s.active AND g.published AND g.student_id=$1 ORDER BY c.name,s.name,g.assessment_date DESC`,[studentId])).rows;
}
