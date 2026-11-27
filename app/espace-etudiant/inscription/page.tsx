import { requireUser } from '@/lib/access';
import { db } from '@/lib/db';
import type { Application } from '@/lib/admissions';
import { ApplicationForm } from '@/components/application-form';
export default async function ApplicationPage() {const user=await requireUser();const {rows}=await db.query<Application>('SELECT * FROM university.applications WHERE user_id=$1',[user.id]);return <ApplicationForm application={rows[0]?JSON.parse(JSON.stringify(rows[0])):null} email={user.email}/>;}
