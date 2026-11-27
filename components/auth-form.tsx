'use client';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { ArrowRight, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { SecureNote } from './ui';
export function AuthForm({ mode }: { mode:string }) {
  const [busy,setBusy]=useState(false); const [message,setMessage]=useState(''); const [success,setSuccess]=useState(false); const [show,setShow]=useState(false); const [sent,setSent]=useState(false);
  const signup=mode==='sign-up', forgot=mode==='forgot-password', reset=mode==='reset-password', verify=mode==='verify-email';
  async function handleSubmit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(''); setSuccess(false);
    const fd=new FormData(event.currentTarget), email=String(fd.get('email')??'').trim().toLowerCase(), password=String(fd.get('password')??''), otp=String(fd.get('otp')??'');
    try {
      if ((signup||reset) && password!==fd.get('confirmPassword')) { setMessage('Les mots de passe ne correspondent pas.'); return; }
      if (signup) {
        const {error}=await authClient.signUp.email({email,password,name:String(fd.get('name')).trim()});
        if(error) { setMessage(error.code==='USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL' ? 'Un compte existe déjà avec cette adresse. Connectez-vous.' : error.message || 'La création du compte a échoué.'); return; }
        window.location.assign('/espace-etudiant');
      } else if(forgot) {
        const {error}=await authClient.emailOtp.requestPasswordReset({email});
        if(error) { setMessage('L’envoi du code est momentanément indisponible. Réessayez.'); return; }
        setSuccess(true); setMessage('Si cette adresse correspond à un compte, un code de récupération a été envoyé.'); setSent(true);
      } else if(reset) {
        const {error}=await authClient.emailOtp.resetPassword({email,otp,password});
        if(error) { setMessage('Code invalide ou expiré. Demandez un nouveau code.'); return; }
        setSuccess(true);setMessage('Votre mot de passe a été modifié. Vous pouvez vous connecter.');
      } else if(verify) {
        const result=sent ? await authClient.emailOtp.verifyEmail({email,otp}) : await authClient.emailOtp.sendVerificationOtp({email,type:'email-verification'});
        if(result.error) { setMessage('Vérification impossible. Vérifiez le code et l’adresse, puis réessayez.'); return; }
        setSuccess(true);setMessage(sent?'Votre adresse e-mail est vérifiée.':'Un code de vérification a été envoyé à votre adresse.'); if(!sent)setSent(true);
      } else {
        const {error}=await authClient.signIn.email({email,password});
        if(error) { setMessage(error.status===401 || error.code==='INVALID_EMAIL_OR_PASSWORD' ? 'Adresse e-mail ou mot de passe incorrect.' : error.message || 'Connexion impossible. Réessayez.'); return; }
        window.location.assign('/espace-etudiant');
      }
    } catch { setMessage('La connexion a été interrompue. Réessayez dans un instant.'); } finally { setBusy(false); }
  }
  const label=signup?'Créer mon compte':forgot?'Recevoir un code':reset?'Modifier mon mot de passe':verify?(sent?'Vérifier mon adresse':'Recevoir un code'):'Me connecter';
  return <form onSubmit={handleSubmit} className="auth-form">
    {signup&&<label>Nom complet<input name="name" autoComplete="name" minLength={3} maxLength={150} placeholder="Votre prénom et votre nom" required/></label>}
    <label>Adresse e-mail<input type="email" name="email" autoComplete="email" maxLength={254} placeholder="vous@exemple.com" required/></label>
    {(reset||(verify&&sent))&&<label>Code reçu par e-mail<input name="otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} placeholder="000000" required/></label>}
    {!forgot&&!verify&&<><label><span className="label-row">Mot de passe{!signup&&!reset&&<Link href="/auth/forgot-password">Mot de passe oublié ?</Link>}</span><span className="password-field"><input name="password" type={show?'text':'password'} autoComplete={signup||reset?'new-password':'current-password'} minLength={signup||reset?8:1} maxLength={128} placeholder={signup?'Au moins 8 caractères':'Votre mot de passe'} required/><button type="button" onClick={()=>setShow(!show)} aria-label={show?'Masquer le mot de passe':'Afficher le mot de passe'}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></span></label>{(signup||reset)&&<label>Confirmer le mot de passe<input name="confirmPassword" type={show?'text':'password'} autoComplete="new-password" minLength={8} maxLength={128} placeholder="Saisissez à nouveau votre mot de passe" required/></label>}</>}
    {signup&&<label className="checkbox"><input name="consent" type="checkbox" required/><span>J’accepte que mes informations soient utilisées pour créer mon compte et traiter ma demande d’inscription.</span></label>}
    {message&&<div className={`notice ${success?'notice-success':'notice-error'}`} role={success?'status':'alert'}>{message}</div>}
    <button className="button wide" disabled={busy}>{busy?<LoaderCircle className="spin" size={18}/>:null}{busy?'Veuillez patienter…':label}{!busy&&<ArrowRight size={17}/>}</button>
    {forgot&&sent&&<Link className="button secondary wide" href="/auth/reset-password">J’ai reçu mon code</Link>}
    {verify&&sent&&<button className="text-link resend" type="button" disabled={busy} onClick={()=>{setSent(false);setMessage('');}}>Renvoyer un code</button>}
    <p className="auth-switch">{signup?<>Vous avez déjà un compte ? <Link href="/auth/sign-in">Se connecter</Link></>:forgot||reset||verify?<Link href="/auth/sign-in">Retour à la connexion</Link>:<>Vous n’avez pas de compte ? <Link href="/auth/sign-up">Créer mon compte</Link></>}</p><SecureNote/>
  </form>;
}
