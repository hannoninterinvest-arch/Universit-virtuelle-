
import {z} from 'zod';
export const fieldTypes=['text','textarea','number','date','email','select','checkbox','document'] as const;
export const labels:Record<typeof fieldTypes[number],string>={text:'Texte court',textarea:'Texte long',number:'Nombre',date:'Date',email:'E-mail',select:'Liste de choix',checkbox:'Case à cocher',document:'Pièce justificative'};
export const fieldSchema=z.object({id:z.uuid(),label:z.string().trim().min(1).max(180),type:z.enum(fieldTypes),required:z.boolean(),hint:z.string().trim().max(500),options:z.array(z.string().trim().min(1).max(150)).max(30)}).strict().refine(f=>f.type!=='select'||(f.options.length>=2&&new Set(f.options).size===f.options.length),'Choix distincts requis.');
export const formSchema=z.array(fieldSchema).max(40).refine(a=>new Set(a.map(f=>f.id)).size===a.length,'Identifiants dupliqués.');
export type Field=z.infer<typeof fieldSchema>;
export type Answers=Record<string,string|boolean>;
export type Doc={id:string;filename:string;review_status:string;review_note:string};
export function validateAnswers(fields:Field[],input:unknown,submit:boolean){
 const parsed=z.record(z.string(),z.union([z.string().max(5000),z.boolean()])).safeParse(input);
 const answers:Answers={},errors:Record<string,string>={};
 if(!parsed.success)return {answers,errors:{form:'Réponses invalides.'} as Record<string,string>};
 for(const f of fields){const raw=parsed.data[f.id],v=typeof raw==='string'?raw.trim():raw;
 if(v===undefined||v===''||(f.type==='checkbox'&&v===false)){if(submit&&f.required)errors[f.id]='Champ obligatoire.';if(f.type==='checkbox')answers[f.id]=false;continue;}
 if(f.type==='checkbox'){if(typeof v!=='boolean')errors[f.id]='Valeur invalide.';else answers[f.id]=v;continue;}
 if(typeof v!=='string'){errors[f.id]='Valeur invalide.';continue;}
 if(f.type==='select'&&!f.options.includes(v))errors[f.id]='Choix invalide.';
 else if(f.type==='document'&&!z.uuid().safeParse(v).success)errors[f.id]='Document invalide.';
 else if(f.type==='email'&&!z.email().safeParse(v).success)errors[f.id]='E-mail invalide.';
 else if(f.type==='date'&&!z.iso.date().safeParse(v).success)errors[f.id]='Date invalide.';
 else if(f.type==='number'&&(!Number.isFinite(Number(v))||!/^[-+]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(v)))errors[f.id]='Nombre invalide.';
 else if(v.length>(f.type==='textarea'?5000:500))errors[f.id]='Réponse trop longue.';
 else answers[f.id]=v;}
 if(Object.keys(parsed.data).some(k=>!fields.some(f=>f.id===k)))errors.form='Formulaire modifié. Rechargez la page.';
 return {answers,errors};
}
