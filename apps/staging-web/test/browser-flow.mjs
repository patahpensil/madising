import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
try {
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',error=>errors.push(String(error)));
  await page.goto('http://127.0.0.1:3000/');
  const click=async(name)=>{await page.getByRole('button',{name,exact:true}).click({timeout:15000});};
  const select=async(name)=>{await page.getByRole('navigation',{name:'Peran simulasi'}).getByRole('button',{name,exact:true}).click();await page.getByRole('heading',{name,exact:true,level:1}).waitFor();};
  await click('Mulai uji coba');
  await click('Pesan perawat');await click('Jalankan skrining contoh');await click('Periksa alamat contoh');await click('Setujui permintaan');
  await select('Administrator');await click('Cari perawat');
  await select('Perawat');await click('Terima tugas');await click('Mulai perjalanan');await click('Kirim titik perjalanan contoh');
  await select('Pasien');await page.getByText('Titik contoh 1 dari 3',{exact:true}).waitFor();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile horizontal overflow');
  await select('Perawat');await click('Tiba di lokasi');await click('Catat pengkajian contoh');await click('Catat diagnosis dan rencana asuhan');await click('Catat asuhan mandiri');await click('Catat evaluasi');await click('Selesaikan dokumentasi contoh');
  await select('Administrator');await click('Terbitkan tagihan contoh');await click('Simulasikan pembayaran terverifikasi');
  await select('Pasien');await page.getByText('Pembayaran contoh tercatat',{exact:true}).waitFor();
  await page.setViewportSize({width:1440,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'desktop horizontal overflow');
  assert.deepEqual(errors,[]);
  console.log('Chromium mobile/desktop synthetic journey passed');
}finally{await browser.close();}
