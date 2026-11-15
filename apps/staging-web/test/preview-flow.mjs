import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(pathToFileURL(resolve('apps/web/trial/index.html')).href);
 await page.getByText('Pratinjau UI 02',{exact:true}).waitFor();
 const click=async(name)=>page.getByRole('button',{name,exact:true}).click();
 const enter=async(role)=>{await page.locator('[data-enter="'+role+'"]').click();};
 const exit=()=>click('Keluar dari akun uji');
 await enter('PAT');assert.equal(await page.locator('.location-bar').count(),1);assert.equal(await page.locator('.catalog .service').count(),9);await click('Mulai pemesanan');await click('Jalankan skrining contoh');await click('Periksa alamat contoh');await click('Setujui dan cari perawat');
 await page.getByText('Mencari perawat',{exact:true}).waitFor();await exit();await enter('NRS');assert.equal(await page.locator('.readiness').count(),1);await click('Terima tugas');await click('Mulai perjalanan');await click('Kirim titik perjalanan contoh');
 await exit();await enter('PAT');await page.getByText(/Titik contoh 1 dari 3/).waitFor();await exit();await enter('NRS');await click('Tiba di lokasi');await click('Catat pengkajian contoh');await click('Catat diagnosis dan rencana asuhan');await click('Catat asuhan mandiri');await click('Catat evaluasi');await click('Selesaikan dokumentasi contoh');await exit();await enter('ADM');await click('Terbitkan tagihan contoh');await click('Simulasikan pembayaran terverifikasi');await exit();await enter('PAT');await page.getByText('Pembayaran contoh tercatat',{exact:true}).waitFor();await exit();
 for(const width of [360,390,768,1440]){await page.setViewportSize({width,height:900});for(const role of ['PAT','NRS','DOC','PHA','CUR','ADM']){await enter(role);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),role+' overflow at '+width);await exit();}}
 await click('Ulangi skenario');await enter('PAT');await page.locator('[data-action="MANDATE"]').click();await click('Mulai pemesanan');await click('Jalankan skrining contoh');await click('Periksa alamat contoh');await click('Setujui dan cari perawat');await exit();await enter('NRS');await click('Terima tugas');await click('Mulai perjalanan');await click('Tiba di lokasi');await click('Catat pengkajian contoh');await click('Catat diagnosis dan rencana asuhan');await click('Minta konsultasi dokter');await click('Kirim pesan contoh');await click('Minta video');await exit();await enter('DOC');assert.equal(await page.locator('.clinical-shell').count(),1);await click('Balas pesan contoh');await click('Terima permintaan panggilan');await click('Akhiri simulasi panggilan');await click('Terbitkan instruksi dan mandat contoh');await exit();await enter('NRS');await click('Terima instruksi');await exit();await enter('DOC');await click('Terbitkan resep contoh');await exit();await enter('NRS');await click('Catat tindakan contoh');await click('Catat evaluasi');await click('Selesaikan dokumentasi contoh');await exit();await enter('PHA');await click('Validasi resep contoh');await click('Tandai pesanan siap');await exit();await enter('ADM');assert.equal(await page.locator('.ops-summary').count(),1);await click('Tugaskan kurir contoh');await exit();await enter('CUR');await click('Ambil pesanan');await click('Konfirmasi diterima');await exit();await enter('PAT');await page.getByText('Diterima',{exact:true}).waitFor();await exit();
 assert.deepEqual(errors,[]);console.log('Static six-role journey and responsive viewport checks passed');
}finally{await browser.close();}
