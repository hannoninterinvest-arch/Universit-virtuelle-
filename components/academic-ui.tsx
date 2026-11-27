import Link from 'next/link';
import { BookOpen,CalendarDays,GraduationCap,ArrowRight } from 'lucide-react';
import type { AcademicClass } from '@/lib/academics';
export function AcademicEmpty({title='Votre classe sera bientôt disponible.',text='L’administration doit vous affecter à une classe. Ses matières, ses cours et son emploi du temps apparaîtront ensuite ici.'}:{title?:string;text?:string}) {return <section className="panel empty-state"><GraduationCap size={38}/><h2>{title}</h2><p>{text}</p></section>;}
export function ClassPills({classes}:{classes:AcademicClass[]}) {return <div className="class-pills">{classes.map(c=><span key={c.id}><GraduationCap size={14}/>{c.name}<small>{c.academic_year}</small></span>)}</div>;}
export function AcademicQuickLinks() {return <div className="academic-quick-links">{[{href:'/espace-etudiant/matieres',label:'Mes matières & cours',icon:BookOpen},{href:'/espace-etudiant/emploi-du-temps',label:'Mon emploi du temps',icon:CalendarDays},{href:'/espace-etudiant/notes',label:'Mes notes',icon:GraduationCap}].map(i=><Link key={i.href} href={i.href}><i.icon size={20}/><span>{i.label}</span><ArrowRight size={16}/></Link>)}</div>;}
