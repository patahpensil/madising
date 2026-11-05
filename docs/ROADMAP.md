# MADISING — Roadmap R0–R3 (PRD V1.4.1, proposed)

Mengacu PRD §16 dan keputusan LOCK V1.3.6; **V1.4.1 menunggu persetujuan OPEN-12**. Tidak ada data pasien nyata sampai seluruh gerbang keamanan/klinis dipenuhi.

## R0 — Spesifikasi dan fondasi nonklinis

- [x] Repository connection, private access and initial branch.
- [x] Foundation: web/static, API/health, Flutter skeleton, CI.
- [ ] Persetujuan PRD V1.4.1 (OPEN-12) dalam kapasitas Owner dan Dokter PJ Klinis; verifikasi kesetaraan LOCK V1.3.6.
- [ ] Putuskan **OPEN-04** (API/prosedur RME, klasifikasi data klinis, PJ RME), **OPEN-13** (stack Node vs NestJS/Next.js), **OPEN-15** (offline perawat), **OPEN-16** (kurir PWA vs Flutter), **OPEN-17** (cakupan R1 dan pengujian), dan **OPEN-18** (PJ data/privasi dan evaluasi Pejabat PDP) **sebelum keluar R0**.
- [ ] Rancang matriks hak akses enam dashboard, akun terpisah Owner/DOC/Admin/Vendor, pilihan scope CCO (belum aktif), dan pengujian negatif.
- [ ] Periksa kelayakan provider OIDC, koneksi database, boundary RME dan threat model; siapkan staging data sintetis, backup/restore serta persetujuan perubahan.
- [ ] Putuskan model akses profesi nonperawat (**OPEN-14**) sebelum mengaktifkan workflow profesi terkait; jangan menganggap role NRS berlaku.
- [ ] Lakukan review struktur data, izin layanan, SOP awal, privasi dan keselamatan tanpa mengaktifkan fitur klinis produksi.

## R1 — Core Homecare pilot

- [ ] Registrasi pasien/kurir, provisioning Admin untuk dokter/perawat/apotek, MFA, audit, scope akun dan consent.
- [ ] Dashboard Pasien/Perawat/Dokter/Admin dibatasi peran; shell dashboard Apotek/Kurir tetap ada, transaksi menunggu kesiapan R2.
- [ ] Katalog sembilan layanan dengan status dan sign-off aktivasi Owner sebagai PJ Klinis.
- [ ] Triase, validasi tujuan Sidrap, booking, slot/capacity reservation, assignment atomik tenaga eligible; ADMIN_REVIEW dengan CCO hanya jika diberikan Owner.
- [ ] Kunjungan perawat, konsultasi dokter, dokumentasi aman dengan consent, **integrasi RME existing di R1** atau prosedur bridging yang disahkan sesuai hasil OPEN-04.
- [ ] Staging, UAT enam peran, pentest relevan, penilaian privasi/DPIA sesuai kebutuhan, backup/restore dan sign-off klinis/keamanan sebelum pasien nyata.
- [ ] Laporan operasional dasar, penanganan insiden, monitoring dan fungsi maintenance Vendor terkendali sesuai kebutuhan R1.
- [ ] Peninjauan publikasi Android/iOS dan go-live manual setelah persetujuan Owner/PJ Klinis dan gerbang keamanan terpenuhi.

## R2 — Apotek dan kurir

- [ ] Resep dokter sah, validasi apoteker dan transaksi apotek mitra.
- [ ] Penugasan kurir terverifikasi, pengantaran, proof of delivery, retur dan rekonsiliasi; pilihan kanal berdasarkan OPEN-16.
- [ ] UAT isolasi mitra/tenant, keamanan pemrosesan data obat dan idempotensi pembayaran/pengiriman.

## R3 — Layanan khusus dan optimasi

- [ ] Aktivasi profesi khusus (fisioterapis, bidan, terapis, petugas lab, pramurukti) sesuai keputusan OPEN-14, izin, kompetensi, SOP dan sign-off Owner.
- [ ] Paket perawatan ulang sesuai indikasi klinis, laporan KPI, optimasi jadwal dan ETA bila dibutuhkan.

**Aturan rilis:** Tidak ada workflow klinis/PHI nyata tanpa gerbang persetujuan; Vendor mengeksekusi operasi teknis produksi hanya setelah approval Owner.
