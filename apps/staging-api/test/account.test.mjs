import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {TrialStore} from '../src/trial-store.mjs';
import {AccountStore} from '../src/account-store.mjs';
const secret=()=>randomBytes(24).toString('hex');
const name=()=> 'uji-'+randomBytes(6).toString('hex');
test('registration is restricted and pending',async(t)=>{
 const trial=new TrialStore(process.env.TRIAL_DATABASE_URL);t.after(()=>trial.close());const auth=new AccountStore(trial.pool);
 const username=name(),password=secret();
 assert.equal((await auth.register({username,password,role:'DOC'})).code,400);
 assert.equal((await auth.register({username,password,role:'PAT'})).code,202);
 assert.equal((await auth.register({username,password,role:'CUR'})).code,202);
 assert.equal((await auth.login({username,password})).code,403);
 assert.equal((await auth.login({username:name(),password})).code,401);
});
test('account role is server derived; separate credentials share only an assigned exercise',async(t)=>{
 const trial=new TrialStore(process.env.TRIAL_DATABASE_URL);t.after(()=>trial.close());const auth=new AccountStore(trial.pool);
 const a={username:name(),password:secret(),role:'PAT'},b={username:name(),password:secret(),role:'NRS'};
 const group=await auth.provision(a);await auth.provision({...b,exerciseId:group.exerciseId});
 const pat=await auth.login(a),nurse=await auth.login(b);assert.equal(pat.code,200);assert.equal(nurse.role,'NRS');
 let version=0;for(const action of ['REQUEST','SCREEN','VERIFY_DESTINATION','CONSENT']){const result=await trial.act({token:pat.token,action,version,role:'ADM'},true);assert.equal(result.code,200,action);assert.equal(result.role,'PAT');version=result.state.version;}
 assert.equal((await trial.act({token:pat.token,action:'ACCEPT',version,role:'NRS'},true)).code,409);
 const read=await trial.act({token:nurse.token,action:'READ',version:0},true);assert.equal(read.state.offer,'NURSE_B');
 const results=await Promise.all([trial.act({token:nurse.token,action:'ACCEPT',version},true),trial.act({token:nurse.token,action:'ACCEPT',version},true)]);assert.deepEqual(results.map(x=>x.code).sort(),[200,409]);
 await auth.logout(pat.token);assert.equal((await trial.act({token:pat.token,action:'READ',version:0},true)).code,401);
 const again=await auth.login(b);assert.equal((await trial.act({token:nurse.token,action:'READ',version:0},true)).code,401);
 await trial.pool.query("UPDATE madising_trial.accounts SET state='REVOKED' WHERE username=$1",[b.username]);
 assert.equal((await trial.act({token:again.token,action:'READ',version:0},true)).code,401);
});
test('five bad passwords lock the account',async(t)=>{
 const trial=new TrialStore(process.env.TRIAL_DATABASE_URL);t.after(()=>trial.close());const auth=new AccountStore(trial.pool);const a={username:name(),password:secret(),role:'CUR'};await auth.provision(a);
 for(let n=0;n<5;n++)assert.equal((await auth.login({...a,password:secret()})).code,401);
 assert.equal((await auth.login(a)).code,401);
});

test('expired session and unrelated exercise cannot read or change the original exercise',async(t)=>{
 const trial=new TrialStore(process.env.TRIAL_DATABASE_URL);t.after(()=>trial.close());const auth=new AccountStore(trial.pool);
 const p={username:name(),password:secret(),role:'PAT'},other={username:name(),password:secret(),role:'NRS'};
 const first=await auth.provision(p);await auth.provision(other);
 const pat=await auth.login(p),nurse=await auth.login(other);
 let version=0;for(const action of ['REQUEST','SCREEN','VERIFY_DESTINATION','CONSENT']){const result=await trial.act({token:pat.token,action,version},true);assert.equal(result.code,200);version=result.state.version;}
 const own=await trial.act({token:nurse.token,id:first.exerciseId,role:'NRS',action:'READ',version},true);
 assert.equal(own.state.status,'DRAFT');assert.equal((await trial.act({token:nurse.token,id:first.exerciseId,action:'ACCEPT',version:0},true)).code,409);
 await trial.pool.query("UPDATE madising_trial.account_sessions SET idle_until=clock_timestamp()-interval '1 second' WHERE account_id=(SELECT id FROM madising_trial.accounts WHERE username=$1)",[p.username]);
 assert.equal((await trial.act({token:pat.token,action:'READ',version:0},true)).code,401);
});
