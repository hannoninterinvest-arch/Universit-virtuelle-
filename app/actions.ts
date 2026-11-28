'use server';
import { revalidatePath } from 'next/cache';
import { requireUser, requireStaff } from '@/lib/access';
import { db } from '@/lib/db';
import { draftSchema, submissionSchema } from '@/lib/admissions';
import { z } from 'zod';
import { after } from 'next/server';
import { deliverOutbox } from '@/lib/mail';
export type ActionResult = { ok: boolean; message: string; errors?: Record<string,string[]>; version?: number; };
export async function saveApplication(input: unknown, submit: boolean, version: number, consent: boolean): Promise<ActionResult> {
  const user = await requireUser();
  if (typeof submit !== 'boolean' || typeof consent !== 'boolean' || !Number.isInteger(version) || version < 0) return { ok:false, message:'Demande invalide.' };
  const result = (submit ? submissionSchema : draftSchema).safeParse(input);
  if (!result.success) return { ok:false, message:'Vérifiez les champs indiqués.', errors:z.flattenError(result.error).fieldErrors };
  if (submit && !consent) return { ok:false, message:'Veuillez confirmer l’exactitude des informations.' };
  // No client-supplied user identifier, status, email or role is trusted.
  const { rows } = await db.query(`WITH saved AS (
    INSERT INTO university.applications(user_id,data,status,submitted_at)
    SELECT $1,$2::jsonb,$3,CASE WHEN $3='submitted' THEN now() END WHERE $4=0
    ON CONFLICT (user_id) WHERE program_id IS NULL DO UPDATE SET data=excluded.data,status=CASE WHEN $3='submitted' THEN 'submitted' ELSE university.applications.status END,
      submitted_at=CASE WHEN $3='submitted' THEN now() ELSE university.applications.submitted_at END,
      version=university.applications.version+1,updated_at=now()
    WHERE university.applications.status IN ('draft','needs_changes') AND university.applications.version=$4
    RETURNING id,version
  ), updated AS (
    UPDATE university.applications SET data=$2::jsonb,status=CASE WHEN $3='submitted' THEN 'submitted' ELSE status END,
      submitted_at=CASE WHEN $3='submitted' THEN now() ELSE submitted_at END,version=version+1,updated_at=now()
    WHERE user_id=$1 AND program_id IS NULL AND version=$4 AND $4>0 AND status IN ('draft','needs_changes') RETURNING id,version
  ), changed AS (SELECT * FROM saved UNION ALL SELECT * FROM updated), logged AS (
    INSERT INTO university.application_events(application_id,actor_id,event)
    SELECT id,$1,$3 FROM changed WHERE $3='submitted' RETURNING id
  ), notified AS (
    INSERT INTO university.notifications(user_id,title,body,href)
    SELECT user_id,'Nouvelle candidature','Un dossier vient d’être transmis aux admissions.','/administration' FROM university.staff_members WHERE $3='submitted' AND EXISTS(SELECT 1 FROM changed) RETURNING id
  ), queued AS (INSERT INTO university.email_outbox(notification_id) SELECT id FROM notified RETURNING id)
  SELECT id,version FROM changed`, [user.id, JSON.stringify(result.data), submit ? 'submitted' : 'draft', version]);
  if (!rows.length) return { ok:false, message:'Le dossier a changé ou a déjà été transmis. Rechargez la page avant de continuer.' };
  revalidatePath('/espace-etudiant'); revalidatePath('/administration');
  if(submit)after(()=>deliverOutbox().then(()=>{}));
  return { ok:true, message:submit ? 'Votre dossier a été transmis au service des admissions.' : 'Votre brouillon a été enregistré.', version:rows[0].version };
}
const reviewSchema = z.object({ id:z.uuid(), version:z.number().int().positive(), status:z.enum(['accepted','rejected','needs_changes']), note:z.string().trim().max(3000) });
export async function reviewApplication(input: unknown): Promise<ActionResult> {
  const user = await requireStaff();
  if (!user) return { ok:false, message:'Accès réservé à l’administration.' };
  const result = reviewSchema.safeParse(input);
  if (!result.success) return { ok:false, message:'Décision invalide.' };
  const { id,version,status,note } = result.data;
  if (status !== 'accepted' && note.length < 5) return { ok:false, message:'Expliquez les compléments demandés ou le motif du refus.' };
  const { rows } = await db.query(`WITH changed AS (
    UPDATE university.applications SET status=$1,admin_note=$2,reviewed_by=$3,version=version+1,updated_at=now()
    WHERE id=$4 AND version=$5 AND status='submitted' RETURNING id,user_id
  ), logged AS (INSERT INTO university.application_events(application_id,actor_id,event,note)
    SELECT id,$3,$1,$2 FROM changed RETURNING application_id), notified AS (
    INSERT INTO university.notifications(user_id,title,body,href) SELECT user_id,'Mise à jour de votre candidature','Consultez la décision et le message du service des admissions.','/espace-etudiant/inscription' FROM changed RETURNING id
  ), queued AS (INSERT INTO university.email_outbox(notification_id) SELECT id FROM notified RETURNING id)
  SELECT id FROM changed`, [status,note,user.id,id,version]);
  if (!rows.length) return { ok:false, message:'Ce dossier a déjà été traité ou modifié. Rechargez la page.' };
  revalidatePath('/administration'); revalidatePath(`/administration/${id}`); revalidatePath('/espace-etudiant');
  after(()=>deliverOutbox().then(()=>{}));
  return { ok:true, message:'La décision a été enregistrée et est visible dans l’espace étudiant.' };
}
