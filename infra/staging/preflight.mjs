import {pathToFileURL} from 'node:url';
export function validate(role, env, major=Number(process.versions.node.split('.')[0])){
 const errors=[];
 if(major!==22)errors.push('Node.js 22 is required for the tested runtime');
 if(!['api','web'].includes(role))return [...errors,'Unknown service'];
 if(env.MADISING_ACCOUNT_TRIAL!=='1'||env.MADISING_FIXTURE_HARNESS!=='0')errors.push('Account trial only; fixture harness must be disabled');
 if(role==='api'){
  if(env.MADISING_TRIAL_ENABLED!=='1')errors.push('Trial API must be enabled');
  try{
   const url=new URL(env.TRIAL_DATABASE_URL);
   if(!['postgresql:','postgres:'].includes(url.protocol)||url.pathname!=='/madising_trial'||url.username!=='madising_runtime'||!url.password||!url.hostname||url.hash||url.searchParams.get('sslmode')!=='verify-full'||url.searchParams.getAll('sslmode').length!==1||[...url.searchParams.keys()].some(k=>k!=='sslmode'))errors.push('Require dedicated TLS-verified staging runtime database URL');
  }catch{errors.push('Missing or invalid staging database URL');}
  if(env.NODE_TLS_REJECT_UNAUTHORIZED==='0')errors.push('TLS verification cannot be disabled');
 } else {
  try{
   const url=new URL(env.TRIAL_WEB_ORIGIN);
   if(url.protocol!=='https:'||url.origin!==env.TRIAL_WEB_ORIGIN||!url.hostname.includes('.')||url.hostname==='localhost'||url.hostname.endsWith('.workers.dev')||url.username||url.password)errors.push('Require exact protected HTTPS staging hostname');
  }catch{errors.push('Missing or invalid staging origin');}
  if(env.TRIAL_DATABASE_URL)errors.push('Web must not receive database credentials');
 }
 return errors;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const errors=validate(process.argv[2],process.env);
 if(errors.length){for(const error of errors)console.error(error);process.exitCode=1;}
}
