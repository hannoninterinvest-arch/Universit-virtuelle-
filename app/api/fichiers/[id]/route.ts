import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { currentUser } from '@/lib/access';
import { canReadDocument } from '@/lib/campus-access';
import { storage,storageBucket } from '@/lib/storage';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){const user=await currentUser();if(!user)return new Response('Connexion requise',{status:401});const{id}=await params;if(!/^[0-9a-f-]{36}$/i.test(id))return new Response('Introuvable',{status:404});const d=await canReadDocument(user.id,id);if(!d)return new Response('Introuvable',{status:404});const url=await getSignedUrl(storage,new GetObjectCommand({Bucket:storageBucket,Key:d.object_key,ResponseContentDisposition:`${new URL(request.url).searchParams.get('preview')==='1'&&d.content_type==='application/pdf'?'inline':'attachment'}; filename*=UTF-8''${encodeURIComponent(d.filename)}`}),{expiresIn:120});return new Response(null,{status:302,headers:{Location:url,'Cache-Control':'private, no-store'}});}
