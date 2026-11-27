import 'server-only';
import { redirect } from 'next/navigation';
import { auth } from './auth-server';
import { db } from './db';
export async function currentUser() {
  const { data: session, error } = await auth.getSession();
  if (error || !session?.user) return null;
  return session.user;
}
export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect('/auth/sign-in');
  return user;
}
export async function isStaff(userId: string) {
  const r = await db.query('SELECT 1 FROM university.staff_members WHERE user_id = $1', [userId]);
  return r.rowCount === 1;
}
export async function requireStaff() {
  const user = await requireUser();
  if (!await isStaff(user.id)) return null;
  return user;
}
