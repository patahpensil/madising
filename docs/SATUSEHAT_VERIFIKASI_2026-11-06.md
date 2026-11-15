# MADISING — Verifikasi Mandiri Integrasi SATUSEHAT

**Tanggal pemeriksaan:** 6 November 2026 (WITA). **Pelaksana teknis:** Patah Pensil. **Basis bukti:** dokumentasi resmi SATUSEHAT Platform, tanpa login atau kredensial institusional. **Kategori hasil:** VERIFIED_PUBLIC / NOT_VERIFIED_FOR_MADISING / OPEN / RECOMMENDATION.

## 1. Putusan verifikasi

**VERIFIED_PUBLIC:** Ada mekanisme resmi untuk fasyankes dengan RME mitra/mandiri, pendaftaran partner system RME, akun dan kode akses Sandbox, kode akses Production milik fasyankes, autentikasi OAuth dan pertukaran data HL7 FHIR R4 termasuk `Patient`, `Encounter` dan `Condition`.

**NOT_VERIFIED_FOR_MADISING:** Tidak dapat menetapkan bahwa MADISING atau RME existing telah terdaftar/terverifikasi, mendapat kredensial Sandbox/Production, memiliki kontrak bridging, atau bahwa seluruh layanan homecare didukung use case tertentu. Tidak ada uji API authenticated, tidak ada bukti respons 200/201, dan tidak ada komunikasi ke server Production menggunakan PHI.

**Kesimpulan teknis (RECOMMENDATION):** mulai dengan memeriksa **Jalur A — integrasi melalui RME existing**. Ini bukan keputusan final atau bukti bahwa vendor RME memiliki API. Jika jalur A tidak sah/tidak tersedia, evaluasi **Jalur B — registrasi sistem RME Patah Pensil**; prasyaratnya lebih luas dari sekadar membuat adapter API.

## 2. Matriks verifikasi resmi

| Topik | Hasil publik | Dampak untuk MADISING | Sumber primer |
|---|---|---|---|
| Identitas dan hak fasyankes | VERIFIED_PUBLIC: fasyankes menggunakan RME mitra terverifikasi atau RME mandiri terverifikasi; memperbarui data RME dan kontak di DFO/REGFASYANKES/RS Online | Butuh nama/kode fasyankes yang benar, tidak boleh menggunakan identitas Vendor sebagai pengganti | [Kemenkes — Fasyankes](https://satusehat.kemkes.go.id/platform/docs/id/registration-guide/regis-institution/) |
| Sandbox | VERIFIED_PUBLIC: akses workshop dapat digunakan oleh partner terdaftar/terverifikasi maupun belum terverifikasi dengan Organization ID, Client ID, Client Secret Sandbox yang sah | Akses akun Patah Pensil **belum diverifikasi**; boleh gunakan mock lokal sambil menunggu akun | [Kode Sandbox](https://satusehat.kemkes.go.id/platform/docs/id/api-code/access-sandbox/) |
| Production | VERIFIED_PUBLIC: fasyankes mempunyai otoritas kode akses Production dan dapat memilih/menonaktifkan partner RME terverifikasi; partner tidak memiliki kode Production independen | Perlu tindakan/otorisasi fasyankes, bukan pembuatan kredensial Vendor sendiri | [Kode akses API](https://satusehat.kemkes.go.id/platform/docs/id/api-code/), [Production](https://satusehat.kemkes.go.id/platform/docs/id/api-code/access-production/) |
| Registrasi partner RME | VERIFIED_PUBLIC: prasyarat dalam panduan meliputi nomor PSE, afiliasi SNOMED CT, bukti pengujian Sandbox `Encounter` + `Condition` dengan respons 200/201, screen record dan screenshot/monitoring, dokumentasi sistem, surat tugas/kuasa, daftar fasyankes/ketentuan bila belum bermitra, survei keamanan | Jalur B **tidak siap diklaim terverifikasi**; setiap bukti harus diperoleh secara sah | [Registrasi Sistem RME](https://satusehat.kemkes.go.id/platform/docs/id/registration-guide/regis-vendor/) |
| Endpoint dan autentikasi | VERIFIED_PUBLIC: tersedia OAuth Sandbox/Production serta endpoint `/fhir-r4/v1`; Bearer token diperlukan untuk transaksi | Definisikan konfigurasi lingkungan terpisah, vault untuk kredensial, tanpa token di Git | [Endpoint Information](https://satusehat.kemkes.go.id/platform/docs/id/postman-workshop/endpoint-information/), [Autentikasi](https://satusehat.kemkes.go.id/platform/docs/id/api-catalogue/authentication/) |
| Resource awal | VERIFIED_PUBLIC: REST `Encounter` dan `Condition` terdokumentasi; rawat jalan memiliki playbook FHIR | Uji mapping sintetis `Patient`, `Encounter`, `Condition`; jangan mengasumsikan kesesuaian seluruh homecare tanpa panduan use case | [Encounter](https://satusehat.kemkes.go.id/platform/docs/id/api-catalogue/integrations/apis/encounter/), [Condition](https://satusehat.kemkes.go.id/platform/docs/id/api-catalogue/integrations/apis/condition/), [Rawat Jalan](https://satusehat.kemkes.go.id/platform/docs/id/interoperability/rme-rawat-jalan/) |

## 3. Kebutuhan internal yang belum dapat dipastikan

| Item | Status | Pemegang bukti / cara memverifikasi | Peran pengembang |
|---|---|---|---|
| Nama dan kode fasyankes/Organization ID yang sah | NOT_VERIFIED_FOR_MADISING | Fasyankes/pemegang akun DFO/REGFASYANKES/RS Online | Patah Pensil memeriksa kesesuaian dokumen/kode; jangan menebak |
| Nama produk dan vendor RME existing | NOT_VERIFIED_FOR_MADISING | Pengelola RME fasilitas | Patah Pensil menilai kontrak API dan dokumentasi bridging setelah identitas diketahui |
| RME existing telah terhubung ke SATUSEHAT | NOT_VERIFIED_FOR_MADISING | Portal SSP dan/atau konfirmasi RME terverifikasi | Patah Pensil memvalidasi bukti status dan alur, tidak menerima klaim lisan sebagai test |
| Akun Sandbox developer serta Organization ID/Client ID/Secret | NOT_VERIFIED_FOR_MADISING | Akun resmi SSP dengan pemilik akun yang sah | Patah Pensil mengerjakan pengujian dengan kredensial disimpan di vault, tidak meminta secret ditempel ke chat/Git |
| Nomor PSE dan afiliasi SNOMED CT untuk calon partner system | NOT_VERIFIED_FOR_MADISING | Dokumen registrasi pihak pendaftar | Patah Pensil menilai kesiapan Jalur B dan menyusun dokumen sistem |
| Kesesuaian modul homecare dengan use case pelaporan SATUSEHAT | OPEN | Dokumentasi use case resmi/klarifikasi teknis Kemenkes/RME | Patah Pensil menyusun mapping, meminta klarifikasi bila belum ada padanan eksplisit |
| Otorisasi MADISING atas data pasien dan perjanjian pemroses | OPEN-18 | Pengendali data dan pihak legal yang berwenang | Patah Pensil mengimplementasikan batas teknis setelah otorisasi sah |
| Test `Encounter` dan `Condition` 200/201 Sandbox | NOT_TESTED | Akun Sandbox sah dan aplikasi/mock adapter yang memenuhi spesifikasi | Patah Pensil melaksanakan dan menyimpan bukti tersanitasi tanpa PHI/secret |

**Penting:** Proyek menyebut fasilitas kesehatan serta RME existing telah tersedia, tetapi **belum mencantumkan identitas/kode fasyankes, nama produk RME, bukti koneksi atau kredensial SSP**. Ini adalah *evidence gap*, bukan klaim bahwa fasyankes tidak terdaftar.

## 4. Prioritas tindakan teknis

1. **Tidak menunggu keputusan JSON dari Owner.** Patah Pensil menangani desain FHIR adapter, outbound queue, idempotency, audit dan keamanan teknis.
2. **Verifikasi RME existing lebih dahulu.** Jika tidak ada API/prosedur bridging resmi, jangan membuat endpoint semu atau menggandakan rekam medis produksi.
3. **Siapkan mock contract tests tanpa PHI** untuk identitas Patient, Encounter dan Condition (struktur use case yang disepakati), dengan validasi token palsu/expired, error dan retry.
4. **Jika jalur B dipilih, lengkapi prasyarat registrasi partner RME** (PSE, SNOMED CT, Sandbox 200/201, dokumen sistem dan survei keamanan), bukan sekadar mempublikasikan web.
5. **Belum membuka Production** sampai kewenangan fasyankes, registrasi, konfigurasi kredensial sah, pengaturan pengendali/pemroses, pengujian dan kelayakan klinis/data selesai.

## 5. Keputusan OPEN-04 sementara

- **FEASIBILITY_PUBLIC: VERIFIED** — platform menyediakan jalur dan kontrak umum.
- **JALUR_A_FOR_MADISING: UNVERIFIED** — RME existing belum diidentifikasi.
- **JALUR_B_FOR_MADISING: UNVERIFIED** — bukti registrasi vendor dan Sandbox belum tersedia.
- **SANDBOX_CONNECTION: NOT_TESTED** — kredensial belum tersedia di lingkungan yang dapat diperiksa.
- **PRODUCTION_CONNECTION: NOT_TESTED / NOT_CLAIMED** — tidak ada akses dan tidak ada transaksi klinis yang dilakukan.
- **HOMECARE_USE_CASE_MAPPING: OPEN** — modul rawat jalan tidak otomatis mewakili seluruh jenis homecare.

**Tidak ada data pasien, credential, token, atau identifier pribadi yang digunakan/ditempel dalam pemeriksaan dan dokumen ini.**

### Sumber resmi

- https://satusehat.kemkes.go.id/platform/docs/id/registration-guide/
- https://satusehat.kemkes.go.id/platform/docs/id/registration-guide/regis-vendor/
- https://satusehat.kemkes.go.id/platform/docs/id/registration-guide/regis-institution/
- https://satusehat.kemkes.go.id/platform/docs/id/api-code/
- https://satusehat.kemkes.go.id/platform/docs/id/api-code/access-sandbox/
- https://satusehat.kemkes.go.id/platform/docs/id/api-code/access-production/
- https://satusehat.kemkes.go.id/platform/docs/id/postman-workshop/endpoint-information/
- https://satusehat.kemkes.go.id/platform/docs/id/interoperability/rme-rawat-jalan/
- https://satusehat.kemkes.go.id/platform/docs/id/api-catalogue/integrations/apis/encounter/
- https://satusehat.kemkes.go.id/platform/docs/id/api-catalogue/integrations/apis/condition/
