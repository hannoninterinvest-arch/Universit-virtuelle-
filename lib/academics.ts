import { z } from 'zod';
export const weekdays = ['','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
export const resourceKinds = {link:'Lien de cours',pdf:'Support PDF',classroom:'Google Classroom',video:'Vidéo'} as const;
export function isSafeLink(value:string) {
  try { const u=new URL(value);const h=u.hostname.toLowerCase();return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&h.includes('.')&&!h.endsWith('.local')&&!h.endsWith('.localhost')&&!h.endsWith('.internal')&&!/^\d+\.\d+\.\d+\.\d+$/.test(h)&&!h.includes(':'); } catch {return false;}
}
export function isClassroomLink(value:string) {return isSafeLink(value)&&new URL(value).hostname==='classroom.google.com';}
export function pdfPreviewUrl(value:string):string|null {
  if(!isSafeLink(value))return null;
  const url=new URL(value);
  if(url.hostname==='drive.google.com') {
    const id=url.pathname.match(/^\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1]??url.searchParams.get('id');
    if(!id||!/^[a-zA-Z0-9_-]{10,200}$/.test(id))return null;
    const preview=new URL(`https://drive.google.com/file/d/${id}/preview`);
    const resourceKey=url.searchParams.get('resourcekey');if(resourceKey)preview.searchParams.set('resourcekey',resourceKey);
    return preview.toString();
  }
  return /\.pdf$/i.test(url.pathname)?url.toString():null;
}
const short=z.string().trim().max(150),long=z.string().trim().max(3000);
const link=z.string().trim().max(2048).refine(isSafeLink,'Utilisez un lien HTTPS public valide.');
const classroom=z.string().trim().max(2048).refine(v=>!v||isClassroomLink(v),'Le lien doit appartenir à classroom.google.com.');
const base={id:z.union([z.uuid(),z.literal('')]),version:z.number().int().min(0)};
const classId=z.uuid('Classe invalide.');
const code=z.string().trim().min(1,'Indiquez un code.').max(40).regex(/^[\p{L}\p{N} _.-]+$/u,'Code invalide.');
export const classSchema=z.object({...base,code,name:short.min(2,'Indiquez le nom de la classe.'),academicYear:z.string().regex(/^\d{4}-\d{4}$/,'Format attendu : 2026-2027.').refine(v=>Number(v.slice(5))===Number(v.slice(0,4))+1,'Les années doivent se suivre.'),level:short,description:long,active:z.boolean()}).strict();
export const subjectSchema=z.object({...base,classId,code,name:short.min(2),teacher:short,description:long,coefficient:z.number().min(.001).max(1000),classroomUrl:classroom,classroomCode:z.string().trim().max(30).regex(/^[a-zA-Z0-9 -]*$/,'Code Classroom invalide.'),active:z.boolean()}).strict();
export const resourceSchema=z.object({...base,classId,subjectId:z.uuid(),title:short.min(2),kind:z.enum(['link','pdf','classroom','video']),url:link,summary:long,published:z.boolean(),sortOrder:z.number().int().min(0).max(10000)}).strict().superRefine((d,c)=>{if(d.kind==='classroom'&&!isClassroomLink(d.url))c.addIssue({code:'custom',path:['url'],message:'Utilisez un lien Google Classroom.'});if(d.kind==='pdf'&&!pdfPreviewUrl(d.url))c.addIssue({code:'custom',path:['url'],message:'Utilisez le lien du fichier Google Drive ou une adresse se terminant par .pdf.'});});
export const membershipSchema=z.object({classId,email:z.email().toLowerCase(),active:z.boolean()}).strict();
const optionalDate=z.union([z.iso.date(),z.literal('')]);
export const timetableSchema=z.object({...base,classId,subjectId:z.uuid(),title:short.min(2),weekday:z.number().int().min(1).max(7),startTime:z.string().regex(/^\d{2}:\d{2}$/),endTime:z.string().regex(/^\d{2}:\d{2}$/),startDate:optionalDate,endDate:optionalDate,meetingUrl:link,active:z.boolean()}).strict().superRefine((d,c)=>{const valid=(v:string)=>/^([01]\d|2[0-3]):[0-5]\d$/.test(v);if(!valid(d.startTime)||!valid(d.endTime)||d.endTime<=d.startTime)c.addIssue({code:'custom',path:['endTime'],message:'La fin doit être après le début, le même jour.'});if(d.startDate&&d.endDate&&d.endDate<d.startDate)c.addIssue({code:'custom',path:['endDate'],message:'La fin de période doit être après son début.'});});
export const gradeSchema=z.object({...base,classId,subjectId:z.uuid(),studentId:z.uuid(),assessment:short.min(2),score:z.number().min(0).max(10000),maxScore:z.number().min(.001).max(10000),weight:z.number().min(.001).max(1000),assessmentDate:z.iso.date(),comment:long,published:z.boolean()}).strict().refine(v=>v.score<=v.maxScore,{path:['score'],message:'La note ne peut pas dépasser le barème.'});
export type AcademicKind='class'|'subject'|'resource'|'membership'|'timetable'|'grade';
export type AcademicResult={ok:boolean;message:string;errors?:Record<string,string[]>;id?:string};
export type AcademicClass={id:string;code:string;name:string;academic_year:string;level:string;description:string;active:boolean;version:number;member_count?:string;subject_count?:string};
export type Subject={id:string;class_id:string;code:string;name:string;teacher:string;description:string;coefficient:string;classroom_url:string;classroom_code:string;active:boolean;version:number;class_name?:string;class_code?:string;academic_year?:string;resource_count?:string};
export type CourseResource={id:string;subject_id:string;title:string;kind:keyof typeof resourceKinds;url:string;summary:string;published:boolean;sort_order:number;version:number;subject_name?:string;class_name?:string;class_id?:string};
export type Membership={student_id:string;class_id:string;email:string;name:string;active:boolean};
export type TimetableEntry={id:string;class_id:string;subject_id:string;title:string;weekday:number;start_time:string;end_time:string;start_date:string|null;end_date:string|null;meeting_url:string;active:boolean;version:number;subject_name?:string;class_name?:string;teacher?:string};
export type Grade={id:string;class_id:string;subject_id:string;student_id:string;assessment:string;score:string;max_score:string;weight:string;assessment_date:string;comment:string;published:boolean;version:number;subject_name?:string;class_name?:string;student_name?:string;coefficient?:string};
export function subjectAverage(grades:Pick<Grade,'score'|'max_score'|'weight'>[]) {
  if(!grades.length)return null;
  let total=0,weights=0;for(const g of grades){const max=Number(g.max_score),w=Number(g.weight),score=Number(g.score);if(!Number.isFinite(max)||max<=0||!Number.isFinite(w)||w<=0||!Number.isFinite(score)||score<0||score>max)continue;total+=score/max*20*w;weights+=w;}
  return weights?total/weights:null;
}
export function displayNumber(value:number|string) {return new Intl.NumberFormat('fr-TN',{maximumFractionDigits:2}).format(Number(value));}
export function weekDates(value?:string) {
  const fallback=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Tunis',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const parsed=z.iso.date().safeParse(value),date=new Date(`${parsed.success?parsed.data:fallback}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate()-(date.getUTCDay()+6)%7);
  return Array.from({length:7},(_,i)=>{const d=new Date(date);d.setUTCDate(d.getUTCDate()+i);return d.toISOString().slice(0,10);});
}
export function shiftWeek(monday:string,delta:number) {const d=new Date(`${monday}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+delta*7);return d.toISOString().slice(0,10);}
export function sessionOccursOn(session:Pick<TimetableEntry,'weekday'|'start_date'|'end_date'|'active'>,date:string,weekday:number) {return session.active&&session.weekday===weekday&&(!session.start_date||session.start_date<=date)&&(!session.end_date||session.end_date>=date);}
