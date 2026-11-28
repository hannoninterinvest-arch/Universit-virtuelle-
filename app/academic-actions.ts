'use server';
import { revalidatePath } from 'next/cache';
import type { PoolClient } from 'pg';
import { z } from 'zod';
import { requireUser,isStaff } from '@/lib/access';
import { canTeach } from '@/lib/campus-access';
import { notify,notifyClass } from '@/lib/notifications';
import { after } from 'next/server';
import { deliverOutbox } from '@/lib/mail';
import { db } from '@/lib/db';
import { classSchema,subjectSchema,resourceSchema,membershipSchema,timetableSchema,gradeSchema,type AcademicKind,type AcademicResult } from '@/lib/academics';
class AcademicError extends Error {}
type Table='academic_classes'|'subjects'|'course_resources'|'timetable_entries'|'grades';
async function persist(client:PoolClient,table:Table,values:Record<string,unknown>,id:string,version:number,classId?:string) {
  if((!id&&version!==0)||(id&&version<1))throw new AcademicError('Version invalide. Rechargez la page.');
  // Identifiers come only from the static server mappings below; values are parameters.
  const keys=Object.keys(values),params=Object.values(values);let sql:string;
  if(!id)sql=`INSERT INTO university.${table}(${keys.join(',')}) VALUES (${keys.map((_,i)=>`$${i+1}`).join(',')}) RETURNING id`;
  else {
    params.push(id,version);
    sql=`UPDATE university.${table} SET ${keys.map((k,i)=>`${k}=$${i+1}`).join(',')},version=version+1,updated_at=now() WHERE id=$${keys.length+1} AND version=$${keys.length+2}`;
    if(classId){params.push(classId);sql+=table==='course_resources'?` AND subject_id IN (SELECT id FROM university.subjects WHERE class_id=$${params.length})`:` AND class_id=$${params.length}`;}
    sql+=' RETURNING id';
  }
  const {rows}=await client.query(sql,params);
  if(!rows.length)throw new AcademicError('Cet élément a changé ou n’appartient pas à cette classe. Rechargez la page.');
  return rows[0].id as string;
}
export async function saveAcademicItem(kind:AcademicKind,input:unknown):Promise<AcademicResult> {
  const user=await requireUser(),staff=await isStaff(user.id);
  if(!staff&&!['resource','grade','timetable'].includes(kind))return{ok:false,message:'Accès réservé à l’administration.'};
  const schemas={class:classSchema,subject:subjectSchema,resource:resourceSchema,membership:membershipSchema,timetable:timetableSchema,grade:gradeSchema};
  if(!Object.hasOwn(schemas,kind))return {ok:false,message:'Opération invalide.'};
  const validated=schemas[kind].safeParse(input);
  if(!validated.success)return {ok:false,message:'Vérifiez les champs indiqués.',errors:z.flattenError(validated.error as z.ZodError).fieldErrors};
  const client=await db.connect();let classId:string|undefined,id='';
  try {
    await client.query('BEGIN');
    const raw=validated.data;
    if(!staff){if(!('subjectId' in raw)||!await canTeach(user.id,raw.subjectId))throw new AcademicError('Cette matière ne vous est pas attribuée.');if('id' in raw&&raw.id){const table=kind==='resource'?'course_resources':kind==='timetable'?'timetable_entries':'grades';const original=await client.query(`SELECT 1 FROM university.${table} WHERE id=$1 AND subject_id=$2`,[raw.id,raw.subjectId]);if(!original.rowCount)throw new AcademicError('Cet élément ne vous est pas accessible.');}}
    classId='classId' in raw?raw.classId:raw.id||undefined;
    if(classId){const locked=await client.query('SELECT id FROM university.academic_classes WHERE id=$1 FOR UPDATE',[classId]);if(!locked.rowCount)throw new AcademicError('Classe introuvable.');}
    if(kind==='class') {
      const d=classSchema.parse(input);
      id=await persist(client,'academic_classes',{code:d.code.toUpperCase(),name:d.name,academic_year:d.academicYear,level:d.level,description:d.description,active:d.active},d.id,d.version);classId=id;
    } else if(kind==='subject') {
      const d=subjectSchema.parse(input);
      id=await persist(client,'subjects',{class_id:d.classId,code:d.code.toUpperCase(),name:d.name,teacher:d.teacher,description:d.description,coefficient:d.coefficient,classroom_url:d.classroomUrl,classroom_code:d.classroomCode,active:d.active},d.id,d.version,d.classId);
    } else if(kind==='membership') {
      const d=membershipSchema.parse(input);
      const student=await client.query('SELECT id FROM neon_auth."user" WHERE lower(email)=$1',[d.email]);
      if(!student.rowCount)throw new AcademicError('Aucun compte étudiant ne correspond à cette adresse. L’étudiant doit d’abord créer son compte.');
      const result=await client.query('INSERT INTO university.class_memberships(class_id,student_id,active) VALUES($1,$2,$3) ON CONFLICT(class_id,student_id) DO UPDATE SET active=excluded.active,updated_at=now() RETURNING student_id',[d.classId,student.rows[0].id,d.active]);
      id=result.rows[0].student_id;
    } else {
      if(!('subjectId' in raw))throw new AcademicError('Matière manquante.');
      const subject=await client.query('SELECT id,active FROM university.subjects WHERE id=$1 AND class_id=$2',[raw.subjectId,classId]);
      if(!subject.rowCount)throw new AcademicError('Cette matière n’appartient pas à la classe.');
      if(kind==='resource') {
        const d=resourceSchema.parse(input);
        if(d.published&&!subject.rows[0].active)throw new AcademicError('Réactivez la matière avant de publier un cours.');
        if(d.documentId){const file=await client.query('SELECT content_type FROM university.documents WHERE id=$1 AND (owner_id=$2 OR $3)',[d.documentId,user.id,staff]);if(!file.rowCount)throw new AcademicError('Ce fichier ne vous appartient pas.');if(d.kind==='pdf'&&file.rows[0].content_type!=='application/pdf')throw new AcademicError('Choisissez un fichier PDF.');if(d.url!=='https://hannon-universite-virtuelle.vercel.app/api/fichiers/'+d.documentId)throw new AcademicError('Le lien ne correspond pas au fichier déposé.');}else if(new URL(d.url).hostname==='hannon-universite-virtuelle.vercel.app'&&new URL(d.url).pathname.startsWith('/api/fichiers/'))throw new AcademicError('Déposez ce fichier depuis le formulaire pour le partager avec votre classe.');
        id=await persist(client,'course_resources',{document_id:d.documentId||null,subject_id:d.subjectId,title:d.title,kind:d.kind,url:d.url,summary:d.summary,published:d.published,sort_order:d.sortOrder},d.id,d.version,d.classId);
      } else if(kind==='timetable') {
        const d=timetableSchema.parse(input);
        if(d.active) {
          const conflict=await client.query(`SELECT id FROM university.timetable_entries WHERE class_id=$1 AND active AND weekday=$2 AND start_time<$4::time AND end_time>$3::time
            AND daterange(start_date,end_date,'[]') && daterange($5::date,$6::date,'[]') AND ($7::uuid IS NULL OR id<>$7::uuid) LIMIT 1`,[d.classId,d.weekday,d.startTime,d.endTime,d.startDate||null,d.endDate||null,d.id||null]);
          if(conflict.rowCount)throw new AcademicError('Ce créneau chevauche une autre séance de la classe. Modifiez le jour, les horaires ou la période.');
        }
        id=await persist(client,'timetable_entries',{class_id:d.classId,subject_id:d.subjectId,title:d.title,weekday:d.weekday,start_time:d.startTime,end_time:d.endTime,start_date:d.startDate||null,end_date:d.endDate||null,meeting_url:d.meetingUrl,active:d.active},d.id,d.version,d.classId);
      } else if(kind==='grade') {
        const d=gradeSchema.parse(input);
        if(d.id){const linked=(await client.query('SELECT submission_id FROM university.grades WHERE id=$1',[d.id])).rows[0];if(linked?.submission_id)throw new AcademicError('Modifiez cette note depuis la correction de la copie, dans l’espace enseignant.');}
        if(d.id){const existing=await client.query('SELECT 1 FROM university.grades WHERE id=$1 AND class_id=$2 AND student_id=$3 AND subject_id=$4',[d.id,d.classId,d.studentId,d.subjectId]);if(!existing.rowCount)throw new AcademicError('Une note existante doit rester rattachée au même étudiant et à la même matière.');}
        const member=await client.query('SELECT 1 FROM university.class_memberships WHERE class_id=$1 AND student_id=$2 AND active',[d.classId,d.studentId]);
        if(!member.rowCount)throw new AcademicError('L’étudiant doit être affecté à cette classe pour recevoir une note.');
        id=await persist(client,'grades',{class_id:d.classId,subject_id:d.subjectId,student_id:d.studentId,assessment:d.assessment,score:d.score,max_score:d.maxScore,weight:d.weight,assessment_date:d.assessmentDate,comment:d.comment,published:d.published},d.id,d.version,d.classId);
      }
    }
    await client.query('INSERT INTO university.academic_events(actor_id,entity_type,entity_id,class_id,changes) VALUES($1,$2,$3,$4,$5::jsonb)',[user.id,kind,id,classId,JSON.stringify(validated.data)]);
    if('published' in raw&&raw.published){if(kind==='grade'&&'studentId'in raw)await notify(client,raw.studentId,'Une note est disponible','Consultez vos résultats dans votre espace étudiant.','/espace-etudiant/notes');else if(kind==='resource'&&classId)await notifyClass(client,classId,'Un cours est disponible','Un support de cours a été publié ou mis à jour.','/espace-etudiant/matieres');}
    if(kind==='timetable'&&classId)await notifyClass(client,classId,'Emploi du temps mis à jour','Vérifiez les horaires et les liens de vos séances.','/espace-etudiant/emploi-du-temps');
    await client.query('COMMIT');
  } catch(error) {
    await client.query('ROLLBACK');
    if(error instanceof AcademicError)return {ok:false,message:error.message};
    if((error as {code?:string}).code==='23505')return {ok:false,message:'Ce code existe déjà. Choisissez un code distinct.'};
    console.error('Academic mutation failed',{kind,code:(error as {code?:string}).code});
    return {ok:false,message:'L’enregistrement a échoué. Réessayez dans un instant.'};
  } finally {client.release();}
  revalidatePath('/administration/pedagogie','layout');
  revalidatePath('/espace-etudiant','layout');
  revalidatePath('/enseignant','layout');
  after(()=>deliverOutbox().then(()=>{}));
  return {ok:true,id,message:kind==='membership'?'L’affectation à la classe a été enregistrée.':'L’enregistrement a été effectué.'};
}
