'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {AuthScreen,CareTeam,PasskeyOffer,Settings,Tour,call} from './access.jsx';
import {browserSupportsWebAuthn} from '@simplewebauthn/browser';
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

const TOUR={
 PAT:[{target:'status',title:'Status kunjungan',body:'Pantau perkembangan permintaan Anda di sini, dari pencarian perawat sampai kunjungan selesai.'},{target:'actions',title:'Langkah berikutnya',body:'Tombol di bagian ini hanya menampilkan tindakan yang boleh Anda lakukan pada tahap saat ini.'},{target:'tab-team',title:'Tim perawatan',body:'Lihat profil perawat setelah penugasan dikonfirmasi dan profil dokter ketika dokter terlibat.'},{target:'tab-settings',title:'Pengaturan',body:'Kelola passkey, notifikasi dan buka kembali panduan ini kapan saja.'}],
 default:[{target:'status',title:'Status pelayanan',body:'Status terbaru dari kunjungan yang ditugaskan kepada Anda.'},{target:'actions',title:'Tindakan sesuai peran',body:'Hanya tindakan yang sesuai kewenangan peran Anda yang tersedia.'},{target:'tab-settings',title:'Pengaturan',body:'Kelola keamanan akun dan buka kembali panduan ini.'}],
};
export default function AccountPage(){
 const [identity,setIdentity]=useState(null),[state,setState]=useState(null),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const [tab,setTab]=useState('home'),[overlay,setOverlay]=useState(null);
 const pending=useRef(false);
 async function perform(payload,quiet=false){
  if(pending.current)return;pending.current=true;setBusy(true);if(!quiet)setMessage('');
  try{
   const result=await call(payload);
   if(payload.operation==='logout'&&result.status===200){setIdentity(null);setState(null);setTab('home');setOverlay(null);return;}
   if([200,409].includes(result.status)&&result.body.state&&roles[result.body.role]){setIdentity(result.body.role);setState(result.body.state);if(result.status===409)setMessage('Status berubah. Periksa langkah terbaru.');}
   else if([401,403].includes(result.status)){setIdentity(null);setState(null);if(!quiet)setMessage('Sesi berakhir. Silakan masuk kembali.');}
   else setMessage('Layanan uji belum tersedia. Coba kembali.');
  }catch{setMessage('Koneksi terputus. Coba kembali.');}finally{pending.current=false;setBusy(false);}
 }
 // After sign-in: offer a passkey once, then the first-run guide until completed.
 const nextOverlay=useCallback(async(afterOtp)=>{
  const r=await call({operation:'preferences'}).catch(()=>null);
  if(r?.status!==200)return;
  const p=r.body.preferences;
  if(afterOtp&&r.body.passkeyCount===0&&!p.passkeyOfferDismissed&&browserSupportsWebAuthn())setOverlay('passkey');
  else if(!p.onboardingCompleted)setOverlay('tour');
  else setOverlay(null);
 },[]);
 async function signedIn(role,afterOtp){await perform({operation:'read'});nextOverlay(afterOtp);}
 async function finishTour(){setOverlay(null);await call({operation:'preferences',patch:{onboardingCompleted:true}}).catch(()=>{});}
 useEffect(()=>{perform({operation:'read'},true).then(()=>nextOverlay(false));},[nextOverlay]);
 useEffect(()=>{if(!identity)return;const timer=setInterval(()=>perform({operation:'read'},true),10000);return()=>clearInterval(timer);},[identity]);
 const tabs=[['home','Beranda'],...(identity==='PAT'?[['team','Tim perawatan']]:[]),['settings','Pengaturan']];
 return <div className="shell"><p className="notice">Staging terbatas · Akun dan data sintetis saja</p><main><strong className="brand">MADISING</strong>
  {!identity?<AuthScreen onSignedIn={signedIn}/>:<>
   <div className="heading"><h1>{roles[identity]}</h1></div>
   {tab==='home'&&<section className="panel" data-tour="status"><p className="muted">Kunjungan sintetis</p><h2>{statuses[state.status]}</h2><p>{scenarios[state.scenario]}</p><div className="actions" data-tour="actions">{controls(state,identity).map(([action,label])=><button className={action==='CANCEL'||action==='DECLINE'||action==='REVOKE'?'secondary':'primary'} key={action} disabled={busy} onClick={()=>perform({operation:'action',action,version:state.version})}>{label}</button>)}{controls(state,identity).length===0&&<p className="muted">Tidak ada tindakan tersedia saat ini.</p>}</div><button className="secondary" disabled={busy} onClick={()=>perform({operation:'read'})}>Perbarui status</button></section>}
   {tab==='team'&&<CareTeam active={tab==='team'}/>}
   {tab==='settings'&&<Settings busy={busy} onReplayTour={()=>{setTab('home');setOverlay('tour');}} onLogout={()=>perform({operation:'logout'})}/>}
   <nav className="tabbar" aria-label="Navigasi utama">{tabs.map(([key,label])=><button key={key} data-tour={'tab-'+key} aria-current={tab===key?'page':undefined} onClick={()=>setTab(key)}>{label}</button>)}</nav>
  </>}
  <p role="status" aria-live="polite">{busy?'Memproses…':message}</p><p className="muted">Layanan klinis, peta aktual, pembayaran dan RME tidak diaktifkan.</p></main>
  {identity&&overlay==='passkey'&&<PasskeyOffer onDone={()=>nextOverlay(false)}/>}
  {identity&&overlay==='tour'&&tab==='home'&&<Tour steps={TOUR[identity]??TOUR.default} onFinish={finishTour}/>}
 </div>;
}
