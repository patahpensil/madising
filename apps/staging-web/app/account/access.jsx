'use client';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {browserSupportsWebAuthn,startAuthentication,startRegistration} from '@simplewebauthn/browser';

export const APP_VERSION='0.2.0-staging';
export async function call(payload){
 const res=await fetch('/account-api',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});
 let body={};try{body=await res.json();}catch{}
 return {status:res.status,body};
}
const digitsOnly=value=>value.replace(/\D/g,'');
// Client hint only; the server normalizes and validates again.
export const plausibleWhatsApp=value=>/^(?:\+?62|0)8[1-9][0-9]{7,10}$/.test(value.replace(/[\s-]/g,''));

function OtpInput({value,onChange,disabled}){
 const refs=useRef([]);
 const chars=value.padEnd(6,' ').slice(0,6).split('');
 function set(index,char){const next=chars.map((c,i)=>i===index?char:c).join('').replace(/ +$/,'');onChange(next.replace(/ /g,''));}
 const fill=d=>{onChange(d.slice(0,6));refs.current[Math.min(d.length,6)-1]?.focus();};
 // No maxLength: browsers truncate pasted and autofilled codes to it.
 return <div className="otp" role="group" aria-label="Kode verifikasi enam digit">{chars.map((c,i)=><input key={i} ref={el=>refs.current[i]=el} inputMode="numeric" autoComplete={i===0?'one-time-code':'off'} aria-label={`Digit ${i+1}`} value={c.trim()} disabled={disabled}
  onPaste={e=>{const d=digitsOnly(e.clipboardData.getData('text'));if(d){e.preventDefault();fill(d);}}}
  onChange={e=>{const d=digitsOnly(e.target.value);if(d.length>=6){fill(d);return;}const last=d.slice(-1);set(i,last);if(last&&i<5)refs.current[i+1]?.focus();}}
  onKeyDown={e=>{if(e.key==='Backspace'&&!c.trim()&&i>0)refs.current[i-1]?.focus();}}/>)}</div>;
}

export function AuthScreen({onSignedIn}){
 const [step,setStep]=useState('phone'),[purpose,setPurpose]=useState('LOGIN'),[role,setRole]=useState('PAT');
 const [phone,setPhone]=useState(''),[code,setCode]=useState(''),[resendAt,setResendAt]=useState(0),[now,setNow]=useState(Date.now());
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[fixtureCode,setFixtureCode]=useState('');
 const [staff,setStaff]=useState(false),[passkeys,setPasskeys]=useState(false);
 useEffect(()=>{setPasskeys(browserSupportsWebAuthn());},[]);
 useEffect(()=>{if(step!=='code')return;const t=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(t);},[step]);
 const wait=Math.max(0,Math.ceil((resendAt-now)/1000));
 async function requestCode(event){
  event?.preventDefault();if(busy)return;
  if(!plausibleWhatsApp(phone)){setMessage('Masukkan nomor WhatsApp Indonesia yang valid, misalnya 0812 3456 7890.');return;}
  setBusy(true);setMessage('');
  try{
   const r=await call({operation:'otp_request',phone,purpose,role});
   if(r.status===202){setStep('code');setCode('');setFixtureCode(r.body.fixtureCode??'');setResendAt(Date.now()+r.body.resendAfterSeconds*1000);setNow(Date.now());setMessage('');}
   else if(r.status===429){setMessage(`Terlalu banyak permintaan kode. Coba lagi dalam ${r.body.retryAfterSeconds>=3600?'1 jam':r.body.retryAfterSeconds+' detik'}.`);if(step==='code')setResendAt(Date.now()+(r.body.retryAfterSeconds??60)*1000);}
   else if(r.status===503)setMessage('Pengiriman kode WhatsApp belum diaktifkan di lingkungan ini.');
   else setMessage('Permintaan tidak dapat diproses. Periksa nomor dan coba lagi.');
  }catch{setMessage('Koneksi terputus. Coba lagi.');}finally{setBusy(false);}
 }
 async function verify(event){
  event?.preventDefault();if(busy||code.length!==6)return;setBusy(true);setMessage('');
  try{
   const r=await call({operation:'otp_verify',phone,code});
   if(r.status===200)onSignedIn(r.body.role,true);
   else if(r.status===202){setStep('pending');}
   else if(r.status===401){setCode('');setMessage(r.body.attemptsRemaining>0?`Kode salah atau kedaluwarsa. Sisa percobaan: ${r.body.attemptsRemaining}.`:'Kode tidak berlaku lagi. Minta kode baru.');}
   else if(r.status===403)setMessage('Akun belum aktif. Hubungi Admin MADISING.');
   else if(r.status===409)setMessage('Nomor ini sudah terdaftar. Silakan masuk.');
   else setMessage('Verifikasi gagal diproses. Coba lagi.');
  }catch{setMessage('Koneksi terputus. Coba lagi.');}finally{setBusy(false);}
 }
 useEffect(()=>{if(code.length===6&&step==='code')verify();},[code]);// eslint-disable-line react-hooks/exhaustive-deps
 async function passkeyLogin(){
  if(busy)return;setBusy(true);setMessage('');
  try{
   const o=await call({operation:'passkey_auth_options'});
   if(o.status!==200){setMessage('Masuk dengan passkey belum tersedia.');return;}
   const response=await startAuthentication({optionsJSON:o.body.options});
   const r=await call({operation:'passkey_auth_verify',challengeId:o.body.challengeId,response});
   if(r.status===200)onSignedIn(r.body.role,false);else setMessage('Passkey tidak dapat diverifikasi. Masuk dengan WhatsApp.');
  }catch{setMessage('Masuk dengan passkey dibatalkan.');}finally{setBusy(false);}
 }
 if(staff)return <StaffLogin onBack={()=>setStaff(false)} onSignedIn={onSignedIn}/>;
 if(step==='pending')return <section className="panel"><h1>Pendaftaran kurir diterima</h1><p>Nomor WhatsApp Anda sudah terverifikasi. Akun kurir aktif setelah pemeriksaan Admin.</p><button className="secondary" onClick={()=>{setStep('phone');setPurpose('LOGIN');}}>Kembali ke halaman masuk</button></section>;
 if(step==='code')return <section className="panel" aria-labelledby="otp-title">
  <button className="link" onClick={()=>{setStep('phone');setMessage('');}}>← Ubah nomor</button>
  <h1 id="otp-title">Masukkan kode verifikasi</h1>
  <p className="muted">Kode 6 digit dikirim melalui WhatsApp ke <strong>{phone}</strong>. Berlaku 5 menit.</p>
  {fixtureCode&&<p className="fixture">Kode uji (hanya lingkungan uji tertutup): <strong>{fixtureCode}</strong></p>}
  <form onSubmit={verify} className="account-form"><OtpInput value={code} onChange={setCode} disabled={busy}/>
   <button className="primary" disabled={busy||code.length!==6}>{busy?'Memverifikasi…':'Verifikasi'}</button></form>
  <button className="secondary" disabled={busy||wait>0} onClick={requestCode}>{wait>0?`Kirim ulang dalam ${wait} detik`:'Kirim ulang kode'}</button>
  <p role="status" aria-live="polite" className="form-message">{message}</p></section>;
 return <section className="panel" aria-labelledby="auth-title">
  <div className="segmented" role="tablist" aria-label="Jenis akses">{[['LOGIN','Masuk'],['REGISTER','Daftar']].map(([v,l])=><button key={v} role="tab" aria-selected={purpose===v} onClick={()=>{setPurpose(v);setMessage('');}}>{l}</button>)}</div>
  <h1 id="auth-title">{purpose==='LOGIN'?'Masuk ke MADISING':'Daftar akun baru'}</h1>
  <p className="muted">{purpose==='LOGIN'?'Gunakan nomor WhatsApp yang terdaftar.':'Pendaftaran mandiri hanya untuk pasien dan kurir. Akun dokter, perawat, apotek dan Admin dibuat oleh Admin.'}</p>
  <form className="account-form" onSubmit={requestCode}>
   <label>Nomor WhatsApp<input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0812 3456 7890" value={phone} onChange={e=>setPhone(e.target.value.slice(0,20))} required/></label>
   {purpose==='REGISTER'&&<fieldset className="choice"><legend>Daftar sebagai</legend>{[['PAT','Pasien'],['CUR','Kurir']].map(([v,l])=><label key={v}><input type="radio" name="role" value={v} checked={role===v} onChange={()=>setRole(v)}/>{l}</label>)}</fieldset>}
   <button className="primary" disabled={busy}>{busy?'Mengirim…':'Kirim kode WhatsApp'}</button>
  </form>
  {purpose==='LOGIN'&&passkeys&&<button className="secondary" disabled={busy} onClick={passkeyLogin}>Masuk dengan passkey</button>}
  {purpose==='LOGIN'&&<button className="link" onClick={()=>setStaff(true)}>Masuk akun petugas uji</button>}
  <p role="status" aria-live="polite" className="form-message">{message}</p>
 </section>;
}

function StaffLogin({onBack,onSignedIn}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function submit(event){
  event.preventDefault();const form=new FormData(event.currentTarget);event.currentTarget.reset();setBusy(true);setMessage('');
  try{const r=await call({operation:'login',username:form.get('username'),password:form.get('password')});if(r.status===200)onSignedIn(r.body.role,false);else setMessage('Akun belum aktif atau kredensial tidak dapat diverifikasi.');}
  catch{setMessage('Koneksi terputus. Coba lagi.');}finally{setBusy(false);}
 }
 return <section className="panel"><button className="link" onClick={onBack}>← Kembali</button><h1>Masuk akun petugas uji</h1><p className="muted">Untuk akun yang dibuat operator staging. Gunakan identitas yang diawali uji-.</p>
  <form className="account-form" onSubmit={submit}><label>Nama akun<input name="username" autoComplete="username" required pattern="uji-[a-z0-9][a-z0-9-]{2,39}" maxLength={44}/></label><label>Kata sandi<input name="password" type="password" autoComplete="current-password" required minLength={16} maxLength={128}/></label><button className="primary" disabled={busy}>Masuk</button></form>
  <p role="status" aria-live="polite" className="form-message">{message}</p></section>;
}

export async function enrollPasskey(){
 const o=await call({operation:'passkey_register_options'});
 if(o.status===409)return 'Jumlah passkey sudah mencapai batas lima perangkat.';
 if(o.status!==200)return 'Passkey belum dapat diaktifkan saat ini.';
 let response;try{response=await startRegistration({optionsJSON:o.body.options});}catch{return 'Aktivasi passkey dibatalkan.';}
 const r=await call({operation:'passkey_register_verify',challengeId:o.body.challengeId,response});
 return r.status===201?null:'Passkey tidak dapat diverifikasi. Coba lagi.';
}

export function PasskeyOffer({onDone}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const ref=useRef(null);useEffect(()=>{ref.current?.focus();},[]);
 async function later(){setBusy(true);await call({operation:'preferences',patch:{passkeyOfferDismissed:true}}).catch(()=>{});onDone();}
 async function enable(){setBusy(true);setMessage('');const error=await enrollPasskey().catch(()=>'Passkey belum dapat diaktifkan saat ini.');setBusy(false);if(error)setMessage(error);else onDone();}
 return <div className="sheet-backdrop"><div className="sheet" role="dialog" aria-modal="true" aria-labelledby="passkey-title" tabIndex={-1} ref={ref}>
  <h2 id="passkey-title">Lindungi akun dengan passkey</h2>
  <ul className="plain"><li>Masuk memakai sidik jari, wajah atau kunci layar perangkat ini.</li><li>Tidak perlu menunggu kode WhatsApp setiap kali masuk.</li><li>Data biometrik tetap di perangkat Anda dan tidak dikirim ke MADISING.</li></ul>
  <p className="muted">Anda dapat mengaktifkannya nanti dari Pengaturan.</p>
  <div className="sheet-actions"><button className="secondary" disabled={busy} onClick={later}>Nanti saja</button><button className="primary" disabled={busy} onClick={enable}>{busy?'Menunggu perangkat…':'Aktifkan passkey'}</button></div>
  <p role="status" aria-live="polite" className="form-message">{message}</p></div></div>;
}

export function Tour({steps,onFinish}){
 const [index,setIndex]=useState(0),[rect,setRect]=useState(null);
 const tooltip=useRef(null);
 const visible=steps.filter(s=>typeof document!=='undefined'&&document.querySelector(`[data-tour="${s.target}"]`));
 const current=visible[index];
 useLayoutEffect(()=>{
  if(!current)return;
  const el=document.querySelector(`[data-tour="${current.target}"]`);
  el?.scrollIntoView({block:'center',behavior:'instant'});
  const measure=()=>{const r=el?.getBoundingClientRect();setRect(r?{top:r.top-6,left:r.left-6,width:r.width+12,height:r.height+12}:null);};
  measure();window.addEventListener('resize',measure);window.addEventListener('scroll',measure,true);
  tooltip.current?.focus();
  return()=>{window.removeEventListener('resize',measure);window.removeEventListener('scroll',measure,true);};
 },[current]);
 useEffect(()=>{const key=e=>{if(e.key==='Escape')onFinish();};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[onFinish]);
 useEffect(()=>{if(steps.length&&visible.length===0)onFinish();},[visible.length]);// eslint-disable-line react-hooks/exhaustive-deps
 if(!current||!rect)return null;
 const last=index===visible.length-1;
 // Prefer below, then above; tall targets pin the tip to the bottom edge so it never clips.
 const room=230,bottomEdge=rect.top+rect.height;
 const style=bottomEdge+room<window.innerHeight?{top:bottomEdge+12}:rect.top>room?{bottom:window.innerHeight-rect.top+12}:{bottom:16};
 return <div className="tour" aria-live="polite">
  <div className="tour-spotlight" style={rect}/>
  <div className="tour-tip" role="dialog" aria-modal="true" aria-labelledby="tour-title" tabIndex={-1} ref={tooltip} style={style}>
   <p className="caption">Langkah {index+1} dari {visible.length}</p><h2 id="tour-title">{current.title}</h2><p>{current.body}</p>
   <div className="sheet-actions">{!last&&<button className="secondary" onClick={onFinish}>Lewati</button>}<button className="primary" onClick={()=>last?onFinish():setIndex(index+1)}>{last?'Selesai':'Lanjut'}</button></div>
  </div></div>;
}

const TAG_LABELS={TEPAT_WAKTU:'Tepat waktu',PENJELASAN_JELAS:'Penjelasan jelas',RAMAH:'Ramah',TELITI:'Teliti'};
const initials=name=>name.split(/\s+/).filter(Boolean).slice(-2).map(w=>w[0]).join('').toUpperCase();
export function CareTeam({active}){
 const [team,setTeam]=useState(null),[error,setError]=useState('');
 async function load(){try{const r=await call({operation:'care_team'});if(r.status===200){setTeam(r.body.team);setError('');}else setError('Profil petugas belum dapat dimuat.');}catch{setError('Koneksi terputus.');}}
 useEffect(()=>{if(active)load();},[active]);
 if(error)return <section className="panel"><p>{error}</p><button className="secondary" onClick={load}>Coba lagi</button></section>;
 if(!team)return <section className="panel"><p className="muted">Memuat profil petugas…</p></section>;
 if(team.length===0)return <section className="panel"><h2>Belum ada petugas</h2><p className="muted">Profil perawat tampil setelah penugasan dikonfirmasi. Profil dokter tampil ketika dokter terlibat dalam pelayanan Anda.</p></section>;
 return <div className="stack">{team.map(p=><ProfessionalCard key={p.key} profile={p} onReviewed={load}/>)}</div>;
}

function ProfessionalCard({profile,onReviewed}){
 const [rating,setRating]=useState(0),[tags,setTags]=useState([]),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const profession=profile.profession==='DOCTOR'?'Dokter':'Perawat';
 async function submit(){if(!rating)return;setBusy(true);setMessage('');try{const r=await call({operation:'review',professionalKey:profile.key,rating,tags});if(r.status===201)onReviewed();else setMessage('Ulasan tidak dapat dikirim.');}catch{setMessage('Koneksi terputus.');}finally{setBusy(false);}}
 return <article className="panel profile" aria-labelledby={`p-${profile.key}`}>
  <div className="profile-head"><div className="avatar" aria-hidden="true">{initials(profile.displayName)}</div><div><h2 id={`p-${profile.key}`}>{profile.displayName}{profile.title?`, ${profile.title}`:''}</h2><p className="muted">{profession} · {profile.competencies.join(' · ')}</p>{profile.synthetic&&<span className="badge">Data uji · belum diverifikasi</span>}</div></div>
  {!profile.photo&&<p className="caption">Foto resmi belum tersedia.</p>}
  <dl className="facts"><div><dt>Pengalaman</dt><dd>{profile.experienceYears} tahun</dd></div><div><dt>Pendidikan</dt><dd>{profile.education.map(e=>`${e.program}, ${e.year}`).join('; ')}</dd></div><div><dt>Tempat praktik</dt><dd>{profile.practiceSite}</dd></div><div><dt>Nomor STR</dt><dd>{profile.registrationNumber??'Tidak ditampilkan pada data uji'}</dd></div></dl>
  <div className="rating">{profile.rating.total>0?<><p><strong>{profile.rating.average.toFixed(1)}</strong> dari 5 · {profile.rating.total} ulasan pelayanan selesai</p><ul className="chips">{Object.entries(profile.rating.tags).map(([t,n])=><li key={t}>{TAG_LABELS[t]} ({n})</li>)}</ul></>:<p className="muted">Belum ada ulasan dari pelayanan yang selesai.</p>}</div>
  {profile.canReview&&<div className="review"><h3>Beri ulasan</h3><div className="stars" role="radiogroup" aria-label="Nilai 1 sampai 5">{[1,2,3,4,5].map(n=><button key={n} role="radio" aria-checked={rating===n} aria-label={`${n} bintang`} onClick={()=>setRating(n)}>{n<=rating?'★':'☆'}</button>)}</div>
   <div className="chips" role="group" aria-label="Yang disukai">{Object.entries(TAG_LABELS).map(([t,l])=><button key={t} aria-pressed={tags.includes(t)} onClick={()=>setTags(tags.includes(t)?tags.filter(x=>x!==t):[...tags,t])}>{l}</button>)}</div>
   <button className="primary" disabled={busy||!rating} onClick={submit}>Kirim ulasan</button><p role="status" className="form-message">{message}</p></div>}
 </article>;
}

const ITEMS=[['help','Pusat Bantuan'],['language','Bahasa Aplikasi'],['payment','Metode Pembayaran'],['address','Alamat Tersimpan'],['passkey','Masuk dengan Biometrik'],['security','Pengaturan dan Keamanan Akun'],['notifications','Pengaturan Notifikasi'],['guide','Panduan Penggunaan']];
export function Settings({onReplayTour,onLogout,busy}){
 const [open,setOpen]=useState(null),[prefs,setPrefs]=useState(null),[keys,setKeys]=useState([]),[message,setMessage]=useState('');
 async function load(){const r=await call({operation:'preferences'}).catch(()=>null);if(r?.status===200)setPrefs(r.body);const k=await call({operation:'passkeys'}).catch(()=>null);if(k?.status===200)setKeys(k.body.passkeys);}
 useEffect(()=>{load();},[]);
 async function patch(p){setMessage('');const before=prefs;if(prefs)setPrefs({...prefs,preferences:{...prefs.preferences,...p}});const r=await call({operation:'preferences',patch:p}).catch(()=>null);if(r?.status===200)setPrefs(r.body);else{setPrefs(before);setMessage('Perubahan belum tersimpan. Coba lagi.');}}
 async function addKey(){setMessage('');const e=await enrollPasskey().catch(()=>'Passkey belum dapat diaktifkan.');setMessage(e??'Passkey aktif di perangkat ini.');load();}
 async function removeKey(id){const r=await call({operation:'passkeys',remove:id}).catch(()=>null);setMessage(r?.status===200?'Passkey dihapus.':'Passkey tidak dapat dihapus.');load();}
 const detail={
  help:<><p>Untuk keadaan gawat darurat, hubungi 119 atau datang ke IGD terdekat. Jangan menunggu balasan melalui aplikasi.</p><p className="muted">Kanal bantuan resmi MADISING belum diaktifkan pada lingkungan uji.</p></>,
  language:<><div className="segmented" role="radiogroup" aria-label="Bahasa">{[['id','Indonesia'],['en','English']].map(([v,l])=><button key={v} role="radio" aria-checked={prefs?.preferences.language===v} onClick={()=>patch({language:v})}>{l}</button>)}</div>{prefs?.preferences.language==='en'&&<p className="muted">Antarmuka bahasa Inggris belum tersedia. Pilihan disimpan dan tampilan tetap berbahasa Indonesia.</p>}</>,
  payment:<p>Pembayaran dilakukan setelah pelayanan selesai berdasarkan tagihan rinci. Metode pembayaran belum diaktifkan di lingkungan uji.</p>,
  address:<p>Alamat kunjungan dimasukkan saat membuat pesanan. Penyimpanan alamat belum diaktifkan di lingkungan uji.</p>,
  passkey:<>{keys.length===0?<p className="muted">Belum ada passkey terdaftar.</p>:<ul className="plain">{keys.map(k=><li key={k.id} className="row"><span>Passkey ditambahkan {new Date(k.createdAt).toLocaleDateString('id-ID')}{k.lastUsedAt?` · terakhir dipakai ${new Date(k.lastUsedAt).toLocaleDateString('id-ID')}`:''}</span><button className="secondary" onClick={()=>removeKey(k.id)}>Hapus</button></li>)}</ul>}<button className="primary" onClick={addKey}>Tambah passkey di perangkat ini</button><p className="muted">MADISING hanya menyimpan kunci publik. Sidik jari, wajah dan kunci layar diproses oleh perangkat Anda.</p></>,
  security:<><dl className="facts"><div><dt>Akun</dt><dd>{prefs?.account.label??'—'}</dd></div><div><dt>Metode masuk</dt><dd>{prefs?.account.method==='WHATSAPP'?'Kode WhatsApp':'Kata sandi akun uji'}{prefs?.passkeyCount?' + passkey':''}</dd></div><div><dt>Sesi</dt><dd>Berakhir setelah 30 menit tidak aktif atau 2 jam sejak masuk. Masuk di perangkat lain mengakhiri sesi ini.</dd></div></dl></>,
  notifications:<>{[['notifyService','Status pelayanan'],['notifyReminder','Pengingat jadwal']].map(([k,l])=><label key={k} className="toggle"><input type="checkbox" checked={Boolean(prefs?.preferences[k])} onChange={e=>patch({[k]:e.target.checked})}/>{l}</label>)}<p className="muted">Notifikasi tidak memuat informasi kesehatan. Pengiriman notifikasi belum diaktifkan di lingkungan uji.</p></>,
 };
 return <section className="panel settings" aria-labelledby="settings-title"><h1 id="settings-title">Pengaturan</h1>
  <ul className="menu">{ITEMS.map(([key,label])=><li key={key}>{key==='guide'?<button onClick={onReplayTour}><span>{label}</span><span aria-hidden="true">›</span></button>:<><button aria-expanded={open===key} onClick={()=>setOpen(open===key?null:key)}><span>{label}</span><span aria-hidden="true">{open===key?'⌄':'›'}</span></button>{open===key&&<div className="menu-detail">{detail[key]}</div>}</>}</li>)}</ul>
  <p role="status" aria-live="polite" className="form-message">{message}</p>
  <p className="caption version">Versi aplikasi {APP_VERSION} · data sintetis</p>
  <button className="danger" disabled={busy} onClick={onLogout}>Keluar dari akun</button></section>;
}
