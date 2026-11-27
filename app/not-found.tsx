import Link from 'next/link';
export default function NotFound() {return <main className="error-page"><p className="eyebrow dark">PAGE INTROUVABLE</p><h1>Ce chemin ne mène pas au campus.</h1><p>La page demandée n’existe pas ou n’est pas accessible.</p><Link className="button" href="/">Retour à l’accueil</Link></main>;}
