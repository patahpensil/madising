import assert from 'node:assert/strict';
import {randomInt} from 'node:crypto';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
const origin='http://localhost:3000';
const phone=()=> '0899'+String(randomInt(0,100000000)).padStart(8,'0');
const browser=await chromium.launch({headless:true});
try{
 const ctx=await browser.newContext({viewport:{width:390,height:844}});
 const post=data=>ctx.request.post(origin+'/account-api',{headers:{Origin:origin,'Content-Type':'application/json'},data});
 for(const role of ['DOC','NRS','PHA','ADM'])assert.equal((await post({operation:'otp_request',phone:phone(),purpose:'REGISTER',role})).status(),400);
 assert.equal((await post({operation:'preferences'})).status(),401);
 assert.equal((await post({operation:'otp_request',phone:'x'.repeat(9000),purpose:'REGISTER',role:'PAT'})).status(),413);
 const courier=phone();const sent=await post({operation:'otp_request',phone:courier,purpose:'REGISTER',role:'CUR'});assert.equal(sent.status(),202);
 const decoded=await sent.json();const pending=await post({operation:'otp_verify',phone:courier,code:decoded.fixtureCode});assert.equal(pending.status(),202);assert.equal((await pending.json()).pending,true);
 assert.equal((await ctx.cookies()).length,0);assert.equal((await post({operation:'care_team'})).status(),401);
 const patient=phone();const code=await (await post({operation:'otp_request',phone:patient,purpose:'REGISTER',role:'PAT'})).json();
 assert.equal((await post({operation:'otp_verify',phone:patient,code:code.fixtureCode})).status(),200);
 const cookie=(await ctx.cookies()).find(c=>c.name==='madising_trial_local');assert.equal(cookie.httpOnly,true);assert.equal(cookie.sameSite,'Strict');
 const page=await ctx.newPage();const shots=process.env.SCREENSHOT_DIR;if(shots)mkdirSync(shots,{recursive:true});
 await page.goto(origin+'/account');await page.getByRole('heading',{name:'Pasien',exact:true}).waitFor();
 for(const width of [360,390,430,1280,1440]){
  await page.setViewportSize({width,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow at '+width);
  if(shots)await page.screenshot({path:shots+'/independent-account-'+width+'.png'});
 }
 console.log('Independent HTTP account lock, payload limits, pending courier, cookie and responsive checks passed');
}finally{await browser.close();}
