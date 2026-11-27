import { requireUser,isStaff } from '@/lib/access';
import { PortalShell } from '@/components/portal-shell';
export const dynamic='force-dynamic';
export default async function StudentLayout({children}:{children:React.ReactNode}) {const user=await requireUser();return <PortalShell name={user.name} email={user.email} staff={await isStaff(user.id)}>{children}</PortalShell>;}
