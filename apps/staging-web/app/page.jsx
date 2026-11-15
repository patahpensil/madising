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
 if(is('ADM','ELIGIBILITY_CHECK'))add('DISPATCH','Cari perawat');
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
export default function TrialPage(){
 const [session,setSession]=useState(null),[role,setRole]=useState('PAT'),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const pending=useRef(false);
 async function send(operation,action,targetRole=role,quiet=false){
  if(pending.current)return;pending.current=true;setBusy(true);if(!quiet)setMessage('');
  try{
   const payload=operation==='create'?{operation}:{operation,id:session.id,token:session.tokens[targetRole],role:targetRole,action:operation==='read'?'READ':action,version:session.state.version};
   const response=await fetch('/trial-api',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});
   const result=await response.json();
   if(response.ok&&operation==='create'){setSession({id:result.id,tokens:result.tokens,state:result.state});setRole('PAT');}
   else if(response.ok&&result.state){setSession(current=>({...current,state:result.state}));setRole(targetRole);}
   else if(response.status===409&&result.state){setSession(current=>({...current,state:result.state}));setRole(targetRole);setMessage('Status berubah. Periksa langkah terbaru.');}
   else setMessage('Permintaan belum dapat diproses. Periksa koneksi atau mulai sesi baru.');
  }catch{setMessage('Koneksi terputus. Coba kembali atau mulai sesi baru.');}finally{pending.current=false;setBusy(false);}
 }
 const s=session?.state;
 useEffect(()=>{if(!session||!['PAT','NRS'].includes(role)||s?.status!=='EN_ROUTE')return;const timer=setInterval(()=>send('read',null,role,true),5000);return()=>clearInterval(timer);},[session,role]);
 const billing={NOT_ISSUED:'Belum ditagihkan',ISSUED:'Menunggu pembayaran contoh',SETTLED:'Pembayaran contoh tercatat'};
 const medication={NONE:'Belum ada resep',RECEIVED:'Menunggu validasi',ACCEPTED:'Resep contoh diterima',REJECTED:'Resep contoh ditolak',READY:'Pesanan siap',HANDED_OFF:'Diserahkan ke kurir'};
 const delivery={NONE:'Belum ada pengantaran',PENDING:'Menunggu penugasan',ASSIGNED:'Kurir ditugaskan',PICKED_UP:'Dalam pengantaran',DELIVERED:'Diterima (simulasi)'};
 const order={NONE:'Belum ada instruksi',REQUESTED:'Menunggu dokter',SIGNED:'Instruksi contoh diterbitkan',ACKNOWLEDGED:'Instruksi diterima',REVOKED:'Instruksi dicabut',EXECUTED:'Tindakan contoh tercatat'};
 return <div className="shell"><p className="notice">Lingkungan uji · Data sintetis · Tidak melayani pasien nyata</p><div className="layout"><aside><strong className="brand">MADISING</strong><p className="muted">Uji pelayanan Sidrap</p><nav aria-label="Peran simulasi">{Object.entries(roles).map(([value,label])=><button key={value} disabled={busy||!s} aria-pressed={role===value} onClick={()=>send('read',null,value)}>{label}</button>)}</nav><button className="secondary" disabled={busy} onClick={()=>send('create')}>{s?'Mulai sesi baru':'Mulai simulasi'}</button></aside><main><h1>{s?roles[role]:'Perawatan di rumah'}</h1>{!s?<section className="hero"><h2>Pesan perawat</h2><p>Uji alur pelayanan dengan backend dan penyimpanan sesi sintetis.</p><button disabled={busy} onClick={()=>send('create')}>Mulai uji coba</button></section>:<><section className="panel"><p className="muted">Status kunjungan</p><h2>{statuses[s.status]}</h2><p>{scenarios[s.scenario]}</p>{s.status==='CONFIRMED'&&role==='NRS'&&<p>Penawaran untuk kandidat contoh {s.offer}</p>}{s.status==='EN_ROUTE'&&['PAT','NRS'].includes(role)&&<div className="tracking"><p>Perjalanan contoh · bukan GPS aktual</p>{s.tracking?<><p>{s.tracking.stale?'Lokasi contoh belum diperbarui':'Titik contoh '+(s.tracking.index+1)+' dari 3'}</p><p>Jarak lurus contoh: {s.tracking.meters} m. ETA tidak tersedia.</p><small>{new Date(s.tracking.updatedAt).toLocaleTimeString('id-ID',{timeZone:'Asia/Makassar'})} WITA</small></>:<p>Belum ada titik perjalanan.</p>}<button className="secondary" disabled={busy} onClick={()=>send('read')}>Perbarui status</button></div>}{s.status==='ESCALATED_EMERGENCY'&&<p className="warning">Simulasi dihentikan. Pada keadaan darurat nyata, cari pertolongan darurat setempat.</p>}{role==='DOC'&&<p className="muted">Pesan, audio dan video ditetapkan untuk rilis pertama. Kanal nyata belum terhubung.</p>}<div className="actions">{controls(s,role).map(([event,label])=><button key={event} className={event==='CANCEL'||event==='DECLINE'||event==='REVOKE'?'secondary':'primary'} disabled={busy} aria-pressed={Object.hasOwn(scenarios,event)?s.scenario===event:undefined} onClick={()=>send('action',event)}>{label}</button>)}</div>{controls(s,role).length===0&&<p className="muted">Belum ada tindakan tersedia untuk peran ini.</p>}</section>{['PAT','ADM'].includes(role)&&<section className="panel"><h2>Tagihan kunjungan</h2><p>{billing[s.billing]}</p><p className="muted">Pembayaran setelah pelayanan selesai. Tidak ada transaksi uang nyata.</p></section>}{['PAT','PHA','CUR','ADM'].includes(role)&&<section className="panel"><h2>Obat dan pengantaran</h2><p>{medication[s.prescription]}</p><p>{delivery[s.delivery]}</p></section>}{['DOC','NRS'].includes(role)&&<><section className="panel"><h2>Instruksi klinis contoh</h2><p>{order[s.order]}</p></section>{s.consultation&&<section className="panel"><h2>Konsultasi</h2>{s.consultation.messages.map((m,i)=><p key={i}>{m.role==='NRS'?'Perawat: Permintaan penilaian contoh.':'Dokter: Permintaan contoh diterima.'}</p>)}<p className="muted">{s.consultation.call==='NONE'?'Belum ada panggilan':s.consultation.call==='REQUESTED'?'Menunggu respons':s.consultation.call==='ACCEPTED_SIMULATION'?'Permintaan diterima (tanpa sambungan media)':'Simulasi panggilan berakhir'}</p><p className="muted">Audio dan video belum terhubung ke penyedia media. Tidak ada rekaman.</p></section>}</>}</>}<p role="status" aria-live="polite">{busy?'Memproses…':message}</p><p className="muted">Peralihan peran hanya alat pengujian; bukan login. Tidak ada data, GPS, instruksi medis, resep atau pembayaran nyata.</p></main></div></div>;
}
