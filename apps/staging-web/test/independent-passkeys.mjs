import assert from 'node:assert/strict';
import {randomInt} from 'node:crypto';
import {chromium} from 'playwright';
import {TrialStore} from '../../staging-api/src/trial-store.mjs';
import {AccessStore,normalizeWhatsAppNumber} from '../../staging-api/src/access-store.mjs';
const origin='http://localhost:3000',pool=new TrialStore(process.env.TRIAL_DATABASE_URL);
const access=new AccessStore(pool.pool,{pepper:process.env.OTP_PEPPER,sender:null,rpID:'localhost',origin});
const browser=await chromium.launch({headless:true});
const number=()=> '0899'+String(randomInt(0,100000000)).padStart(8,'0');
async function post(ctx,data){const r=await ctx.request.post(origin+'/account-api',{headers:{Origin:origin,'Content-Type':'application/json'},data});return {status:r.status(),body:await r.json()};}
async function account(){const ctx=await browser.newContext();const phone=number();const sent=await post(ctx,{operation:'otp_request',purpose:'REGISTER',role:'PAT',phone});assert.equal(sent.status,202);const verified=await post(ctx,{operation:'otp_verify',phone,code:sent.body.fixtureCode});assert.equal(verified.status,200);return {ctx,phone};}
async function virtual(ctx){const page=await ctx.newPage();await page.goto(origin+'/account');const cdp=await ctx.newCDPSession(page);await cdp.send('WebAuthn.enable');const {authenticatorId}=await cdp.send('WebAuthn.addVirtualAuthenticator',{options:{protocol:'ctap2',transport:'internal',hasResidentKey:true,hasUserVerification:true,isUserVerified:true,automaticPresenceSimulation:true}});return {page,cdp,authenticatorId};}
async function ceremony(page,mode,options){return page.evaluate(async ({mode,options})=>{
 const decode=v=>Uint8Array.from(atob(v.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
 const publicKey={...options,challenge:decode(options.challenge)};
 if(mode==='create'){publicKey.user={...options.user,id:decode(options.user.id)};publicKey.excludeCredentials=(options.excludeCredentials??[]).map(c=>({...c,id:decode(c.id)}));}
 else publicKey.allowCredentials=(options.allowCredentials??[]).map(c=>({...c,id:decode(c.id)}));
 const credential=await navigator.credentials[mode]({publicKey});return credential.toJSON();
 },{mode,options});}
try{
 const a=await account(),b=await account();const v=await virtual(a.ctx);
 const enroll=async()=>{const o=await post(a.ctx,{operation:'passkey_register_options'});assert.equal(o.status,200);const response=await ceremony(v.page,'create',o.body.options);return {challengeId:o.body.challengeId,response};};
 const first=await enroll();
 assert.equal((await post(b.ctx,{operation:'passkey_register_verify',...first})).status,401,'other account challenge');
 assert.equal((await post(a.ctx,{operation:'passkey_register_verify',...first})).status,201);
 const stored=(await pool.pool.query('SELECT * FROM madising_trial.passkeys WHERE credential_id=$1',[first.response.id])).rows[0];
 assert.ok(Buffer.isBuffer(stored.public_key)&&stored.public_key.length>=32);
 assert.deepEqual(Object.keys(stored).sort(),['account_id','created_at','credential_id','last_used_at','public_key','sign_count','transports']);
 assert.equal((await post(a.ctx,{operation:'passkey_register_verify',...first})).status,401,'registration replay');
 assert.equal((await post(b.ctx,{operation:'passkeys',remove:first.response.id})).status,404);
 const auth=async()=>{const o=await post(a.ctx,{operation:'passkey_auth_options'});assert.equal(o.status,200);const response=await ceremony(v.page,'get',o.body.options);return {challengeId:o.body.challengeId,response};};
 const valid=await auth();assert.equal((await post(a.ctx,{operation:'passkey_auth_verify',...valid})).status,200);
 assert.equal((await post(a.ctx,{operation:'passkey_auth_verify',...valid})).status,401,'authentication replay');
 const wrongOriginOptions=await post(a.ctx,{operation:'passkey_auth_options'});
 await v.page.goto('http://localhost:3001/healthz');
 const wrongOrigin=await ceremony(v.page,'get',wrongOriginOptions.body.options);
 assert.equal((await post(a.ctx,{operation:'passkey_auth_verify',challengeId:wrongOriginOptions.body.challengeId,response:wrongOrigin})).status,401,'valid signature wrong origin');
 await v.page.goto(origin+'/account');
 // A different RP hash in a forged response must fail; this does not isolate the RP check from signature validation.
 const rp=await auth();const bytes=Buffer.from(rp.response.response.authenticatorData,'base64url');bytes[0]^=1;rp.response.response.authenticatorData=bytes.toString('base64url');
 assert.equal((await post(a.ctx,{operation:'passkey_auth_verify',...rp})).status,401);
 // User verification false: construct a real assertion with discouraged client request, server still requires UV.
 const uv=await post(a.ctx,{operation:'passkey_auth_options'});await v.cdp.send('WebAuthn.setUserVerified',{authenticatorId:v.authenticatorId,isUserVerified:false});
 const noUv=await ceremony(v.page,'get',{...uv.body.options,userVerification:'discouraged'});
 assert.equal((await post(a.ctx,{operation:'passkey_auth_verify',challengeId:uv.body.challengeId,response:noUv})).status,401);
 await v.cdp.send('WebAuthn.setUserVerified',{authenticatorId:v.authenticatorId,isUserVerified:true});
 const rollback=await auth();
 await pool.pool.query('UPDATE madising_trial.passkeys SET sign_count=4294967295 WHERE credential_id=$1',[first.response.id]);
 assert.equal((await post(a.ctx,{operation:'passkey_auth_verify',...rollback})).status,401,'counter regression');
 // Restore only the isolated credential, then fill the registration limit with valid virtual credentials.
 await pool.pool.query('UPDATE madising_trial.passkeys SET sign_count=0 WHERE credential_id=$1',[first.response.id]);
 for(let i=1;i<5;i++){await v.cdp.send('WebAuthn.clearCredentials',{authenticatorId:v.authenticatorId});const entry=await enroll();assert.equal((await post(a.ctx,{operation:'passkey_register_verify',...entry})).status,201);}
 assert.equal((await post(a.ctx,{operation:'passkey_register_options'})).status,409,'sixth passkey');
 const revoked=await auth();
 await pool.pool.query("UPDATE madising_trial.accounts SET state='REVOKED' WHERE phone_hmac=$1",[access.hmac(normalizeWhatsAppNumber(a.phone))]);
 assert.equal((await post(a.ctx,{operation:'passkey_auth_verify',...revoked})).status,403);
 console.log('Independent CDP WebAuthn: enrolment, login, replay, foreign challenge/delete, wrong origin, tampered RP hash, UV false, counter rollback, five-key limit, revoked account passed');
}finally{await browser.close();await pool.close();}
