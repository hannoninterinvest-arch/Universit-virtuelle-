import { z } from 'zod';
export const statuses = {
  draft: { label: 'Brouillon', tone: 'neutral', detail: 'Complétez votre dossier, puis transmettez-le au service des admissions.' },
  submitted: { label: 'En cours d’examen', tone: 'blue', detail: 'Votre dossier a été transmis. L’administration va examiner votre demande.' },
  needs_changes: { label: 'À compléter', tone: 'amber', detail: 'Des compléments sont demandés. Modifiez votre dossier puis transmettez-le à nouveau.' },
  accepted: { label: 'Admission acceptée', tone: 'green', detail: 'Votre demande a été acceptée par le service des admissions.' },
  rejected: { label: 'Admission refusée', tone: 'red', detail: 'Votre demande n’a pas été retenue. Consultez le message de l’administration.' },
} as const;
export type Status = keyof typeof statuses;
export const fieldNames = ['firstName','lastName','birthDate','nationality','phone','country','city','address','degree','institution','graduationYear','program','motivation'] as const;
export type Fields = Record<typeof fieldNames[number], string>;
export const emptyFields: Fields = Object.fromEntries(fieldNames.map(k => [k, ''])) as Fields;
const short = z.string().trim().max(150, '150 caractères maximum.');
export const draftSchema = z.object({
  firstName: short, lastName: short, birthDate: z.string().max(10), nationality: short,
  phone: z.string().trim().max(30), country: short, city: short,
  address: z.string().trim().max(500), degree: short, institution: short,
  graduationYear: z.string().max(4), program: z.string().trim().max(250), motivation: z.string().trim().max(3000),
}).strict();
export const submissionSchema = draftSchema.extend({
  firstName: short.min(2, 'Indiquez votre prénom.'), lastName: short.min(2, 'Indiquez votre nom.'),
  birthDate: z.iso.date('Indiquez une date de naissance valide.').refine(v => v < new Date().toISOString().slice(0,10), 'La date doit être dans le passé.'),
  nationality: short.min(2, 'Indiquez votre nationalité.'),
  phone: z.string().trim().regex(/^\+?[\d\s().-]{7,25}$/, 'Indiquez un numéro de téléphone valide.'),
  country: short.min(2, 'Indiquez votre pays.'), city: short.min(2, 'Indiquez votre ville.'),
  degree: short.min(2, 'Indiquez votre dernier diplôme.'), institution: short.min(2, 'Indiquez votre établissement.'),
  graduationYear: z.string().regex(/^\d{4}$/, 'Indiquez une année valide.').refine(v => +v >= 1900 && +v <= new Date().getFullYear()+1, 'Année hors limites.'),
  program: z.string().trim().min(3, 'Indiquez la formation souhaitée.').max(250),
});
export function mayEdit(status: Status) { return status === 'draft' || status === 'needs_changes'; }
export function mayReview(status: Status) { return status === 'submitted'; }
export function reference(id: string) { return `UV-${id.slice(0,8).toUpperCase()}`; }
export function formatDate(date: string | Date | null) { return date ? new Intl.DateTimeFormat('fr-TN', { dateStyle: 'medium', timeZone: 'Africa/Tunis' }).format(new Date(date)) : '—'; }
export type Application = { id: string; user_id: string; data: Fields; status: Status; version: number; admin_note: string; created_at: string; updated_at: string; submitted_at: string | null; email?: string; name?: string; program_id?: string|null; form_version?: number|null; form_snapshot?: import('./program-forms').Field[]|null; form_answers?: import('./program-forms').Answers; };
export type AdmissionEvent = { id: string; event: Status; note: string; created_at: string; };
