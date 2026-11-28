
import Link from 'next/link';
import {requireUser} from '@/lib/access';
import {db} from '@/lib/db';
import type {Application} from '@/lib/admissions';
import {ApplicationForm} from '@/components/application-form';
import {ProgramApplicationForm} from '@/components/program-application-form';
import {Badge} from '@/components/ui';
import {formSchema} from '@/lib/program-forms';
export default async function ApplicationPage({searchParams}:{searchParams:Promise<{formation?:string;legacy?:string}>}){
 const user=await requireUser(),params=await searchParams;
 const rows=(await db.query<Application>('SELECT * FROM university.applications WHERE user_id=$1 ORDER BY updated_at DESC',[user.id])).rows;
 const legacy=rows.find(a=>!a.program_id);
 if(params.legacy==='1'&&legacy)return <ApplicationForm application={JSON.parse(JSON.stringify(legacy))} email={user.email}/>;
 const id=params.formation;
 if(typeof id==='string'&&/^[a-f0-9-]{36}$/i.test(id)){
 const a=rows.find(x=>x.program_id===id),p=(await db.query('SELECT p.*,f.published_fields,f.published_version FROM university.programs p LEFT JOIN university.program_admission_forms f ON f.program_id=p.id WHERE p.id=$1',[id])).rows[0],parsed=formSchema.safeParse(a?.form_snapshot??p?.published_fields);
 if(p&&parsed.success&&parsed.data.length&&(a||p.published&&p.enrollment_open)){
 const documents=(await db.query("SELECT id,filename,review_status,review_note FROM university.documents WHERE owner_id=$1 AND purpose='admission' ORDER BY created_at DESC",[user.id])).rows;
 return <ProgramApplicationForm key={id} programId={id} title={p.title} fields={parsed.data} formVersion={a?.form_version??p.published_version} initial={a?.form_answers??{}} version={a?.version??0} status={a?.status??'draft'} note={a?.admin_note??''} documents={documents} name={user.name} email={user.email}/>;}
 return <section className="panel"><h1>Inscription indisponible</h1><p>Formation fermée ou formulaire non publié.</p><Link href="/espace-etudiant/inscription" className="button">Mes candidatures</Link></section>;}
 const programs=(await db.query("SELECT p.id,p.title,p.level,p.duration FROM university.programs p JOIN university.program_admission_forms f ON f.program_id=p.id WHERE p.published AND p.enrollment_open AND f.published_fields IS NOT NULL ORDER BY p.title")).rows;
 const available=programs.filter(p=>!rows.some(a=>a.program_id===p.id));
 return <><div className="page-intro"><h1>Mes candidatures</h1><p>Un compte unique, plusieurs formations et un dossier distinct pour chacune.</p></div><section className="panel"><h2>Mes dossiers</h2>{!rows.length&&<p className="muted">Aucune candidature.</p>}{rows.map(a=><article className="admin-resource-row" key={a.id}><div className="panel-heading"><h3>{a.data.program||'Dossier général'}</h3><Badge status={a.status}/></div><Link className="button secondary small" href={a.program_id?'/espace-etudiant/inscription?formation='+a.program_id:'/espace-etudiant/inscription?legacy=1'}>Consulter le dossier</Link></article>)}</section><section className="panel section-gap"><h2>Candidater à une autre formation</h2>{available.map(p=><article className="admin-resource-row" key={p.id}><h3>{p.title}</h3><p>{p.level} · {p.duration}</p><Link className="button small" href={'/espace-etudiant/inscription?formation='+p.id}>Commencer la candidature</Link></article>)}{!available.length&&<p className="muted">Aucune autre formation ouverte avec un formulaire publié.</p>}<Link href="/formations">Voir le catalogue</Link></section></>;
}
