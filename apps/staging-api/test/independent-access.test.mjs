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
