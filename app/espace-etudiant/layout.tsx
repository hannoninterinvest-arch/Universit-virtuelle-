import { requireUser,isStaff } from '@/lib/access';
import { PortalShell } from '@/components/portal-shell';
import { isTeacher } from '@/lib/campus-access';
import { db } from '@/lib/db';
export const dynamic='force-dynamic';
export default async function StudentLayout({children}:{children:React.ReactNode}) {const user=await requireUser();const[staff,teacher,count]=await Promise.all([isStaff(user.id),isTeacher(user.id),db.query('SELECT count(*) AS n FROM university.notifications WHERE user_id=$1 AND read_at IS NULL',[user.id])]);return <PortalShell name={user.name} email={user.email} staff={staff} teacher={teacher||staff} unread={Number(count.rows[0].n)}>{children}</PortalShell>;}
