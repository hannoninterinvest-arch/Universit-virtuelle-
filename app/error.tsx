'use client';
export default function ErrorPage({reset}:{reset:()=>void}) {return <main className="error-page"><p className="eyebrow dark">UN INSTANT…</p><h1>Cette page est momentanément indisponible.</h1><p>Vos informations enregistrées sont conservées. Réessayez dans un instant.</p><button className="button" onClick={()=>reset()}>Réessayer</button></main>;}
