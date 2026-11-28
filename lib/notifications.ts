import 'server-only';
import type { PoolClient } from 'pg';
export async function notify(client:PoolClient,userId:string,title:string,body:string,href:string){await client.query(`WITH n AS (INSERT INTO university.notifications(user_id,title,body,href) VALUES($1,$2,$3,$4) RETURNING id) INSERT INTO university.email_outbox(notification_id) SELECT id FROM n`,[userId,title,body,href]);}
export async function notifyClass(client:PoolClient,classId:string,title:string,body:string,href:string){await client.query(`WITH n AS (INSERT INTO university.notifications(user_id,title,body,href) SELECT student_id,$2,$3,$4 FROM university.class_memberships WHERE class_id=$1 AND active RETURNING id) INSERT INTO university.email_outbox(notification_id) SELECT id FROM n`,[classId,title,body,href]);}
