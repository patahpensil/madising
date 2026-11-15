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
 for(const role of ['DOC','NRS','PHA','ADM']){
  assert.equal((await post({operation:'otp_request',phone:phone(),purpose:'REGISTER',role})).status(),400);
  const direct=await ctx.request.post('http://localhost:3001/account/otp/request',{data:{phone:phone(),purpose:'REGISTER',role}});assert.equal(direct.status(),400);
 }
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
 const dialog=page.getByRole('dialog',{name:'Status kunjungan'});await dialog.waitFor();
 for(const width of [360,390,430,1280,1440]){
  await page.setViewportSize({width,height:844});
  await page.waitForTimeout(100);
  const dimensions=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,offenders:[...document.querySelectorAll('main *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>e.className).slice(0,8)}));assert.ok(dimensions.scroll<=dimensions.width,'overflow at '+width+': '+JSON.stringify(dimensions));
  const box=await dialog.boundingBox();assert.ok(box&&box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=845,'tour tooltip outside viewport '+width);
  if(shots)await page.screenshot({path:shots+'/independent-account-'+width+'.png'});
 }
 const contrast=await dialog.evaluate(el=>{
  const rgb=s=>(s.match(/[\d.]+/g)||[]).slice(0,3).map(Number);
  const lum=color=>rgb(color).map(v=>v/255).map(v=>v<=0.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
  return [...el.querySelectorAll('p,h2,button')].map(n=>{const style=getComputedStyle(n);let bg=style.backgroundColor;let parent=n.parentElement;while(bg==='rgba(0, 0, 0, 0)'&&parent){bg=getComputedStyle(parent).backgroundColor;parent=parent.parentElement;}const a=lum(style.color),b=lum(bg);return {label:n.tagName,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};});
 });
 assert.ok(contrast.every(x=>Number.isFinite(x.ratio)&&x.ratio>=4.5),'sampled tour text contrast below AA: '+JSON.stringify(contrast));
 await page.keyboard.press('Tab');
 const focus=await page.evaluate(()=>({insideDialog:!!document.activeElement?.closest('[role=dialog]'),outline:getComputedStyle(document.activeElement).outlineStyle}));
 console.log('Independent sampled tooltip contrast and keyboard focus observation:',JSON.stringify({contrast,focus}));
 await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
 console.log('Independent HTTP account lock, payload limits, pending courier, cookie and responsive checks passed');
}finally{await browser.close();}
