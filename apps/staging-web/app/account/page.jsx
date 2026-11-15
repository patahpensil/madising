'use client';
import {useEffect,useRef,useState} from 'react';
const roles={PAT:'Pasien',NRS:'Perawat',DOC:'Dokter',PHA:'Apotek',CUR:'Kurir',ADM:'Administrator'};
const statuses={DRAFT:'Belum ada pemesanan',REQUESTED:'Permintaan diterima',TRIAGE_OK:'Skrining contoh selesai',LOCATION_OK:'Alamat contoh terverifikasi',ELIGIBILITY_CHECK:'Menunggu pencarian perawat',CONFIRMED:'Mencari perawat',ASSIGNED:'Perawat ditugaskan',EN_ROUTE:'Perawat menuju lokasi',ARRIVED:'Perawat telah tiba',IN_PROGRESS:'Kunjungan berlangsung',DOCUMENTATION_PENDING:'Menunggu dokumentasi',COMPLETED:'Kunjungan selesai',ESCALATED_EMERGENCY:'Pemesanan rutin dihentikan',REJECTED_OUT_OF_AREA:'Di luar Sidrap',RESCHEDULE_REQUESTED:'Penjadwalan ulang diperlukan',CANCELLED_BY_PATIENT:'Dibatalkan'};
const scenarios={INDEPENDENT:'Asuhan mandiri',MANDATE:'Asuhan dengan mandat',EMERGENCY:'Tanda bahaya',OUTSIDE:'Alamat di luar Sidrap',NO_CAPACITY:'Tidak ada kapasitas'};
function controls(s,r){
 const a=[];const add=(event,label)=>a.push([event,label]);const is=(role,status)=>r===role&&s.status===status;
 if(is('PAT','DRAFT')){Object.entries(scenarios).forEach(([event,label])=>add(event,label));add('REQUEST','Pesan perawat');}
 if(is('PAT','REQUESTED'))add('SCREEN','Jalankan skrining contoh');
 if(is('PAT','TRIAGE_OK'))add('VERIFY_DESTINATION','Periksa alamat contoh');
 if(is('PAT','LOCATION_OK'))add('CONSENT','Setujui permintaan');
 if(r==='PAT'&&['REQUESTED','TRIAGE_OK','LOCATION_OK','ELIGIBILITY_CHECK','CONFIRMED','ASSIGNED','EN_ROUTE','RESCHEDULE_REQUESTED'].includes(s.status))add('CANCEL','Batalkan permintaan');
 if(is('ADM','CONFIRMED'))add('EXPIRE','Simulasikan penawaran kedaluwarsa');
 if(is('ADM','RESCHEDULE_REQUESTED'))add('RESCHEDULE','Simulasikan jadwal baru');
 if(is('NRS','CONFIRMED')){add('ACCEPT','Terima tugas');add('DECLINE','Tolak penawaran');}
 if(is('NRS','ASSIGNED'))add('DEPART','Mulai perjalanan');
 if(is('NRS','EN_ROUTE')){if((s.tracking?.index??-1)<2)add('LOCATION_STEP','Kirim titik perjalanan contoh');add('ARRIVE','Tiba di lokasi');}
 if(is('NRS','ARRIVED'))add('ASSESS','Catat pengkajian contoh');
 if(is('NRS','IN_PROGRESS')){
  if(!s.planned)add('PLAN','Catat diagnosis dan rencana asuhan');
  else if(s.performed)add('EVALUATE','Catat evaluasi');
  else if(s.scenario==='INDEPENDENT')add('PERFORM','Catat asuhan mandiri');
  else if(['NONE','REVOKED'].includes(s.order))add('CONSULT','Minta konsultasi dokter');
  else if(s.order==='SIGNED')add('ACKNOWLEDGE','Terima instruksi');
  else if(s.order==='ACKNOWLEDGED')add('PERFORM','Catat tindakan contoh');
 }
 if(is('NRS','DOCUMENTATION_PENDING'))add('RECONCILE','Selesaikan dokumentasi contoh');
 if(is('DOC','IN_PROGRESS')){
  if(s.order==='REQUESTED')add('SIGN','Terbitkan instruksi contoh');
  if(['SIGNED','ACKNOWLEDGED'].includes(s.order)&&!s.performed)add('REVOKE','Cabut instruksi');
  if(['ACKNOWLEDGED','EXECUTED'].includes(s.order)&&s.prescription==='NONE')add('PRESCRIBE','Terbitkan resep contoh');
 }
 if(r==='PHA'&&s.prescription==='RECEIVED'){add('PHARMACY_ACCEPT','Validasi resep contoh');add('PHARMACY_REJECT','Tolak resep');}
 if(r==='PHA'&&s.prescription==='ACCEPTED')add('PHARMACY_READY','Tandai siap');
 if(r==='ADM'&&s.delivery==='PENDING')add('COURIER_ASSIGN','Tugaskan kurir');
 if(r==='CUR'&&s.delivery==='ASSIGNED')add('PICKUP','Ambil pesanan');
 if(r==='CUR'&&s.delivery==='PICKED_UP')add('DELIVER','Konfirmasi diterima');
 if(['NRS','DOC'].includes(r)&&s.status==='IN_PROGRESS'&&s.order!=='NONE'&&s.consultation){
  const c=s.consultation;if(r==='NRS'&&c.messages.length<20)add('MESSAGE_REQUEST','Kirim pesan contoh');if(r==='DOC'&&c.messages.some(m=>m.role==='NRS')&&c.messages.length<20)add('MESSAGE_REPLY','Balas pesan contoh');if(r==='NRS'&&['NONE','ENDED'].includes(c.call)){add('REQUEST_AUDIO','Minta panggilan audio contoh');add('REQUEST_VIDEO','Minta panggilan video contoh');}if(r==='DOC'&&c.call==='REQUESTED')add('ACCEPT_CALL','Terima permintaan panggilan');if(['REQUESTED','ACCEPTED_SIMULATION'].includes(c.call))add('END_CALL','Akhiri simulasi panggilan');
 }
 if(is('ADM','COMPLETED')&&s.billing==='NOT_ISSUED')add('ISSUE_INVOICE','Terbitkan tagihan contoh');
 if(is('ADM','COMPLETED')&&s.billing==='ISSUED')add('SETTLE_INVOICE','Simulasikan pembayaran terverifikasi');
 return a;
}

export default function AccountPage(){
 const [mode,setMode]=useState('login'),[identity,setIdentity]=useState(null),[state,setState]=useState(null),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const pending=useRef(false);
 async function request(payload){
  const res=await fetch('/account-api',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});
  return {status:res.status,body:await res.json()};
 }
 async function perform(payload,quiet=false){
  if(pending.current)return;pending.current=true;setBusy(true);if(!quiet)setMessage('');
  try{
   let result=await request(payload);
   if(payload.operation==='register'){setMessage(result.status===202?'Pendaftaran diterima untuk pemeriksaan akun uji.':'Pendaftaran tidak dapat diproses.');return;}
   if(payload.operation==='logout'&&result.status===200){setIdentity(null);setState(null);return;}
   if(payload.operation==='login'&&result.status===200)result=await request({operation:'read'});
   if([200,409].includes(result.status)&&result.body.state&&roles[result.body.role]){setIdentity(result.body.role);setState(result.body.state);if(result.status===409)setMessage('Status berubah. Periksa langkah terbaru.');}
   else if([401,403].includes(result.status)){setIdentity(null);setState(null);if(!quiet)setMessage('Akun belum aktif atau kredensial tidak dapat diverifikasi.');}
   else setMessage('Layanan uji belum tersedia. Coba kembali.');
  }catch{setMessage('Koneksi terputus. Coba kembali.');}finally{pending.current=false;setBusy(false);}
 }
 useEffect(()=>{perform({operation:'read'},true);},[]);
 useEffect(()=>{if(!identity)return;const timer=setInterval(()=>perform({operation:'read'},true),10000);return()=>clearInterval(timer);},[identity]);
 function submit(event){event.preventDefault();const form=new FormData(event.currentTarget);const payload={operation:mode,username:form.get('username'),password:form.get('password'),role:form.get('role')};event.currentTarget.reset();perform(payload);}
 return <div className="shell"><p className="notice">Staging terbatas · Akun dan data sintetis saja</p><main><strong className="brand">MADISING</strong>{!identity?<section className="panel"><h1>{mode==='login'?'Masuk akun uji':'Daftar akun uji'}</h1><p className="muted">Gunakan identitas yang diawali uji-. Jangan masukkan identitas atau kata sandi layanan lain.</p><form className="account-form" onSubmit={submit}><label>Nama akun<input name="username" autoComplete="username" required pattern="uji-[a-z0-9][a-z0-9-]{2,39}" maxLength={44}/></label><label>Kata sandi<input name="password" type="password" autoComplete={mode==='login'?'current-password':'new-password'} required minLength={16} maxLength={128}/></label>{mode==='register'&&<label>Jenis akun<select name="role"><option value="PAT">Pasien</option><option value="CUR">Kurir</option></select></label>}<button className="primary" disabled={busy}>{mode==='login'?'Masuk':'Ajukan pendaftaran'}</button></form><button className="secondary" disabled={busy} onClick={()=>setMode(mode==='login'?'register':'login')}>{mode==='login'?'Daftar pasien atau kurir':'Kembali ke halaman masuk'}</button></section>:<><div className="heading"><h1>{roles[identity]}</h1><button className="secondary" disabled={busy} onClick={()=>perform({operation:'logout'})}>Keluar</button></div><section className="panel"><p className="muted">Kunjungan sintetis</p><h2>{statuses[state.status]}</h2><p>{scenarios[state.scenario]}</p><div className="actions">{controls(state,identity).map(([action,label])=><button className={action==='CANCEL'||action==='DECLINE'||action==='REVOKE'?'secondary':'primary'} key={action} disabled={busy} onClick={()=>perform({operation:'action',action,version:state.version})}>{label}</button>)}</div>{controls(state,identity).length===0&&<p className="muted">Tidak ada tindakan tersedia saat ini.</p>}<button className="secondary" disabled={busy} onClick={()=>perform({operation:'read'})}>Perbarui status</button></section></>}<p role="status" aria-live="polite">{busy?'Memproses…':message}</p><p className="muted">Layanan klinis, peta aktual, pembayaran dan RME tidak diaktifkan.</p></main></div>;
}
