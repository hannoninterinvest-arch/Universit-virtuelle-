import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check } from 'lucide-react';
import { Brand } from '@/components/ui';
import { AuthForm } from '@/components/auth-form';
const modes:Record<string,{eyebrow:string,title:string,text:string}>={
  'sign-up':{eyebrow:'BIENVENUE CHEZ HANNON',title:'Créez votre compte étudiant.',text:'Votre première étape vers un nouveau parcours. La création du compte ne vaut pas admission.'},
  'sign-in':{eyebrow:'HEUREUX DE VOUS RETROUVER',title:'Connectez-vous à votre espace.',text:'Retrouvez votre dossier et suivez votre demande d’inscription.'},
  'forgot-password':{eyebrow:'RÉCUPÉRATION DU COMPTE',title:'Un mot de passe oublié ?',text:'Indiquez l’adresse de votre compte pour recevoir un code de récupération.'},
  'reset-password':{eyebrow:'UN NOUVEAU DÉPART',title:'Choisissez un nouveau mot de passe.',text:'Saisissez votre adresse, le code reçu par e-mail et votre nouveau mot de passe.'},
  'verify-email':{eyebrow:'VÉRIFICATION DU COMPTE',title:'Confirmez votre adresse e-mail.',text:'Recevez un code à six chiffres pour confirmer que cette adresse vous appartient.'},
};
export default async function AuthPage({params}:{params:Promise<{mode:string}>}) { const {mode}=await params; const content=modes[mode]; if(!content)notFound(); return <main className="auth-layout"><aside className="auth-aside"><Brand/><div><p className="eyebrow">VOTRE CAMPUS, PARTOUT</p><h2>Un compte.<br/>De nouvelles<br/><em>possibilités.</em></h2><p>Votre espace personnel pour construire la suite de votre parcours.</p><ul>{['Un dossier enregistré à chaque étape','Un suivi clair de votre demande','Un lien direct avec l’administration'].map(t=><li key={t}><Check size={17}/>{t}</li>)}</ul></div><small>HANNON International Investments</small></aside><section className="auth-main"><Link href="/" className="back-link"><ArrowLeft size={16}/> Retour à l’accueil</Link><div className="auth-box"><p className="eyebrow dark">{content.eyebrow}</p><h1>{content.title}</h1><p className="muted">{content.text}</p><AuthForm mode={mode}/></div><p className="auth-bottom">Une question ? <a href="mailto:contact@hannoninterinvest.com">Contactez les admissions</a></p></section></main>; }
