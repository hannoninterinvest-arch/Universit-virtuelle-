import { z } from 'zod';
import { isSafeLink } from './academics';
const text=z.string().trim().max(3000),short=z.string().trim().max(180),id=z.uuid();
export const localDate=z.string().refine(v=>!v||(z.iso.date().safeParse(v.slice(0,10)).success&&/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(v)&&Number.isFinite(Date.parse(v+'+01:00'))),'Date et heure invalides.');
export const asTimestamp=(v:string)=>v?new Date(v+'+01:00').toISOString():null;
export const programSchema=z.object({id:z.union([id,z.literal('')]),version:z.number().int().min(0),code:short.min(1),title:short.min(3),level:short,duration:short,description:text,requirements:text,tuition:z.number().min(0).max(1000000),currency:z.enum(['TND','EUR','USD']),published:z.boolean(),enrollmentOpen:z.boolean()}).strict();
export const assessmentSchema=z.object({subjectId:id,title:short.min(3),kind:z.enum(['assignment','quiz','exam']),instructions:text,opensAt:localDate,dueAt:localDate,timeLimit:z.number().int().min(0).max(300),maxScore:z.number().positive().max(10000),weight:z.number().positive().max(1000),published:z.boolean(),questions:z.array(z.object({prompt:short.min(3),choices:z.array(short.min(1)).length(4),correctIndex:z.number().int().min(0).max(3),points:z.number().positive().max(1000)})).max(50)}).strict().superRefine((d,c)=>{if(d.kind==='quiz'&&!d.questions.length)c.addIssue({code:'custom',path:['questions'],message:'Ajoutez au moins une question.'});if(d.dueAt&&d.opensAt&&asTimestamp(d.dueAt)!<=asTimestamp(d.opensAt)!)c.addIssue({code:'custom',path:['dueAt'],message:'La clôture doit suivre l’ouverture.'});});
export const campusSchemas={
  settings:z.object({name:short.min(3),email:z.email(),address:text,registration:short,taxId:short,phone:short}).strict(),
  program:programSchema,
  teacher:z.object({subjectId:id,email:z.email().toLowerCase(),active:z.boolean()}).strict(),
  assessment:assessmentSchema,
  assessmentVisibility:z.object({assessmentId:id,published:z.boolean()}).strict(),
  assessmentSettings:z.object({assessmentId:id,version:z.number().int().positive(),title:short.min(3),instructions:text,dueAt:localDate}).strict(),
  classProgram:z.object({classId:id,programId:z.union([id,z.literal('')])}).strict(),
  submission:z.object({assessmentId:id,text:text,attachmentId:z.union([id,z.literal('')]),answers:z.record(id,z.number().int().min(0).max(3))}).strict(),
  saveDraft:z.object({assessmentId:id,text:text,attachmentId:z.union([id,z.literal('')]),answers:z.record(id,z.number().int().min(0).max(3))}).strict(),
  start:z.object({assessmentId:id}).strict(),
  correction:z.object({submissionId:id,version:z.number().int().positive(),score:z.number().min(0).max(10000),feedback:text,published:z.boolean()}).strict(),
  progress:z.object({resourceId:id,done:z.boolean()}).strict(),
  attendance:z.object({sessionId:id,studentId:id,date:z.iso.date(),status:z.enum(['present','absent','late','excused']),note:text}).strict(),
  read:z.object({id:z.union([id,z.literal('all')])}).strict(),
  ticket:z.object({title:short.min(3),body:text.min(5)}).strict(),
  reply:z.object({ticketId:id,body:text.min(1),close:z.boolean()}).strict(),
  invoice:z.object({email:z.email().toLowerCase(),title:short.min(3),amount:z.number().positive().max(1000000),currency:z.enum(['TND','EUR','USD']),dueDate:z.iso.date(),instructions:text,checkoutUrl:z.string().max(2048).refine(v=>!v||isSafeLink(v),'Lien HTTPS invalide.')}).strict(),
  payment:z.object({invoiceId:id,amount:z.number().positive().max(1000000),reference:short.min(3),attachmentId:z.union([id,z.literal('')])}).strict(),
  paymentReview:z.object({paymentId:id,status:z.enum(['verified','rejected']),note:text}).strict(),
  certificate:z.object({kind:z.enum(['enrollment','attendance','transcript'])}).strict(),
  certificateReview:z.object({id,status:z.enum(['approved','rejected']),note:text}).strict(),
  documentReview:z.object({id,status:z.enum(['accepted','rejected']),note:text}).strict(),
  announce:z.object({classId:id,title:short.min(3),body:text.min(3)}).strict(),
} as const;
export type CampusOperation=keyof typeof campusSchemas;
export const certificateLabels={enrollment:'Attestation d’inscription',attendance:'Attestation de participation',transcript:'Relevé de notes'};
export const assessmentLabels={assignment:'Devoir',quiz:'Quiz',exam:'Examen'};
export function currencyScale(currency:string){return 10**(new Intl.NumberFormat('fr',{style:'currency',currency}).resolvedOptions().maximumFractionDigits??2);}
export function minorAmount(amount:number,currency:string){return Math.round(amount*currencyScale(currency));}
export function money(amount:number|string,currency='TND'){return new Intl.NumberFormat('fr-TN',{style:'currency',currency}).format(Number(amount)/currencyScale(currency));}
export function quizScore(questions:{id:string;correct_index:number;points:number|string}[],answers:Record<string,number>,maxScore:number){const max=questions.reduce((n,q)=>n+Number(q.points),0);return max?questions.reduce((n,q)=>n+(answers[q.id]===q.correct_index?Number(q.points):0),0)/max*maxScore:0;}
export function submissionDeadline(due:string|null,started:string,minutes:number|null){const deadlines=[due?Date.parse(due):Infinity,minutes?Date.parse(started)+minutes*60000:Infinity];return Math.min(...deadlines);}
export function dateTime(v:string|Date|null){return v?new Intl.DateTimeFormat('fr-TN',{dateStyle:'medium',timeStyle:'short',timeZone:'Africa/Tunis'}).format(new Date(v)):'Sans date limite';}
