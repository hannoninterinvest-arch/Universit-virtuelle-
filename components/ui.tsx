import Link from 'next/link';
import { GraduationCap, ArrowUpRight, ShieldCheck, CircleHelp } from 'lucide-react';
import { statuses, type Status } from '@/lib/admissions';
export function Brand() { return <Link href="/" className="brand" aria-label="HANNON — Accueil"><span className="brand-icon"><GraduationCap size={27}/></span><span><strong>HANNON<span className="gold">.</span></strong><small>UNIVERSITÉ VIRTUELLE</small></span></Link>; }
export function PublicHeader() { return <header className="public-header"><Brand/><nav aria-label="Navigation principale"><a href="/#parcours" className="hide-mobile">Votre parcours</a><Link href="/auth/sign-in">Se connecter</Link><Link href="/auth/sign-up" className="button small">Créer un compte <ArrowUpRight size={16}/></Link></nav></header>; }
export function Badge({ status }: { status: Status }) { const s = statuses[status]; return <span className={`badge ${s.tone}`}><i/>{s.label}</span>; }
export function Footer() { return <footer><Brand/><p>Un parcours accessible. Un avenir à construire.</p><a href="mailto:contact@hannoninterinvest.com"><CircleHelp size={16}/> Besoin d’aide ?</a><span>© {new Date().getFullYear()} HANNON International Investments</span></footer>; }
export function SecureNote() { return <p className="secure-note"><ShieldCheck size={15}/> Vos informations sont réservées au traitement de votre demande.</p>; }
