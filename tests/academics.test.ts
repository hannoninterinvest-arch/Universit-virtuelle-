import test from 'node:test';
import assert from 'node:assert/strict';
import { classSchema,gradeSchema,resourceSchema,timetableSchema,isSafeLink,isClassroomLink,pdfPreviewUrl,subjectAverage,weekDates,shiftWeek,sessionOccursOn } from '../lib/academics';
const classId='11111111-1111-4111-8111-111111111111',subjectId='22222222-2222-4222-8222-222222222222',studentId='33333333-3333-4333-8333-333333333333';
test('only safe HTTPS resources and exact Classroom origins are accepted',()=>{
  for(const url of ['javascript:alert(1)','http://example.com/course','https://localhost/','https://127.0.0.1/','https://user:password@example.com/','https://[::1]/'])assert.equal(isSafeLink(url),false,url);
  assert.equal(isClassroomLink('https://classroom.google.com/c/course'),true);assert.equal(isClassroomLink('https://classroom.google.com.evil.example/c/course'),false);
});
test('Google Drive PDF links retain file identity and resource keys',()=>{
  assert.equal(pdfPreviewUrl('https://drive.google.com/file/d/abcdefghij123/view?resourcekey=key123'),'https://drive.google.com/file/d/abcdefghij123/preview?resourcekey=key123');
  assert.equal(pdfPreviewUrl('https://drive.google.com/open?id=abcdefghij123'),'https://drive.google.com/file/d/abcdefghij123/preview');
  assert.equal(pdfPreviewUrl('https://example.com/course.pdf?download=1'),'https://example.com/course.pdf?download=1');
  assert.equal(pdfPreviewUrl('https://classroom.google.com/c/123'),null);
});
test('resource type must match the provided link',()=>{const r={id:'',version:0,classId,subjectId,title:'Support de cours',url:'https://example.com/course',kind:'pdf',summary:'',published:false,sortOrder:0};assert.equal(resourceSchema.safeParse(r).success,false);assert.equal(resourceSchema.safeParse({...r,kind:'link'}).success,true);assert.equal(resourceSchema.safeParse({...r,kind:'classroom'}).success,false);});
test('grade boundaries, positive weights and mass-assignment protection',()=>{const g={id:'',version:0,classId,subjectId,studentId,assessment:'Contrôle',score:15,maxScore:20,weight:1,assessmentDate:'2026-11-27',comment:'',published:false};assert.equal(gradeSchema.safeParse(g).success,true);for(const change of [{score:21},{score:-1},{maxScore:0},{weight:0},{role:'admin'}])assert.equal(gradeSchema.safeParse({...g,...change}).success,false);});
test('averages normalize mixed scales to 20 and respect evaluation weights',()=>{assert.equal(subjectAverage([]),null);assert.equal(subjectAverage([{score:'8',max_score:'10',weight:'1'},{score:'70',max_score:'100',weight:'3'}]),14.5);assert.equal(subjectAverage([{score:'0',max_score:'20',weight:'1'}]),0);});
test('timetable rejects reversed/invalid hours and reversed date ranges',()=>{const s={id:'',version:0,classId,subjectId,title:'Séance',weekday:1,startTime:'09:00',endTime:'10:00',startDate:'2026-01-01',endDate:'2026-12-31',meetingUrl:'https://meet.google.com/abc-defg-hij',active:true};assert.equal(timetableSchema.safeParse(s).success,true);for(const change of [{endTime:'08:00'},{startTime:'25:00'},{weekday:8},{endDate:'2025-01-01'}])assert.equal(timetableSchema.safeParse({...s,...change}).success,false);});
test('weekly agenda handles Sunday, month/year rollover and session validity',()=>{assert.equal(weekDates('2026-11-29')[0],'2026-11-23');assert.equal(shiftWeek('2026-12-28',1),'2027-01-04');const t={weekday:1,start_date:'2026-11-23',end_date:'2026-11-30',active:true};assert.equal(sessionOccursOn(t,'2026-11-23',1),true);assert.equal(sessionOccursOn(t,'2026-12-07',1),false);assert.equal(sessionOccursOn({...t,active:false},'2026-11-23',1),false);});
test('academic year must be consecutive',()=>{const c={id:'',version:0,name:'Informatique',code:'INFO1',academicYear:'2026-2027',level:'L1',description:'',active:true};assert.equal(classSchema.safeParse(c).success,true);assert.equal(classSchema.safeParse({...c,academicYear:'2026-2029'}).success,false);});
