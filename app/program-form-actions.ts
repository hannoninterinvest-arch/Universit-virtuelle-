
'use server';
import {z} from 'zod';
import {revalidatePath} from 'next/cache';
import {after} from 'next/server';
import {requireStaff,requireUser} from '@/lib/access';
import {db} from '@/lib/db';
import {formSchema,validateAnswers} from '@/lib/program-forms';
import {emptyFields} from '@/lib/admissions';
import {deliverOutbox} from '@/lib/mail';
type Result={ok:boolean;message:string;version?:number;publishedVersion?:number;errors?:Record<string,string>};
export async function saveProgramForm(input:unknown):Promise<Result>{
 if(!await requireStaff())return {ok:false,message:'Accès réservé à l’administration.'};
 const r=z.object({programId:z.uuid(),version:z.number().int().nonnegative(),publish:z.boolean(),fields:formSchema}).safeParse(input);
 if(!r.success)return {ok:false,message:'Vérifiez les intitulés et les choix (40 champs maximum).'};
 const {programId,version,publish,fields}=r.data;if(publish&&!fields.length)return {ok:false,message:'Ajoutez au moins un champ.'};
 const args=[programId,JSON.stringify(fields),publish,version];
 const q=version===0?await db.query("INSERT INTO university.program_admission_forms(program_id,draft,published_fields,published_version) SELECT id,$2::jsonb,CASE WHEN $3 THEN $2::jsonb END,CASE WHEN $3 THEN 1 END FROM university.programs WHERE id=$1 AND $4=0 ON CONFLICT(program_id) DO NOTHING RETURNING version,published_version",args):await db.query("UPDATE university.program_admission_forms SET draft=$2::jsonb,published_fields=CASE WHEN $3 THEN $2::jsonb ELSE published_fields END,published_version=CASE WHEN $3 THEN version+1 ELSE published_version END,version=version+1,updated_at=now() WHERE program_id=$1 AND version=$4 RETURNING version,published_version",args);
 const v=q.rows[0];if(!v)return {ok:false,message:'Le formulaire a changé. Rechargez la page.'};
 revalidatePath('/administration/campus');revalidatePath('/formations');revalidatePath('/espace-etudiant/inscription');
 return {ok:true,message:publish?'Formulaire publié.':'Brouillon enregistré.',version:v.version,publishedVersion:v.published_version??undefined};
}
export async function saveProgramApplication(input:unknown):Promise<Result>{
 const user=await requireUser();
 const r=z.object({programId:z.uuid(),version:z.number().int().nonnegative(),formVersion:z.number().int().positive(),submit:z.boolean(),consent:z.boolean(),answers:z.unknown()}).safeParse(input);
 if(!r.success)return {ok:false,message:'Demande invalide.'};
 const {programId,version,formVersion,submit,consent}=r.data;if(submit&&!consent)return {ok:false,message:'Confirmez vos réponses.'};
 const c=await db.connect();let newVersion=0;
 try{await c.query('BEGIN');
 const p=(await c.query('SELECT p.id,p.title,p.published,p.enrollment_open,f.published_fields,f.published_version FROM university.programs p LEFT JOIN university.program_admission_forms f ON f.program_id=p.id WHERE p.id=$1 FOR UPDATE OF p',[programId])).rows[0];
 const a=(await c.query('SELECT * FROM university.applications WHERE user_id=$1 AND program_id=$2 FOR UPDATE',[user.id,programId])).rows[0];
 if(!p||((!p.published||!p.enrollment_open)&&a?.status!=='needs_changes')){await c.query('ROLLBACK');return {ok:false,message:'Formation fermée ou introuvable.'};}
 if(a&&(!['draft','needs_changes'].includes(a.status)||a.version!==version)||!a&&version!==0){await c.query('ROLLBACK');return {ok:false,message:'Dossier modifié. Rechargez la page.'};}
 const fv=a?.form_version??p.published_version,schema=formSchema.safeParse(a?.form_snapshot??p.published_fields);
 if(!schema.success||!schema.data.length||fv!==formVersion){await c.query('ROLLBACK');return {ok:false,message:'Formulaire non publié ou modifié. Rechargez.'};}
 const {answers,errors}=validateAnswers(schema.data,r.data.answers,submit);
 for(const f of schema.data.filter(x=>x.type==='document')){const v=answers[f.id];if(typeof v!=='string')continue;const d=(await c.query("SELECT review_status FROM university.documents WHERE id=$1 AND owner_id=$2 AND purpose='admission'",[v,user.id])).rows[0];if(!d||d.review_status==='rejected')errors[f.id]='Choisissez un document personnel valide, non refusé.';}
 if(Object.keys(errors).length){await c.query('ROLLBACK');return {ok:false,message:'Vérifiez les champs signalés.',errors};}
 const names=(user.name||'').trim().split(/\s+/),common={...emptyFields,firstName:names[0]||'',lastName:names.slice(1).join(' '),program:p.title};
 const saved=a?(await c.query("UPDATE university.applications SET form_answers=$2::jsonb,status=CASE WHEN $3 THEN 'submitted' ELSE status END,submitted_at=CASE WHEN $3 THEN now() ELSE submitted_at END,updated_at=now(),version=version+1 WHERE id=$1 RETURNING id,version",[a.id,JSON.stringify(answers),submit])).rows[0]:(await c.query("INSERT INTO university.applications(user_id,program_id,data,form_version,form_snapshot,form_answers,status,submitted_at) VALUES($1,$2,$3::jsonb,$4,$5::jsonb,$6::jsonb,$7,CASE WHEN $7='submitted' THEN now() END) RETURNING id,version",[user.id,programId,JSON.stringify(common),fv,JSON.stringify(schema.data),JSON.stringify(answers),submit?'submitted':'draft'])).rows[0];
 newVersion=saved.version;
 if(submit){await c.query("INSERT INTO university.application_events(application_id,actor_id,event) VALUES($1,$2,'submitted')",[saved.id,user.id]);await c.query("WITH n AS (INSERT INTO university.notifications(user_id,title,body,href) SELECT user_id,'Nouvelle candidature',$1,$2 FROM university.staff_members RETURNING id) INSERT INTO university.email_outbox(notification_id) SELECT id FROM n",['Candidature : '+p.title,'/administration/'+saved.id]);}
 await c.query('COMMIT');
 }catch{await c.query('ROLLBACK');return {ok:false,message:'Enregistrement impossible. Réessayez.'};}finally{c.release();}
 revalidatePath('/espace-etudiant/inscription');revalidatePath('/administration');if(submit)after(()=>deliverOutbox().then(()=>{}));
 return {ok:true,message:submit?'Candidature transmise.':'Brouillon enregistré.',version:newVersion};
}
