import {cookies} from 'next/headers';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const response=(body,status)=>Response.json(body,{status,headers});
export async function POST(request){
 if(process.env.MADISING_ACCOUNT_TRIAL!=='1')return response({error:'disabled'},503);
 const origin=process.env.TRIAL_WEB_ORIGIN;
 if(!origin||request.headers.get('origin')!==origin||request.headers.get('content-type')!=='application/json')return response({error:'invalid_request'},403);
 const secure=origin.startsWith('https://');
 if(!secure&&!['http://127.0.0.1:3000','http://localhost:3000'].includes(origin))return response({error:'disabled'},503);
 const cookieName=secure?'__Host-madising_trial':'madising_trial_local';
 const jar=await cookies();const token=jar.get(cookieName)?.value;
 const reader=request.body?.getReader();if(!reader)return response({error:'invalid_request'},400);
 try{
  const chunks=[];let length=0;
  while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>4096){await reader.cancel();return response({error:'too_large'},413);}chunks.push(value);}
  let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return response({error:'invalid_request'},400);}
  if(!body||!['register','login','logout','action','read'].includes(body.operation))return response({error:'invalid_request'},400);
  const operation=body.operation==='read'?'action':body.operation;
  const payload=operation==='login'||operation==='register'?{username:body.username,password:body.password,...(operation==='register'?{role:body.role}:{})}:operation==='logout'?{token}:{token,action:body.operation==='read'?'READ':body.action,version:body.operation==='read'?0:body.version};
  if(!['register','login'].includes(operation)&&!token)return response({error:'unauthorized'},401);
  const upstream=await fetch('http://127.0.0.1:3001/account/'+operation,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),cache:'no-store',signal:AbortSignal.timeout(10000)});
  const result=await upstream.json();
  if(operation==='login'&&upstream.ok){
   if(typeof result.token!=='string'||!/^[a-f0-9]{64}$/.test(result.token))return response({error:'unavailable'},503);
   jar.set(cookieName,result.token,{httpOnly:true,secure,sameSite:'strict',path:'/',maxAge:7200});
   return response({role:result.role},200);
  }
  if(operation==='logout'&&upstream.ok){jar.set(cookieName,'',{httpOnly:true,secure,sameSite:'strict',path:'/',maxAge:0});return response({code:200},200);}
  return response(result,upstream.status);
 }catch{return response({error:'unavailable'},503);}finally{reader.releaseLock();}
}
