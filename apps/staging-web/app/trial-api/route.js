export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' };
export async function POST(request) {
  if (process.env.MADISING_TRIAL_ENABLED !== '1' || process.env.MADISING_FIXTURE_HARNESS !== '1') return Response.json({error:'trial_disabled'},{status:503,headers});
  const allowedOrigin = process.env.TRIAL_WEB_ORIGIN || 'http://localhost:3000';
  if (request.headers.get('origin') !== allowedOrigin || request.headers.get('content-type') !== 'application/json') return Response.json({error:'invalid_request'},{status:403,headers});
  const reader = request.body?.getReader();
  if (!reader) return Response.json({error:'invalid_request'},{status:400,headers});
  const chunks = []; let size=0;
  try {
    while (true) { const {done,value}=await reader.read(); if(done)break; size+=value.byteLength; if(size>4096){await reader.cancel();return Response.json({error:'too_large'},{status:413,headers});}chunks.push(value); }
    const body=JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!body || !['create','action','read'].includes(body.operation)) return Response.json({error:'invalid_request'},{status:400,headers});
    const upstream=await fetch('http://127.0.0.1:3001/trial/'+(body.operation==='create'?'sessions':'actions'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body.operation==='create'?{}:{id:body.id,token:body.token,role:body.role,action:body.action,version:body.version}),cache:'no-store',signal:AbortSignal.timeout(10000)});
    return new Response(await upstream.text(),{status:upstream.status,headers:{...headers,'Content-Type':'application/json'}});
  } catch { return Response.json({error:'trial_unavailable'},{status:503,headers}); }
  finally { reader.releaseLock(); }
}
