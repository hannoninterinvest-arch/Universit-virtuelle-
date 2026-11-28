import Link from 'next/link';
import { Bell } from 'lucide-react';
import { requireUser } from '@/lib/access';
import { db } from '@/lib/db';
import { dateTime } from '@/lib/campus';
import { CampusForm } from '@/components/campus-form';
export default async function NotificationsPage(){const user=await requireUser();const rows=(await db.query('SELECT * FROM university.notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100',[user.id])).rows;return <><div className="page-intro"><p className="eyebrow dark">RESTER INFORMÉ</p><h1>Mes notifications</h1><p>Les actualités de vos cours, de votre scolarité et de vos demandes.</p></div><section className="panel"><div className="panel-heading"><h2>Dernières notifications</h2>{rows.some(n=>!n.read_at)&&<CampusForm op="read" fixed={{id:'all'}} label="Tout marquer comme lu"/>}</div>{!rows.length?<div className="empty-state"><Bell size={35}/><h2>Vous êtes à jour.</h2><p>Vos prochaines notifications apparaîtront ici.</p></div>:rows.map(n=><article className={`notification-row ${n.read_at?'':'unread'}`} key={n.id}><div><time>{dateTime(n.created_at)}</time><h3>{n.title}</h3><p>{n.body}</p><Link href={n.href} className="text-link navy-link">Consulter</Link></div>{!n.read_at&&<CampusForm op="read" fixed={{id:n.id}} label="Marquer comme lu"/>}</article>)}</section></>;}
