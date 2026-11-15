import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,randomInt,randomUUID,createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {TrialStore} from '../src/trial-store.mjs';
import {AccessStore,normalizeWhatsAppNumber,validOtpCode} from '../src/access-store.mjs';
const phone=()=> '0899'+String(randomInt(0,100000000)).padStart(8,'0');
const digest=v=>createHash('sha256').update(v).digest('hex');
const fixture={async send(){return {exposeCode:true};}};
const setup=t=>{const trial=new TrialStore(process.env.TRIAL_DATABASE_URL);t.after(()=>trial.close());const access=new AccessStore(trial.pool,{pepper:randomBytes(32).toString('hex'),sender:fixture,rpID:'localhost',origin:'http://localhost:3000'});return {trial,access};};
async function patient(access){const number=phone(),sent=await access.requestOtp({phone:number,purpose:'REGISTER',role:'PAT'});const result=await access.verifyOtp({phone:number,code:sent.fixtureCode});assert.equal(result.code,200);return {number,token:result.token};}
const age=(access,number)=>access.pool.query("UPDATE madising_trial.otp_challenges SET created_at=created_at-interval '61 seconds',expires_at=expires_at-interval '61 seconds' WHERE phone_hmac=$1",[access.hmac(normalizeWhatsAppNumber(number))]);
test('independent OTP input matrix: national digit boundaries, prefixes and invalid code shapes',()=>{
 for(const size of [9,10,13,14])for(const prefix of ['0','62','+62']){
  const national='89'+'0'.repeat(size-3);const value=prefix+national;
  assert.equal(normalizeWhatsAppNumber(value),size>=10&&size<=13?'+62'+national:null);
 }
 assert.equal(normalizeWhatsAppNumber('0 899-000-000'),'+62899000000');
 for(const v of [null,123,{},[], '0210000000','+12025550100'])assert.equal(normalizeWhatsAppNumber(v),null);
 for(const v of ['12345','1234567','12a456',123456,null])assert.equal(validOtpCode(v),false);
});
test('independent OTP parallel issuance and ten concurrent correct verifies create only one patient',async t=>{
 const {access,trial}=setup(t);const number=phone();
 const [a,b]=await Promise.all([1,2].map(()=>access.requestOtp({phone:number,purpose:'REGISTER',role:'PAT'})));
 assert.deepEqual([a.code,b.code].sort(),[202,429]);const code=(a.code===202?a:b).fixtureCode;
 const results=await Promise.all(Array.from({length:10},()=>access.verifyOtp({phone:number,code})));
 assert.equal(results.filter(x=>x.code===200).length,1);assert.equal(results.filter(x=>x.code===401).length,9);
 const identity=await trial.pool.query('SELECT count(*)::int AS n FROM madising_trial.accounts WHERE phone_hmac=$1',[access.hmac(normalizeWhatsAppNumber(number))]);assert.equal(identity.rows[0].n,1);
});
test('independent anti-enumeration: identical request responses and rate limits for active and unknown numbers',async t=>{
 const {access}=setup(t);const active=await patient(access);await age(access,active.number);const unknown=phone();
 access.sender={async send(){return {exposeCode:false};}};
 const elapsed={active:[],unknown:[]};
 async function request(number,label){const begin=performance.now();const result=await access.requestOtp({phone:number,purpose:'LOGIN'});elapsed[label].push(performance.now()-begin);return result;}
 const firstA=await request(active.number,'active'),firstB=await request(unknown,'unknown');assert.deepEqual(firstA,firstB);
 const secondA=await request(active.number,'active'),secondB=await request(unknown,'unknown');assert.equal(secondA.code,429);assert.equal(secondB.code,429);
 // Commit history from registration means the active number has one more earlier send. Compare fresh windows.
 await access.pool.query('DELETE FROM madising_trial.otp_challenges WHERE phone_hmac=ANY($1)',[[access.hmac(normalizeWhatsAppNumber(active.number)),access.hmac(normalizeWhatsAppNumber(unknown))]]);
 for(let i=0;i<6;i++){const a=await request(active.number,'active'),b=await request(unknown,'unknown');assert.equal(a.code,b.code);assert.equal(a.code,i===5?429:202);await age(access,active.number);await age(access,unknown);}
 console.log('independent OTP response latency milliseconds (small descriptive sample, no timing-security claim):',JSON.stringify(elapsed));
});
test('independent session polling must not renew idle expiry; expired exercise cannot access preferences',async t=>{
 const {trial,access}=setup(t);const {token}=await patient(access);const hash=digest(token);
 const set=await trial.pool.query("UPDATE madising_trial.account_sessions SET idle_until=clock_timestamp()+interval '5 minutes' WHERE token_hash=$1 RETURNING idle_until",[hash]);
 assert.equal((await trial.act({token,action:'READ',version:0},true)).code,200);
 const read=await trial.pool.query('SELECT idle_until FROM madising_trial.account_sessions WHERE token_hash=$1',[hash]);assert.equal(+read.rows[0].idle_until,+set.rows[0].idle_until);
 await trial.pool.query("UPDATE madising_trial.sessions SET expires_at=clock_timestamp()-interval '1 second' WHERE id=(SELECT exercise_id FROM madising_trial.accounts WHERE id=(SELECT account_id FROM madising_trial.account_sessions WHERE token_hash=$1))",[hash]);
 assert.equal((await access.preferences(token)).code,401);
});
test('independent synthetic phone and OTP persistence checks; malformed data rejected by SQL',async t=>{
 const {trial,access}=setup(t);const p=await patient(access);
 const {rows:[account]}=await trial.pool.query('SELECT * FROM madising_trial.accounts WHERE phone_hmac=$1',[access.hmac(normalizeWhatsAppNumber(p.number))]);
 assert.equal(account.username,null);assert.equal(account.password_hash,null);
 assert.equal(account.phone_last4,p.number.slice(-4));assert.match(account.phone_hmac,/^[0-9a-f]{64}$/);
 const {rows:[challenge]}=await trial.pool.query('SELECT * FROM madising_trial.otp_challenges WHERE phone_hmac=$1',[account.phone_hmac]);assert.match(challenge.code_hmac,/^[0-9a-f]{64}$/);
 assert.equal(JSON.stringify(account).includes(p.number),false);
 for(const [sql,params] of [
  ["UPDATE madising_trial.accounts SET phone_hmac='raw' WHERE id=$1",[account.id]],
  ["UPDATE madising_trial.accounts SET role='DOC' WHERE id=$1",[account.id]],
  ["UPDATE madising_trial.otp_challenges SET attempts=6 WHERE id=$1",[challenge.id]],
  ["UPDATE madising_trial.otp_challenges SET role='ADM' WHERE id=$1",[challenge.id]],
  ["UPDATE madising_trial.account_preferences SET language='xx' WHERE account_id=$1",[account.id]],
  ["INSERT INTO madising_trial.passkeys(credential_id,account_id,public_key,sign_count) VALUES('short',$1,$2,0)",[account.id,Buffer.alloc(64)]],
  ["INSERT INTO madising_trial.care_reviews(id,exercise_id,professional_key,account_id,rating,tags) VALUES($1,$2,'NURSE_B',$3,6,ARRAY['RAMAH'])",[randomUUID(),account.exercise_id,account.id]]
 ])await assert.rejects(trial.pool.query(sql,params),e=>e.code==='23514');
});

test('independent professional visibility includes the fallback nurse; a request alone is not a doctor order',async t=>{
 const {access}=setup(t);
 for(const status of ['DRAFT','REQUESTED','CONFIRMED'])assert.deepEqual(access.involved({status,assigned:'NURSE_C',order:'NONE'}),[]);
 assert.deepEqual(access.involved({status:'ASSIGNED',assigned:'NURSE_C',order:'NONE'}),['NURSE_C']);
 assert.deepEqual(access.involved({status:'IN_PROGRESS',assigned:'NURSE_C',order:'REQUESTED'}),['NURSE_C']);
 assert.deepEqual(access.involved({status:'IN_PROGRESS',assigned:'NURSE_C',order:'SIGNED'}),['NURSE_C','DOCTOR_A']);
});
test('independent OTP verification burns five guesses including malformed input handling; expired code and pending courier denied',async t=>{
 const {access,trial}=setup(t);const number=phone();
 for(const role of ['DOC','NRS','PHA','ADM'])assert.equal((await access.requestOtp({phone:number,purpose:'REGISTER',role})).code,400);
 const sent=await access.requestOtp({phone:number,purpose:'REGISTER',role:'PAT'});
 const wrong=String((Number(sent.fixtureCode)+1)%1000000).padStart(6,'0');
 for(const bad of ['12a456','12345','1234567'])assert.equal((await access.verifyOtp({phone:number,code:bad})).code,400);
 for(let i=4;i>=0;i--)assert.deepEqual(await access.verifyOtp({phone:number,code:wrong}),{code:401,attemptsRemaining:i});
 assert.equal((await access.verifyOtp({phone:number,code:sent.fixtureCode})).code,401);
 await age(access,number);
 const issued=await access.requestOtp({phone:number,purpose:'REGISTER',role:'CUR'});
 await trial.pool.query("UPDATE madising_trial.otp_challenges SET created_at=clock_timestamp()-interval '6 minutes',expires_at=clock_timestamp()-interval '1 minute' WHERE phone_hmac=$1",[access.hmac(normalizeWhatsAppNumber(number))]);
 assert.equal((await access.verifyOtp({phone:number,code:issued.fixtureCode})).code,401);
 const courier=await access.requestOtp({phone:number,purpose:'REGISTER',role:'CUR'});
 assert.deepEqual(await access.verifyOtp({phone:number,code:courier.fixtureCode}),{code:202,pending:true});
 await age(access,number);const pending=await access.requestOtp({phone:number,purpose:'LOGIN'});assert.equal(pending.code,202);assert.equal(pending.fixtureCode,undefined);
});
test('independent review boundary and nonpatient denial through account tokens',async t=>{
 const {trial,access}=setup(t);const p=await patient(access);
 const {rows:[a]}=await trial.pool.query('SELECT id,exercise_id FROM madising_trial.accounts WHERE phone_hmac=$1',[access.hmac(normalizeWhatsAppNumber(p.number))]);
 const profile='NURSE_C';
 // This is a direct state fixture for the access boundary, not evidence of the clinical workflow.
 const state={status:'ASSIGNED',assigned:profile,order:'NONE'};
 async function setState(status,order='NONE'){await trial.pool.query('UPDATE madising_trial.sessions SET state=$1 WHERE id=$2',[JSON.stringify({...state,status,order}),a.exercise_id]);}
 await setState('CONFIRMED');assert.deepEqual((await access.careTeam(p.token)).team,[]);
 await setState('ASSIGNED');const assigned=(await access.careTeam(p.token)).team;assert.equal(assigned[0].key,profile);assert.equal(assigned[0].rating.total,0);
 assert.equal((await access.review(p.token,{professionalKey:profile,rating:5})).code,409);
 await setState('IN_PROGRESS','REQUESTED');assert.equal((await access.careTeam(p.token)).team.length,1);
 await setState('IN_PROGRESS','SIGNED');assert.equal((await access.careTeam(p.token)).team.length,2);
 await setState('COMPLETED','NONE');
 for(const rating of [0,6,1.5])assert.equal((await access.review(p.token,{professionalKey:profile,rating})).code,400);
 assert.equal((await access.review(p.token,{professionalKey:profile,rating:5,tags:['FREE']})).code,400);
 assert.equal((await access.review(p.token,{professionalKey:'DOCTOR_A',rating:5})).code,409);
 const reviews=await Promise.all(Array.from({length:10},()=>access.review(p.token,{professionalKey:profile,rating:4,tags:['RAMAH']})));
 assert.equal(reviews.filter(x=>x.code===201).length,1);assert.equal(reviews.filter(x=>x.code===409).length,9);
 for(const role of ['NRS','DOC','PHA','CUR','ADM']){
  const id=randomUUID(),token=randomBytes(32).toString('hex');
  await trial.pool.query("INSERT INTO madising_trial.accounts(id,username,role,state,salt,password_hash,exercise_id) VALUES($1,$2,$3,'ACTIVE',$4,$5,$6)",[id,'uji-'+randomBytes(8).toString('hex'),role,'a'.repeat(32),'b'.repeat(128),a.exercise_id]);
  await trial.pool.query("INSERT INTO madising_trial.account_sessions(token_hash,account_id,expires_at,idle_until) VALUES($1,$2,clock_timestamp()+interval '1 hour',clock_timestamp()+interval '30 minutes')",[digest(token),id]);
  assert.equal((await access.careTeam(token)).code,403,role);assert.equal((await access.review(token,{professionalKey:profile,rating:5})).code,403,role);
 }
});
