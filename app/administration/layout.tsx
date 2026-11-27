import { requireUser,isStaff } from '@/lib/access';
import { PortalShell } from '@/components/portal-shell';
import Link from 'next/link';
export const dynamic='force-dynamic';
export default async function AdminLayout({children}:{children:React.ReactNode}) {const user=await requireUser();const staff=await isStaff(user.id);return <PortalShell name={user.name} email={user.email} staff={staff} admin>{staff?children:<section className="panel"><p className="eyebrow dark">ACCÈS RÉSERVÉ</p><h1>Espace administratif</h1><p>Votre compte ne dispose pas des droits nécessaires pour consulter les dossiers des étudiants.</p><Link className="button" href="/espace-etudiant">Retour à mon espace étudiant</Link></section>}</PortalShell>;}
