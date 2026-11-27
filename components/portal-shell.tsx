'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, FileText, LogOut, ArrowUpRight, ShieldCheck, Mail } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { Brand } from './ui';
export function PortalShell({children,name,email,staff=false,admin=false}:{children:React.ReactNode;name:string;email:string;staff?:boolean;admin?:boolean}) {
  const path=usePathname();const [error,setError]=useState('');const [busy,setBusy]=useState(false);
  async function signout() {setBusy(true);try{const result=await authClient.signOut();if(result.error)throw new Error();window.location.assign('/auth/sign-in');}catch{setError('Déconnexion impossible. Réessayez.');setBusy(false);}}
  return <div className="portal-layout"><aside className="sidebar"><Brand/><p className="nav-caption">{admin?'ADMINISTRATION':'MON ESPACE'}</p><nav aria-label="Navigation de l’espace"><Link className={!admin&&path==='/espace-etudiant'?'active':''} href="/espace-etudiant"><LayoutDashboard size={18}/> Tableau de bord</Link><Link className={path.endsWith('/inscription')?'active':''} href="/espace-etudiant/inscription"><FileText size={18}/> Mon inscription</Link>{staff&&<Link className={admin?'active':''} href="/administration"><ShieldCheck size={18}/> Admissions</Link>}<Link href="/auth/verify-email"><Mail size={18}/> Vérifier mon e-mail</Link></nav><div className="sidebar-help"><span className="eyebrow dark">NOUS SOMMES LÀ</span><h3>Besoin d’un coup de main ?</h3><a href="mailto:contact@hannoninterinvest.com">Contacter les admissions <ArrowUpRight size={15}/></a></div><button className="logout" onClick={signout} disabled={busy}><LogOut size={17}/>{busy?'Déconnexion…':'Se déconnecter'}</button>{error&&<p role="alert">{error}</p>}</aside><div className="portal-main"><header className="portal-header"><span>{admin?'Gestion des admissions':'Espace étudiant'}<small>UNIVERSITÉ VIRTUELLE HANNON</small></span><div className="user-info"><div><strong>{name}</strong><small>{email}</small></div><span className="avatar">{name.charAt(0).toUpperCase()}</span></div></header><main className="portal-content">{children}</main><div className="portal-footer">HANNON Université virtuelle <span>Votre avenir, à votre rythme.</span></div></div></div>;
}
