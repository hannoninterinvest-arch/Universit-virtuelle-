import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: { default:'Université virtuelle HANNON | Admissions', template:'%s | HANNON' }, description:'Créez votre compte étudiant, préparez votre dossier et suivez votre demande d’inscription à l’université virtuelle HANNON.', robots:{index:false,follow:false} };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="fr"><body>{children}</body></html>; }
