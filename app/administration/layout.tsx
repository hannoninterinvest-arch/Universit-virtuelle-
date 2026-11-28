import { requireUser,isStaff } from '@/lib/access';
import { PortalShell } from '@/components/portal-shell';
import Link from 'next/link';
import { db } from '@/lib/db';
export const dynamic='force-dynamic';
export default async function AdminLayout({children}:{children:React.ReactNode}) {const user=await requireUser();const staff=await isStaff(user.id),count=(await db.query('SELECT count(*) AS n FROM university.notifications WHERE user_id=$1 AND read_at IS NULL',[user.id])).rows[0].n;return <PortalShell name={user.name} email={user.email} staff={staff} teacher={staff} unread={Number(count)} admin>{staff?children:<section className="panel"><p className="eyebrow dark">ACCÈS RÉSERVÉ</p><h1>Espace administratif</h1><p>Votre compte ne dispose pas des droits nécessaires pour consulter les dossiers des étudiants.</p><Link className="button" href="/espace-etudiant">Retour à mon espace étudiant</Link></section>}</PortalShell>;}
