import { randomUUID,createHash } from 'node:crypto';
import { PutObjectCommand,DeleteObjectCommand } from '@aws-sdk/client-s3';
import { currentUser } from '@/lib/access';
import { db } from '@/lib/db';
import { storage,storageBucket } from '@/lib/storage';
export async function POST(request:Request){
  const user=await currentUser();if(!user)return Response.json({error:'Connexion requise.'},{status:401});
  if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Origine invalide.'},{status:403});
  if(Number(request.headers.get('content-length'))>4400000)return Response.json({error:'Le fichier doit faire 4 Mo maximum.'},{status:413});
  try{const form=await request.formData(),file=form.get('file'),purpose=String(form.get('purpose')||'other');if(!(file instanceof File)||!['admission','submission','payment','other'].includes(purpose))return Response.json({error:'Fichier invalide.'},{status:400});if(!file.size||file.size>4194304)return Response.json({error:'Le fichier doit faire 4 Mo maximum.'},{status:400});
    const n=Number((await db.query("SELECT count(*) AS n FROM university.documents WHERE owner_id=$1 AND created_at>now()-interval '1 day'",[user.id])).rows[0].n);if(n>=50)return Response.json({error:'Limite de dépôts atteinte pour aujourd’hui.'},{status:429});
    const bytes=Buffer.from(await file.arrayBuffer());const mime=bytes.subarray(0,5).toString()==='%PDF-'?'application/pdf':bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff?'image/jpeg':bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'image/png':null;if(!mime)return Response.json({error:'Formats acceptés : PDF, JPEG et PNG.'},{status:400});
    const id=randomUUID(),key=`${user.id}/${id}`,filename=file.name.replace(/[\r\n\x00]/g,'').slice(0,180)||'document';await storage.send(new PutObjectCommand({Bucket:storageBucket,Key:key,Body:bytes,ContentType:mime,ContentDisposition:'attachment',CacheControl:'private, no-store'}));
    try{await db.query('INSERT INTO university.documents(id,owner_id,purpose,filename,content_type,size,object_key,sha256) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[id,user.id,purpose,filename,mime,bytes.length,key,createHash('sha256').update(bytes).digest('hex')]);}catch(e){await storage.send(new DeleteObjectCommand({Bucket:storageBucket,Key:key}));throw e;}
    return Response.json({id,filename});
  }catch{return Response.json({error:'Le dépôt a échoué. Réessayez dans un instant.'},{status:500});}
}
