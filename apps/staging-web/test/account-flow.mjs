import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {randomBytes} from 'node:crypto';
import {TrialStore} from '../../staging-api/src/trial-store.mjs';
import {AccountStore} from '../../staging-api/src/account-store.mjs';
const pool=new TrialStore(process.env.TRIAL_DATABASE_URL);
const browser=await chromium.launch({headless:true});
try{
 const auth=new AccountStore(pool.pool);const make=role=>({username:'uji-'+randomBytes(6).toString('hex'),password:randomBytes(24).toString('hex'),role});
 const patient=make('PAT'),nurse=make('NRS');const group=await auth.provision(patient);await auth.provision({...nurse,exerciseId:group.exerciseId});
 const origin='http://127.0.0.1:3000';
 const p=await browser.newContext({viewport:{width:390,height:844}}),n=await browser.newContext({viewport:{width:390,height:844}});
 const login=async(ctx,account)=>{const page=await ctx.newPage();await page.goto(origin+'/account');await page.getByLabel('Nama akun').fill(account.username);await page.getByLabel('Kata sandi').fill(account.password);await page.getByRole('button',{name:'Masuk',exact:true}).click();await page.getByRole('heading',{name:account.role==='PAT'?'Pasien':'Perawat',exact:true}).waitFor();return page;};
 const pp=await login(p,patient),np=await login(n,nurse);
 const cookies=await p.cookies();assert.equal(cookies.find(c=>c.name==='madising_trial_local')?.httpOnly,true);
 assert.equal(await pp.evaluate(()=>document.cookie.includes('madising_trial')),false);
 const click=async(page,name)=>page.getByRole('button',{name,exact:true}).click();
 await click(pp,'Pesan perawat');await click(pp,'Jalankan skrining contoh');await click(pp,'Periksa alamat contoh');await click(pp,'Setujui permintaan');
 await pp.getByRole('heading',{name:'Mencari perawat'}).waitFor();await click(np,'Perbarui status');await click(np,'Terima tugas');
 await np.getByRole('heading',{name:'Perawat ditugaskan'}).waitFor();
 assert.equal(await pp.getByRole('button',{name:'Terima tugas',exact:true}).count(),0);
 await click(pp,'Keluar');await pp.getByRole('heading',{name:'Masuk akun uji'}).waitFor();
 const res=await p.request.post(origin+'/account-api',{headers:{Origin:origin,'Content-Type':'application/json'},data:{operation:'read'}});
 assert.equal(res.status(),401);
 console.log('Independent browser account sessions, role isolation and logout passed');
}finally{await browser.close();await pool.close();}
