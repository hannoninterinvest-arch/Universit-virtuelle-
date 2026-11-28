import { currentUser,isStaff } from '@/lib/access';
import { deliverOutbox } from '@/lib/mail';
export async function POST(request:Request){const user=await currentUser();if(!user||!await isStaff(user.id))return Response.json({error:'Accès refusé.'},{status:403});if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Origine invalide.'},{status:403});return Response.json(await deliverOutbox(10));}
