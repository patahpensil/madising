import {randomBytes,randomUUID,createHash,scrypt,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {createTrialState} from './trial-model.mjs';
const derive=promisify(scrypt);
const digest=value=>createHash('sha256').update(value).digest('hex');
const roles=new Set(['PAT','NRS','DOC','PHA','CUR','ADM']);
export const validCredentials=(name,password)=>typeof name==='string'&&/^uji-[a-z0-9][a-z0-9-]{2,39}$/.test(name)&&typeof password==='string'&&password.length>=16&&Buffer.byteLength(password)<=128;
async function passwordDigest(password,salt){return (await derive(password,Buffer.from(salt,'hex'),64,{N:32768,r:8,p:1,maxmem:64*1024*1024})).toString('hex');}
export class AccountStore{
 constructor(pool){this.pool=pool;this.inFlight=0;}
 async transaction(work){
  const client=await this.pool.connect();let discard=false;
  try{await client.query('BEGIN');await client.query("SET LOCAL lock_timeout='2s'");const result=await work(client);await client.query('COMMIT');return result;}
  catch(error){try{await client.query('ROLLBACK');}catch{discard=true;}throw error;}
  finally{client.release(discard);}
 }
 async bounded(work){if(this.inFlight>=2)return {code:429};this.inFlight++;try{return await work();}finally{this.inFlight--;}}
 async register(input){
  if(!input||!validCredentials(input.username,input.password)||!['PAT','CUR'].includes(input.role))return {code:400};
  return this.bounded(async()=>{
   const salt=randomBytes(16).toString('hex'),value=await passwordDigest(input.password,salt);
   return this.transaction(async client=>{
    await client.query('SELECT pg_advisory_xact_lock(61421022)');
    const count=await client.query('SELECT count(*)::int AS total FROM madising_trial.accounts');
    if(count.rows[0].total>=100)return {code:429};
    await client.query("INSERT INTO madising_trial.accounts(id,username,role,state,salt,password_hash) VALUES($1,$2,$3,'PENDING',$4,$5) ON CONFLICT(username) DO NOTHING",[randomUUID(),input.username,input.role,salt,value]);
    return {code:202};
   });
  });
 }
 async login(input){
  if(!input||!validCredentials(input.username,input.password))return {code:401};
  return this.bounded(()=>this.transaction(async client=>{
   const found=await client.query('SELECT *,locked_until>clock_timestamp() AS locked FROM madising_trial.accounts WHERE username=$1 FOR UPDATE',[input.username]);
   const a=found.rows[0],computed=await passwordDigest(input.password,a?.salt??'0'.repeat(32));
   const equal=timingSafeEqual(Buffer.from(computed,'hex'),Buffer.from(a?.password_hash??'0'.repeat(128),'hex'));
   if(!a||a.locked)return {code:401};
   if(!equal){await client.query("UPDATE madising_trial.accounts SET failed_attempts=CASE WHEN failed_attempts>=5 THEN 1 ELSE failed_attempts+1 END,locked_until=CASE WHEN failed_attempts=4 THEN clock_timestamp()+interval '15 minutes' ELSE NULL END WHERE id=$1",[a.id]);return {code:401};}
   if(a.state!=='ACTIVE'||!a.exercise_id)return {code:403};
   const exercise=await client.query('SELECT id FROM madising_trial.sessions WHERE id=$1 AND expires_at>clock_timestamp() FOR SHARE',[a.exercise_id]);
   if(exercise.rowCount!==1)return {code:403};
   const token=randomBytes(32).toString('hex');
   await client.query('DELETE FROM madising_trial.account_sessions WHERE account_id=$1',[a.id]);
   await client.query("INSERT INTO madising_trial.account_sessions(token_hash,account_id,expires_at,idle_until) VALUES($1,$2,transaction_timestamp()+interval '2 hours',transaction_timestamp()+interval '30 minutes')",[digest(token),a.id]);
   await client.query('UPDATE madising_trial.accounts SET failed_attempts=0,locked_until=NULL WHERE id=$1',[a.id]);
   return {code:200,token,role:a.role};
  }));
 }
 async logout(token){if(typeof token==='string'&&/^[a-f0-9]{64}$/.test(token))await this.pool.query('DELETE FROM madising_trial.account_sessions WHERE token_hash=$1',[digest(token)]);return {code:200};}
 // Trusted local operator only; no public provisioning endpoint.
 async provision(input){
  if(!input||!validCredentials(input.username,input.password)||!roles.has(input.role))throw new Error('Invalid synthetic account');
  const salt=randomBytes(16).toString('hex'),value=await passwordDigest(input.password,salt);
  return this.transaction(async client=>{
   await client.query('SELECT pg_advisory_xact_lock(61421022)');
   const account=await client.query('SELECT * FROM madising_trial.accounts WHERE username=$1 FOR UPDATE',[input.username]);
   if(account.rowCount&&account.rows[0].role!==input.role)throw new Error('Role already bound');
   if(!account.rowCount){const count=await client.query('SELECT count(*)::int AS total FROM madising_trial.accounts');if(count.rows[0].total>=100)throw new Error('Account capacity');}
   let exerciseId=input.exerciseId;
   if(!exerciseId){exerciseId=randomUUID();await client.query("INSERT INTO madising_trial.sessions(id,token_hash,state,version,expires_at) VALUES($1,$2,$3,0,clock_timestamp()+interval '2 hours')",[exerciseId,digest(randomBytes(32).toString('hex')),JSON.stringify(createTrialState())]);}
   else{const exercise=await client.query('SELECT id FROM madising_trial.sessions WHERE id=$1 AND expires_at>clock_timestamp() FOR SHARE',[exerciseId]);if(exercise.rowCount!==1)throw new Error('Exercise unavailable');}
   const id=account.rows[0]?.id??randomUUID();
   await client.query("INSERT INTO madising_trial.accounts(id,username,role,state,salt,password_hash,exercise_id) VALUES($1,$2,$3,'ACTIVE',$4,$5,$6) ON CONFLICT(username) DO UPDATE SET state='ACTIVE',salt=EXCLUDED.salt,password_hash=EXCLUDED.password_hash,exercise_id=EXCLUDED.exercise_id,failed_attempts=0,locked_until=NULL",[id,input.username,input.role,salt,value,exerciseId]);
   await client.query('DELETE FROM madising_trial.account_sessions WHERE account_id=$1',[id]);
   return {exerciseId,role:input.role};
  });
 }
}
