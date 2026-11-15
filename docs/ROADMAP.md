# MADISING — Roadmap R0–R3 (PRD V1.4.2, proposed)

Mengacu PRD §16 dan keputusan LOCK V1.3.6; **V1.4.2 menunggu gerbang persetujuan yang relevan termasuk OPEN-12**. Tidak ada data pasien nyata sampai seluruh gerbang keamanan/klinis dipenuhi.

## R0 — Spesifikasi dan fondasi nonklinis

- [x] Repository connection, private access and initial branch.
- [x] Foundation: web/static, API/health, Flutter skeleton, CI.
- [ ] Patah Pensil mengesahkan baseline teknis PRD; substansi pelayanan, penggunaan data, dan perubahan LOCK historis yang mengikat MADISING diselesaikan pada OPEN-12 bersama pihak MADISING yang berwenang. Owner tidak perlu mengesahkan JSON/CI/CD.
- [ ] **Prioritas R0 SATUSEHAT (OPEN-04):** Patah Pensil verifikasi fasyankes, RME existing, opsi API/bridging sah versus jalur langsung yang berhak, use case FHIR, dan kelayakan Sandbox; uji mock dengan data sintetis bila belum ada akses. Tidak mengklaim Production terhubung.
- [ ] Putuskan **OPEN-04**, **OPEN-13** (stack diputuskan Patah Pensil), **OPEN-15** (offline perawat), **OPEN-16** (kurir), **OPEN-17** (cakupan R1 dan pengujian), dan **OPEN-18** (penanggung jawab privasi serta hubungan pengendali–pemroses) **sebelum keluar R0**.
- [ ] Tutup OPEN-19 (matriks kewenangan, mandat, SOP) dan OPEN-20 (penawaran, lokasi, privasi, ETA), serta review prototipe V1.4.2 dengan data sintetis.
- [ ] Rancang matriks hak akses enam dashboard, akun terpisah Owner/DOC/Admin/Vendor, pilihan scope CCO (belum aktif), dan pengujian negatif.
- [ ] Periksa kelayakan provider OIDC, koneksi database, boundary RME dan threat model; siapkan staging data sintetis, backup/restore serta persetujuan perubahan.
- [ ] Putuskan model akses profesi nonperawat (**OPEN-14**) sebelum mengaktifkan workflow profesi terkait; jangan menganggap role NRS berlaku.
- [ ] Lakukan review struktur data, izin layanan, SOP awal, privasi dan keselamatan tanpa mengaktifkan fitur klinis produksi.

## R1 — Core Homecare pilot

- [ ] Registrasi pasien/kurir, provisioning Admin untuk dokter/perawat/apotek, MFA, audit, scope akun dan consent.
- [ ] Dashboard Pasien/Perawat/Dokter/Admin dibatasi peran; shell dashboard Apotek/Kurir tetap ada, transaksi menunggu kesiapan R2.
- [ ] Katalog sembilan layanan dengan status dan sign-off aktivasi Owner sebagai PJ Klinis.
- [ ] Triase, validasi tujuan Sidrap, booking, slot/capacity reservation, assignment atomik tenaga eligible; ADMIN_REVIEW dengan CCO hanya jika diberikan Owner.
- [ ] Penawaran/timeout/reassignment, tracking EN_ROUTE, fallback lokasi, validasi CLA-01..06, UAT-34..47.
- [ ] Kunjungan perawat, asuhan lengkap, konsultasi dokter, instruksi/mandat sah, evaluasi dan dokumentasi aman dengan consent, **integrasi RME existing di R1** atau prosedur bridging yang disahkan sesuai hasil OPEN-04; implementasi adapter SATUSEHAT sesuai jalur resmi yang diverifikasi, tanpa memaksakan akses Production jika persyaratan belum selesai.
- [ ] Staging, UAT enam peran, pentest relevan, penilaian privasi/DPIA sesuai kebutuhan, backup/restore dan sign-off klinis/keamanan sebelum pasien nyata.
- [ ] Laporan operasional dasar, penanganan insiden, monitoring dan fungsi maintenance Vendor terkendali sesuai kebutuhan R1.
- [ ] Patah Pensil menangani build, signing, publikasi teknis dan rilis. Go-live layanan klinis/data pasien hanya setelah persetujuan substantif MADISING/PJ Klinis, pengaturan data dan gerbang keamanan terpenuhi.

## R2 — Apotek dan kurir

- [ ] Resep dokter sah, validasi apoteker dan transaksi apotek mitra.
- [ ] Penugasan kurir terverifikasi, pengantaran, proof of delivery, retur dan rekonsiliasi; pilihan kanal berdasarkan OPEN-16.
- [ ] UAT isolasi mitra/tenant, keamanan pemrosesan data obat dan idempotensi pembayaran/pengiriman.

## R3 — Layanan khusus dan optimasi

- [ ] Aktivasi profesi khusus (fisioterapis, bidan, terapis, petugas lab, pramurukti) sesuai keputusan OPEN-14, izin, kompetensi, SOP dan sign-off Owner.
- [ ] Paket perawatan ulang sesuai indikasi klinis, laporan KPI, optimasi jadwal dan ETA bila dibutuhkan.

**Aturan rilis:** Keputusan teknis dan deployment berada pada Patah Pensil dengan CI, keamanan dan audit yang wajib. Tidak ada workflow klinis/PHI nyata tanpa otorisasi sah MADISING dan gerbang klinis/privasi; perubahan atas ketentuan persetujuan historis melalui CR-TECH-01 belum dianggap efektif sebelum OPEN-12/OPEN-18.
