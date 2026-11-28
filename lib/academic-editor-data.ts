import type { AcademicClass,Subject,CourseResource,TimetableEntry,Grade } from './academics';
const aliases:Record<string,string>={document_id:'documentId',academic_year:'academicYear',class_id:'classId',subject_id:'subjectId',student_id:'studentId',classroom_url:'classroomUrl',classroom_code:'classroomCode',sort_order:'sortOrder',weekday:'weekday',start_time:'startTime',end_time:'endTime',start_date:'startDate',end_date:'endDate',meeting_url:'meetingUrl',max_score:'maxScore',assessment_date:'assessmentDate'};
export function editorData(row:AcademicClass|Subject|CourseResource|TimetableEntry|Grade) {
  return Object.fromEntries(Object.entries(row).map(([key,value])=>[aliases[key]??key,['start_time','end_time'].includes(key)?String(value).slice(0,5):value??'']));
}
