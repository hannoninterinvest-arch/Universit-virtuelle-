import { requireUser,isStaff } from '@/lib/access';
import { isTeacher } from '@/lib/campus-access';
import { db } from '@/lib/db';
import { PortalShell } from '@/components/portal-shell';
export const dynamic='force-dynamic';
export default async function TeacherLayout({children}:{children:React.ReactNode}){const user=await requireUser();const[staff,teacher,count]=await Promise.all([isStaff(user.id),isTeacher(user.id),db.query('SELECT count(*) AS n FROM university.notifications WHERE user_id=$1 AND read_at IS NULL',[user.id])]);return <PortalShell name={user.name} email={user.email} staff={staff} teacher={teacher||staff} unread={Number(count.rows[0].n)}>{staff||teacher?children:<section className="panel"><h1>Espace enseignant</h1><p>Votre compte doit être affecté à une matière et votre adresse e-mail vérifiée pour accéder à cet espace.</p><a className="button" href="/auth/verify-email">Vérifier mon adresse e-mail</a></section>}</PortalShell>;}
