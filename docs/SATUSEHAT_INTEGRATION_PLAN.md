# MADISING — Rencana Integrasi SATUSEHAT (R0–R1)

**Status:** Rancangan teknis / belum terkoneksi. **Pemimpin teknis:** Patah Pensil. **Penyelenggara layanan/pengendali data:** MADISING. **Prioritas:** verifikasi jalur integrasi di R0, pelaksanaan sesuai hak dan kelayakan di R1. Dokumen ini tidak menetapkan kelayakan fasyankes, izin praktik, atau jaminan akses SATUSEHAT.

## 1. Sasaran dan prinsip

Mengupayakan pertukaran data pelayanan MADISING ke/dari SATUSEHAT yang benar-benar didukung oleh fasilitas pelayanan kesehatan yang berwenang, RME existing dan use case HL7 FHIR yang sesuai. Patah Pensil merancang API, mapping, autentikasi backend, test harness, observabilitas, retry dan keamanan teknis **tanpa meminta Owner menilai JSON atau detail API**.

MADISING/PJ Klinis dan pihak fasyankes memutuskan jenis pelayanan, pihak yang bertanggung jawab atas RME, tujuan penggunaan data dan kewenangan berbagi data. Patah Pensil tidak memperoleh hak otomatis atas PHI ataupun kredensial Production.

## 2. Jalur integrasi: keputusan OPEN-04

| Jalur | Syarat yang perlu diverifikasi | Kegagalan / tindakan |
|---|---|---|
| A. Melalui RME existing | Identitas dan status fasyankes, produk RME yang digunakan, apakah RME telah memenuhi proses registrasi, ketersediaan API/bridging/prosedur resmi, cakupan resource, kontrak dan izin pertukaran data | Bila tidak memiliki mekanisme sah, jangan mengarang API vendor atau mengirim PHI; lanjut evaluasi jalur B dan klasifikasi catatan klinis |
| B. MADISING/partner melalui antarmuka langsung yang memenuhi ketentuan | Apakah sistem yang dikembangkan Patah Pensil memenuhi persyaratan sistem RME/partner atau skema lain yang memang diterima SATUSEHAT, status fasyankes, verifikasi partner serta otorisasi akses kode Production sesuai mekanisme Kemenkes | Tanpa verifikasi dan wewenang resmi, batasi pada mock/Sandbox dan catat kendala; jangan klaim sistem terhubung Production |

**Catatan resmi:** SATUSEHAT membedakan pendaftaran fasyankes dan pendaftaran penyedia sistem RME/partner. Kode akses API Production diberikan menurut mekanisme fasyankes yang berwenang; partner terverifikasi tidak otomatis mempunyai kode Production sendiri. Fasyankes dapat mengatur pemberian/penghentian akses partner. Referensi: [Registrasi](https://satusehat.kemkes.go.id/platform/docs/id/registration-guide/), [Fasyankes](https://satusehat.kemkes.go.id/platform/docs/id/registration-guide/regis-institution/), [Kode akses](https://satusehat.kemkes.go.id/platform/docs/id/api-code/).

### Hasil verifikasi sumber primer — 6 November 2026

**Telah dipastikan dari dokumentasi publik resmi Kemenkes, bukan dari akun MADISING:**

- Untuk fasyankes, jalur Production memerlukan pemutakhiran sistem RME dan kontak SATUSEHAT melalui **DFO/REGFASYANKES/RS Online** sesuai kategori. RME vendor/mandiri harus telah terverifikasi. Fasyankes menguasai otorisasi kode akses Production; partner system tidak otomatis mempunyai kredensial Production sendiri. [Fasyankes](https://satusehat.kemkes.go.id/platform/docs/id/registration-guide/regis-institution/), [Production](https://satusehat.kemkes.go.id/platform/docs/id/api-code/access-production/).
- Akun developer/partner yang memiliki **kredensial Sandbox yang sah** dapat mencoba transaksi; status partner belum terverifikasi tidak otomatis menghalangi workshop di Sandbox. Ini bukan bukti tersedia akses Sandbox pada akun Patah Pensil. [Sandbox](https://satusehat.kemkes.go.id/platform/docs/id/api-code/access-sandbox/).
- **Bila Patah Pensil hendak mendaftarkan sistem RME sendiri sebagai partner system**, panduan saat ini menyatakan prasyarat: **nomor PSE**, **afiliasi SNOMED CT**, **bukti Sandbox respons 200/201 sampai Encounter dan Condition**, screenshot dan rekaman layar, dokumen sistem RME, surat tugas/kuasa dan persyaratan administrasi lain, serta survei keamanan. Tidak satu pun bukti tersebut dinyatakan sudah tersedia untuk MADISING. [Registrasi sistem RME](https://satusehat.kemkes.go.id/platform/docs/id/registration-guide/regis-vendor/).
- URL OAuth dan FHIR R4 Sandbox/Production telah dipublikasikan, dan resource **Encounter** serta **Condition** memiliki kontrak REST resmi. **Kecocokan use case spesifik kunjungan homecare dan sembilan layanan MADISING masih perlu divalidasi**, tidak otomatis sama dengan modul rawat jalan. [Endpoint](https://satusehat.kemkes.go.id/platform/docs/id/postman-workshop/endpoint-information/), [Rawat jalan](https://satusehat.kemkes.go.id/platform/docs/id/interoperability/rme-rawat-jalan/).

**Batas bukti:** nama fasilitas, produk/vendor RME existing, status verifikasi, kode fasyankes/Organization ID dan akun SSP MADISING belum tersedia dalam artefak proyek. Tidak ada akses authenticated SSP, request API ber-token, test Sandbox 200/201, ataupun tes Production yang telah dilakukan. **Status:** persyaratan publik VERIFIED; **jalur operasional MADISING belum VERIFIED**. Rincian: [laporan verifikasi](SATUSEHAT_VERIFIKASI_2026-11-06.md).


## 3. Checklist teknis R0 — dilakukan Patah Pensil

- [ ] Identifikasi penyelenggara/fasyankes resmi, PIC yang berwenang, Organization ID **hanya bila sudah diterbitkan**, RME yang digunakan dan pemilik proses RME (dengan data identitas fasilitas dari pihak berwenang, bukan asumsi).
- [ ] Periksa jalur pendaftaran dan status SATUSEHAT partner/fasyankes, hak akses lingkungan Sandbox serta prasyarat Production.
- [ ] Jika memilih jalur partner system baru: cek bukti **nomor PSE**, **nomor afiliasi SNOMED CT**, dokumen RME, surat tugas/kuasa, survei keamanan, serta uji respons 200/201 pada `Encounter` dan `Condition` di Sandbox; bukti tidak dapat diganti simulasi mock.
- [ ] Tentukan apakah tiap tindakan homecare bisa mengikuti playbook resmi yang ada; tidak menganggap pemetaan rawat jalan otomatis berlaku untuk kunjungan rumah.

- [ ] Verifikasi apakah RME existing memiliki API/prosedur bridging sah; minta daftar operasi yang benar-benar tersedia dan kontrak interoperabilitasnya.
- [ ] Tentukan jalur A atau B berdasarkan hasil verifikasi; bila keduanya belum memenuhi syarat, status integrasi `BLOCKED_EXTERNAL_DEPENDENCY`, tidak boleh diklaim `CONNECTED`.
- [ ] Petakan use case yang memang tersedia untuk pelayanan homecare; identifikasi resource FHIR relevan (misalnya `Patient`, `Encounter`) **hanya jika dokumentasi dan hak akses mendukung**.
- [ ] Rancang hubungan ID pasien/kunjungan MADISING ↔ RME ↔ SATUSEHAT, status sinkronisasi, pembetulan dan idempotency.
- [ ] Tentukan apakah catatan klinis MADISING berpotensi merupakan RME ketika API existing tidak ada; telaah PJ Klinis/legal sebelum schema klinis difinalkan.
- [ ] Uji kontrak mock FHIR dengan data sepenuhnya sintetis. Sandbox hanya dipakai bila telah diperoleh akses yang sah; simpan bukti tanpa token/PHI.
- [ ] Hasil OPEN-04 ditandatangani pengambil keputusan teknis Patah Pensil untuk pilihan adapter, sedangkan fasyankes/MADISING mengotorisasi penggunaan data serta identitas institusional yang dipakai.

## 4. Rancangan komponen

```text
Flutter / Web MADISING
        |
     API + RBAC/ABAC
        |
    Clinical domain  ---->  RME existing (jalur A jika API/bridging sah)
        |
   clinical_adapter
        |
   satusehat_adapter (jalur B hanya jika lolos onboarding)
        |
  OAuth / FHIR R4, outbox, retry, reconciliation, audit
        |
  SATUSEHAT Sandbox → Production hanya setelah gerbang otorisasi
```

Rancangan di atas bersifat **alternatif**, bukan instruksi mengirim data klinis ke RME existing dan SATUSEHAT sekaligus. Hindari pengiriman ganda: tetapkan sumber kebenaran, pemegang izin, dan pihak yang mengirim setiap resource.

**Kontrol minimum:** akses via backend saja, vault secret/token, least privilege; validasi payload dan response FHIR; timeout, retry bersyarat, idempotency, transaksi/outbox, DLQ dan rekonsiliasi; pseudonimisasi metadata audit; redaksi PHI pada error/log; tidak mengirim PHI ke AI/CI/staging; audit setiap perubahan resource; tidak membuat status sukses tanpa acknowledgement yang sah.

## 5. Gerbang uji R0/R1

| ID | Pengujian | Hasil penerimaan |
|---|---|---|
| SS-01 | Belum ada kredensial Sandbox | Mock test tetap dapat dilakukan; aplikasi **tidak** menampilkan label terkoneksi |
| SS-02 | Kredensial Sandbox sah tersedia | Sandbox API diuji menggunakan data sintetis dan identitas yang diizinkan; tidak ada token di log/repository |
| SS-03 | Partner belum terverifikasi atau tidak ada otorisasi fasyankes | Semua permintaan ke Production ditolak oleh konfigurasi dan prosedur deployment |
| SS-04 | Payload FHIR tidak valid / use case tidak didukung | Ditolak/ditandai gagal, tanpa pencatatan sukses palsu |
| SS-05 | Jaringan timeout/5xx, request dikirim ulang | Retry dengan idempotency; tidak membuat encounter/record duplikat |
| SS-06 | Respons sukses dan terjadi gangguan pencatatan status lokal | Outbox/reconciliation dapat memastikan status akhir dengan audit |
| SS-07 | Permintaan read/write data pasien di luar izin | Ditolak server dan audit; akun Vendor tidak dapat membaca PHI bebas |
| SS-08 | Kredensial Production salah/expired/dicabut | Akses berhenti aman, rahasia tidak terungkap, alarm teknis tercatat |
| SS-09 | Pasien/kunjungan tidak dapat dicocokkan ke RME/SATUSEHAT | Tahan pengiriman; identitas tidak ditebak dari nama atau nomor telepon |
| SS-10 | Fasyankes/tujuan pemrosesan belum disetujui | Integrasi Production tetap nonaktif meskipun tes API dan CI sudah lulus |

## 6. Gerbang Production

Production hanya dibuka setelah: (1) fasyankes dan pihak RME/partner yang sah teridentifikasi/terdaftar sesuai proses berlaku, (2) kode akses diperoleh dan digunakan sesuai kewenangannya, (3) use case serta mapping diuji, (4) pengendali data MADISING mengotorisasi tujuan dan lingkup pemrosesan, (5) penilaian privasi/kontrak dan persetujuan klinis yang relevan selesai, dan (6) Patah Pensil mengesahkan kesiapan teknis, keamanan, rollback dan observabilitas.

**Tidak ada keputusan mengasumsikan koneksi aktif, tidak ada akses Production, dan tidak ada pengiriman data pasien nyata dalam fondasi repository saat ini.**

## 7. Rujukan teknis Kemenkes

- [SATUSEHAT — Panduan Registrasi](https://satusehat.kemkes.go.id/platform/docs/id/registration-guide/)
- [SATUSEHAT — Kode Akses API](https://satusehat.kemkes.go.id/platform/docs/id/api-code/)
- [SATUSEHAT — Sandbox](https://satusehat.kemkes.go.id/platform/docs/id/api-code/access-sandbox/)
- [SATUSEHAT — Production](https://satusehat.kemkes.go.id/platform/docs/id/api-code/access-production/)
- [SATUSEHAT — Interoperabilitas](https://satusehat.kemkes.go.id/platform/docs/id/api-catalogue/integrations/)
- [SATUSEHAT — Endpoint](https://satusehat.kemkes.go.id/platform/docs/id/postman-workshop/endpoint-information/)

**Rujukan kebijakan:** PRD V1.4.1 §10.2, §11.3, §12, §16, §20 OPEN-04/OPEN-18; [DECISIONS](DECISIONS.md), [ARCHITECTURE](ARCHITECTURE.md), [SECURITY](SECURITY.md).
