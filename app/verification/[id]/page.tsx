import { notFound } from 'next/navigation';
import { BadgeCheck } from 'lucide-react';
import { PublicHeader,Footer } from '@/components/ui';
import { db } from '@/lib/db';
import { certificateLabels } from '@/lib/campus';
export const dynamic='force-dynamic';
export default async function VerificationPage({params}:{params:Promise<{id:string}>}){const{id}=await params;if(!/^[a-f0-9-]{36}$/i.test(id))notFound();const c=(await db.query('SELECT kind,issued_at FROM university.certificate_requests WHERE id=$1 AND status=\'approved\'',[id])).rows[0];if(!c)notFound();return <><PublicHeader/><main className="public-content"><section className="panel verification-card"><BadgeCheck size={52}/><p className="eyebrow dark">VÉRIFICATION D’UN DOCUMENT</p><h1>Référence reconnue.</h1><h2>{certificateLabels[c.kind as keyof typeof certificateLabels]}</h2><p>Délivré le {new Intl.DateTimeFormat('fr-TN',{dateStyle:'long'}).format(new Date(c.issued_at))} par l’administration HANNON.</p><code>{id.toUpperCase()}</code><p className="muted">La référence est authentique. Comparez-la au document présenté ; les données personnelles et les notes ne sont pas publiées sur cette page.</p></section></main><Footer/></>;}
