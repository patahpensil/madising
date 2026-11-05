# MADISING
## PRODUCT REQUIREMENTS DOCUMENT (PRD) — V1.4.1
### Restrukturisasi produk, layanan, keamanan, dan implementasi bertahap berdasarkan prototipe V1.3.7

| Atribut | Ketentuan |
|---|---|
| Nama produk | **MADISING** |
| Pemilik/penyelenggara | Usaha layanan homecare model A: satu penyelenggara layanan dengan tenaga dan mitra terverifikasi |
| Vendor pengembang dan pemelihara | **Patah Pensil** (dijalankan oleh pemilik proyek; akses teknis tetap terpisah dari akses klinis/operasional) |
| Dokumen | PRD V1.4.1 — rancang implementasi, **untuk tinjauan dan persetujuan** |
| Tanggal | 6 November 2026 |
| Referensi pengalaman pengguna | `MADISING_UIUX_Prototype_V1.3.7_Katalog_9_Layanan_Sidrap.html` |
| Baseline persyaratan terkunci | PRD V1.3.6: SIDRAP-LOCK, STAFF-LOCK, ACCOUNT-LOCK, ROLE-LOCK, GOVERNANCE-LOCK, IDENTITY-LOCK |
| Cakupan geografis pilot | Kabupaten Sidenreng Rappang (Sidrap), Sulawesi Selatan |
| Kanal utama | Flutter Android/iOS untuk pasien dan perawat; mobile/PWA untuk kurir; web responsif untuk dokter, apotek, dan Admin/Owner |
| Status sistem | PRD implementasi; **bukan** pernyataan bahwa sistem telah lulus pengujian keamanan atau sudah layak melayani pasien nyata |

> **Aturan dokumen:** PRD menetapkan perilaku, kontrol, kriteria uji, urutan rilis, dan tanggung jawab. PRD ini tidak memuat nominal biaya pembangunan atau maintenance. Batas sumber daya pengembangan diperlakukan sebagai kendala desain internal, **tidak** sebagai alasan meniadakan keselamatan pasien atau perlindungan data.

---

# 1. Ringkasan eksekutif

MADISING adalah sistem operasional untuk **layanan homecare milik sendiri** di Sidrap, bukan marketplace terbuka. MADISING mengoordinasikan katalog layanan, registrasi pasien, triase awal, pemesanan, penugasan tenaga berwenang, kunjungan rumah, koordinasi dokter, pendokumentasian layanan, rekam medis elektronik (RME) yang sudah ada, pemenuhan resep oleh apotek mitra, pengantaran obat oleh kurir, administrasi, dan pemeliharaan oleh Patah Pensil.

**Tujuan utama:** memberikan pengalaman pemesanan yang sederhana kepada pasien dan alur kerja yang tertib kepada tenaga kesehatan, tanpa menggabungkan hak akses antarpihak.

**Prinsip produk:**

1. **Safety first:** tanda gawat darurat tidak diproses sebagai booking biasa; tindakan hanya oleh personel yang kompeten, berwenang, serta berdasarkan keputusan/instruksi yang sah.
2. **Six-dashboard lock:** tepat enam dashboard operasional. Developer Console Patah Pensil adalah konsol teknis terpisah, bukan dashboard pelayanan ketujuh.
3. **Single source of clinical truth:** RME existing tetap menjadi rujukan catatan medis; MADISING adalah orkestrasi kunjungan dan integrasi, bukan mengganti RME tanpa keputusan resmi.
4. **Privacy by design:** data pasien dan berkas klinis hanya diterima, disimpan, diteruskan, dan ditampilkan sejauh dibutuhkan oleh peran yang sah.
5. **Lean engineering:** satu basis kode Flutter untuk Android/iOS, web responsif, backend modular monolith, database terpusat, integrasi melalui adapter; tidak membuat layanan infrastruktur kompleks tanpa kebutuhan terbukti.
6. **Operasional yang dapat diverifikasi:** status layanan, penugasan, persetujuan, pembayaran, sinkronisasi dan kegagalan harus nyata di backend, bukan sekadar animasi UI.
7. **Incremental release:** seluruh kategori ada dalam katalog, tetapi dapat diaktifkan per layanan hanya setelah SDM, SOP, izin, harga, wilayah, dan mitranya terbukti siap.

## 1.1 In scope

- Katalog **sembilan** kategori layanan dan pengaturan aktivitasnya.
- Enam dashboard dengan menu, ruang data, dan API berbeda.
- Dua jalur registrasi publik (pasien dan pelamar kurir); provisioning tenaga klinis/apotek oleh Admin.
- Booking rumah pasien di Sidrap, triase red flags, penjadwalan, pelacakan status, notifikasi.
- Administrasi kompetensi tenaga, wilayah, ketersediaan dan pembagian tugas.
- Pengkajian dan dokumentasi perawat, konsultasi/instruksi dokter, consent, serta integrasi RME.
- Resep dokter → validasi apotek → handoff → pengiriman kurir bila komponen layanan telah diaktifkan.
- Tagihan/invoice, konfirmasi pembayaran dan rekonsiliasi sederhana, sesuai entitas penagih yang sah.
- Audit, kontrol privasi, monitoring, backup/restore, Developer Console dan CI/CD.

## 1.2 Out of scope / tidak boleh diasumsikan

- Diagnosis otomatis oleh AI; AI bukan pemberi diagnosis atau resep.
- Praktik medis, kebidanan, rehabilitasi, laboratorium, dan kefarmasian tanpa izin atau kewenangan yang benar.
- Janji respons darurat seperti IGD/ambulans.
- Penerimaan otomatis semua kandidat tenaga/mitra.
- Mengganti RME yang telah ada atau membuat rekam medis ganda sebagai sumber final.
- Pelacakan lokasi terus-menerus di luar pekerjaan aktif.
- Video konsultasi yang direkam otomatis; rekaman memerlukan dasar hukum, consent yang sesuai, retensi dan pengamanan tersendiri.
- Algoritme dispatch berbasis AI, analitik prediktif, multiwilayah, microservices, Kubernetes, atau fitur marketplace pada peluncuran awal.

# 2. Status keputusan dan asumsi

## 2.1 Keputusan yang tidak boleh diubah secara diam-diam

| Kode | Ketentuan terkunci |
|---|---|
| IDENTITY-LOCK | Nama aplikasi **MADISING**; Patah Pensil adalah vendor. |
| MODEL-A | MADISING adalah usaha penyedia homecare sendiri; bukan marketplace tenaga kesehatan terbuka. |
| SIX-DASHBOARD-LOCK | Dashboard Pasien, Perawat, Dokter, Apotek, Kurir, Admin/Owner. |
| ACCOUNT-LOCK | Hanya Pasien dan Kurir dapat mendaftar sendiri; kurir tidak aktif bertugas sebelum diverifikasi Admin; dokter, perawat, apotek dibuat Admin. |
| STAFF-LOCK | Owner menyeleksi; Admin memeriksa dokumen dan mengundang setelah pemeriksaan kompetensi/kredensial serta persetujuan yang berlaku. |
| SIDRAP-LOCK | Booking divalidasi dari **tujuan kunjungan**, bukan posisi pemesan. Hanya Sidrap dalam pilot. |
| GOVERNANCE-LOCK | Owner boleh juga menjadi Admin dengan audit konteks terpisah; Patah Pensil beridentitas teknis dan memperoleh sarana maintenance wajib; tidak mendapat akses rutin rekam medis. |
| CLINICAL-LOCK | Kewenangan diagnosis/resep dokter, batas tindakan perawat dan tenaga profesi lain, persetujuan pasien dan RME existing dipertahankan. |
| SERVICE-CATALOG-LOCK | Kesembilan kategori V1.3.7 tercantum; ketersediaan aktual tetap berdasarkan persetujuan aktivasi layanan. |
| PROTOTYPE-LOCK | Visual utama dan struktur pengalaman V1.3.7 menjadi referensi desain; prototipe bukan bukti keamanan produksi. |

Setiap perubahan terhadap ketentuan terkunci memerlukan change request, dampak keamanan/klinis, persetujuan pemilik, dan persetujuan penanggung jawab klinis untuk area medis.

## 2.2 Fakta yang dilaporkan pemilik vs hal yang belum diverifikasi

**Dilaporkan telah tersedia oleh pemilik:** fasilitas/klinik, dokter, perawat, RME, apotek mitra, kurir mitra, serta tata kelola legal oleh dokter penanggung jawab. Status dokumen, cakupan izin per kategori layanan, konektivitas RME, kesiapan apotek dan kurir **belum divalidasi dalam PRD ini**.

**Belum final dan harus diputuskan sebelum aktivasi terkait:** identitas fasilitas serta penanggung jawab RME; daftar tenaga dan izin per tindakan; kontrak/persetujuan pemrosesan data; API atau prosedur kerja aman dengan RME, apotek, kurir dan laboratorium; batas retensi; metode pembayaran/refund; geofence administratif resmi; parameter RPO/RTO dan tingkat layanan respons; ketentuan konsultasi jarak jauh; kebijakan perwakilan pasien anak/lansia dan pembuktian kewenangan kuasa.

# 3. Persona, kanal, dan batas kewenangan

## 3.1 Tepat enam dashboard operasional

| Dashboard | Kanal peluncuran | Fungsi dominan | Akses yang dilarang |
|---|---|---|---|
| **DB-PAT — Pasien** | Flutter Android dan iPhone | Jelajah layanan, booking, alamat, consent, status, riwayat yang sah, tagihan, status obat | Kasus pasien lain tanpa hubungan kuasa, mengubah instruksi dokter, RME final |
| **DB-NRS — Perawat** | Flutter Android dan iPhone | Tugas, check-in, asesmen, konsultasi, instruksi, tindakan, bukti, check-out | Diagnosis medis/resep mandiri, tugas dan file klinis yang tidak ditugaskan |
| **DB-DOC — Dokter** | Web responsif (dapat diakses mobile) | Clinical inbox, konsultasi, keputusan medis, instruksi, resep, review | Catatan pasien di luar hubungan pelayanan atau tugas yang disahkan |
| **DB-PHA — Apotek** | Web responsif | Resep yang dialokasikan, validasi apoteker, ketersediaan, harga, penyiapan, handoff | Rekam medis lengkap, data apotek lain, resep tanpa otorisasi |
| **DB-CUR — Kurir** | Mobile/PWA; Flutter dapat berbagi komponen jika dipilih | Tugas antar, pickup, navigasi, serah-terima, gagal/retur | Diagnosis, foto medis, rincian resep/riwayat, order kurir lain |
| **DB-ADM — Admin/Owner** | Web desktop responsif | Ringkasan, booking, verifikasi, dispatch, SDM, mitra, katalog, keuangan, audit operasional | Melihat/mengubah rekam medis rinci tanpa dasar kewenangan klinis |

Peran pendukung CCO (koordinator klinis) dan FIN (keuangan) adalah **scope izin** di workspace terkait, bukan dashboard tambahan. Profesi fisioterapis, bidan, terapis, petugas laboratorium, dan pramurukti hanya diberi akses yang layak setelah desain lingkup profesinya disahkan; pada pilot tidak boleh memperoleh hak perawat/dokter hanya untuk mempersingkat implementasi.

## 3.2 Developer Console — Patah Pensil

Konsol teknis **di luar** keenam dashboard. Wajib mengelola status sistem, deployment, job/integrasi, backup, troubleshooting, notifikasi insiden, aktivitas audit teknis, dan pencabutan akses. Konsol **tidak** mengungkap rekam medis, foto, diagnosis, resep, nomor identitas pasien, atau token produksi pada penggunaan rutin.

Jika satu orang yang sama adalah Owner dan vendor Patah Pensil, kredensial, konteks sesi, izin, serta audit tetap terpisah. Aksi sensitif yang membutuhkan persetujuan independen tidak dianggap sah hanya karena orang yang sama berpindah role.

## 3.3 Matriks akses minimum (ringkasan)

Legenda: `Y` diperbolehkan dengan scope; `L` terbatas metadata/status; `—` dilarang. Semua otorisasi diverifikasi **di server** terhadap hubungan perawatan, penugasan, afiliasi mitra, kepemilikan, dan status akun.

| Resource/Aksi | PAT | NRS | DOC | PHA | CUR | ADM/OWN | VEN |
|---|---|---|---|---|---|---|---|
| Buat booking sendiri/kuasa sah | Y | — | — | — | — | L | — |
| Kelola booking/dispatch | L | L (sendiri) | L | — | — | Y | — |
| Asesmen & dokumentasi perawatan | L sesuai hak | Y (ditugaskan) | Y (relasi sah) | — | — | — | — |
| Diagnosis/instruksi/resep | L sesuai hak | L (instruksi) | Y (dokter berwenang) | L (resep dialokasikan) | — | — | — |
| Order apotek | L | — | L | Y (mitra terkait) | L (logistik) | L | — |
| Delivery | L | — | — | L | Y (ditugaskan) | L | — |
| Credentialing SDM/mitra | — | L (diri sendiri) | L (diri sendiri) | L (mitra) | L (diri) | Y | — |
| Ringkasan dan tagihan | L (milik) | — | — | L (terkait) | L (terkait) | Y | — |
| Infrastruktur/CI/CD/backup | — | — | — | — | — | L (approval) | Y (scope teknis) |

Rincian izin per endpoint diterbitkan sebagai lampiran `AUTHZ_MATRIX` sebelum implementasi API klinis. Tidak ada izin wildcard untuk PHI.

# 4. Katalog sembilan layanan (V1.3.7)

## 4.1 Katalog yang harus tampil pada dashboard Pasien

| ID stabil | Nama kategori | Contoh cakupan | Profesi & syarat utama | Penugasan awal |
|---|---|---|---|---|
| `doctor` | **Layanan Medis & Kunjungan Dokter** | Pemeriksaan, evaluasi, monitoring | Dokter terverifikasi; kewenangan praktik dan ketersediaan | Admin review → dokter yang eligible |
| `special_nursing` | **Tindakan Keperawatan Khusus** | Infus, kateter urin, NGT, injeksi IM/IV jika terindikasi | Perawat kompeten, SOP, instruksi klinis sah bila disyaratkan | Perawat eligible; tindakan digated dokter bila diperlukan |
| `wound` | **Perawatan Luka** | Luka diabetik, luka tekan, luka pascaoperasi | Kompetensi perawatan luka; evaluasi, SOP dan eskalasi dokter | Perawat eligible |
| `physio` | **Fisioterapi & Rehabilitasi** | Mobilitas, fungsi, pascastroke/cedera | Fisioterapis terverifikasi dan kewenangan sah | Admin review; **bukan** auto-perawat |
| `therapy` | **Terapi Tambahan** | Terapi wicara, okupasi, menelan | Terapis sesuai izin, kompetensi dan indikasi | Admin review |
| `postop` | **Perawatan Pascaoperasi** | Follow-up pasien pulang, monitoring dan tindakan | Perawat sesuai rencana pulang; koordinasi dokter | Perawat eligible + instruksi/konfirmasi yang sesuai |
| `elderly` | **Perawatan Lansia & Pramurukti** | Aktivitas harian, mobilitas, nutrisi, pemantauan | Pramurukti/caregiver **nonmedis** atau perawat jika tindakan klinis | Admin review untuk klasifikasi tugas |
| `mother_baby` | **Perawatan Ibu & Bayi** | Perawatan bayi baru lahir, tali pusat, dukungan laktasi | Bidan/tenaga berwenang dengan kompetensi relevan | Admin review |
| `lab` | **Pemeriksaan Laboratorium** | Pengambilan sampel di rumah | Petugas kompeten + laboratorium mitra yang sah + chain of custody | Admin review |

**Larangan:** kategori katalog tidak sama dengan layanan yang otomatis siap dijual. Tampilan promosi tidak boleh menjanjikan prosedur medis tanpa pemeriksaan kelayakan; tidak boleh menampilkan contoh layanan berisiko sebagai instruksi pasien untuk mengerjakan sendiri.

## 4.2 Siklus hidup kategori dan konfigurasi

Setiap layanan memiliki `service_id`, judul, penjelasan, kategori risiko, profesi/kompetensi yang dibutuhkan, prosedur SOP terkait, instruksi dokter bila dibutuhkan, jenis consent, area/jadwal, harga/paket (jika disetujui), durasi referensi, syarat previsit, kriteria pengecualian, dan penanggung jawab persetujuan.

State katalog: `DRAFT → VERIFIED → ACTIVE ↔ SUSPENDED → RETIRED`. Hanya `ACTIVE` boleh menghasilkan booking terkonfirmasi. `VERIFIED` mensyaratkan sign-off klinis, kesiapan personel dan tata kelola terkait; perubahan ketersediaan petugas tidak otomatis mengubah legalitas layanan. Layanan `DRAFT/SUSPENDED` dapat ditampilkan sebagai “Belum tersedia” jika sesuai kebijakan, tetapi **tanpa tombol booking aktif**.

## 4.3 Alur layanan khusus

- Kategori `doctor`, `physio`, `therapy`, `elderly`, `mother_baby`, `lab` **tidak** langsung diassign ke akun perawat. Admin memeriksa kebutuhan dan memetakan tenaga/mitra berwenang.
- Kategori `special_nursing`, `wound`, `postop` boleh masuk alur perawat hanya bila tipe tindakan, kewenangan, SOP dan prasyarat perawatan memenuhi aturan. Kondisi yang memerlukan instruksi dokter wajib menunggu order sah.
- Pramurukti nonmedis dipisahkan dari tugas perawat; tidak ada prosedur klinis yang dapat dieksekusi lewat akun caregiver.
- Lab harus mempunyai identitas permintaan dan pasien, label sampel, waktu pengambilan, kondisi transport, penerimaan lab, hasil rujukan, dan akses hasil yang dibatasi.
- Pemantauan pasien rentan (anak/lansia) memperhitungkan persetujuan dari pihak yang berwenang dan relasi wali/kuasa.

# 5. Wilayah layanan: SIDRAP-LOCK

1. Penentuan layanan berdasarkan **koordinat/alamat tujuan** di Kabupaten Sidenreng Rappang; pemesan dapat berada di luar Sidrap.
2. Kecamatan dalam cakupan administratif: Maritengngae; Panca Rijang; Baranti; Kulo; Watang Pulu; Panca Lautang; Tellu Limpoe; Watang Sidenreng; Dua Pitue; Pitu Riawa; Pitu Riase.
3. UI menerima titik peta (dengan izin) atau alamat manual. Izin GPS perangkat **bukan syarat pendaftaran**.
4. Geofence produksi berdasarkan poligon wilayah administratif tervalidasi dan diperiksa di **backend** (PostGIS atau implementasi setara yang sudah diuji), bukan teks kabupaten/dropdown/radius atau lokasi HP.
5. Lokasi ambigu, dekat batas, atau gagal geocoding → `LOCATION_REVIEW`; dispatch tertahan hingga diverifikasi Admin.
6. Wilayah administratif termasuk cakupan **tidak** menjamin tenaga, jadwal, ETA, atau semua kategori layanan tersedia; kapasitas diatur per layanan/per kecamatan.
7. Perubahan tujuan kunjungan setelah booking mewajibkan validasi ulang, persetujuan penyesuaian ongkos/jadwal bila perlu, serta audit.
8. Ekspansi wilayah wajib change request dan pengujian poligon/aturan dispatch.

# 6. Identitas, registrasi, dan lifecycle akun

## 6.1 Matriks provisioning

| Identitas | Registrasi publik | Aktivasi | Kondisi wajib |
|---|---|---|---|
| Pasien | Ya | Verifikasi kontak; penetapan relasi pasien/kuasa sesuai kasus | Persetujuan/penjelasan privasi, anti-OTP abuse |
| Kurir | Ya, sebagai pelamar | Hanya Admin setelah pemeriksaan | Verifikasi identitas, mitra, syarat penanganan transport; tidak menerima order saat pending |
| Perawat | Tidak | Admin undang sesudah STAFF-LOCK | Kredensial dan kompetensi, pemeriksaan masa berlaku dan persetujuan Owner/klinis |
| Dokter | Tidak | Admin undang sesudah STAFF-LOCK | Dokumen dan kewenangan praktik; tidak bisa membuat akun sendiri |
| Apotek | Tidak | Admin undang sesudah kemitraan/izin diverifikasi | Diikat ke mitra dan cabang, validasi penanggung jawab apoteker |
| Admin/Owner | Tidak | Bootstrap aman/undangan internal | MFA, konteks hak, audit |
| Vendor Patah Pensil | Tidak | Identitas teknis terpisah dan ditunjuk | MFA, akses scoped, audit, JIT untuk tindakan istimewa |

Pelamar fisioterapis/bidan/terapis/laboratorium/caregiver tidak ditambahkan sebagai pilihan signup publik. Proses onboarding profesi melalui Admin dan persetujuan cakupan layanan masing-masing.

## 6.2 Status akun

- Pasien: `UNVERIFIED → ACTIVE → SUSPENDED/CLOSED`.
- Kurir: `APPLIED → PENDING_REVIEW → NEEDS_CORRECTION/APPROVED/REJECTED → ACTIVE → SUSPENDED/REVOKED`.
- Tenaga klinis: `CANDIDATE → DOC_CHECKED → CLINICAL_CHECKED → OWNER_APPROVED → INVITED → ACTIVE → SUSPENDED/REVOKED`.
- Apotek: `PARTNER_DRAFT → LEGAL_CHECKED → APPROVED → INVITED → ACTIVE → SUSPENDED/TERMINATED`.
- Vendor/Admin: diundang oleh jalur nonpublik, dapat dinonaktifkan dan seluruh sesi/token terkait dicabut.

Payload signup publik yang memuat `role=doctor/nurse/pharmacy/admin/vendor` ditolak, sekalipun UI memanipulasi parameter. Tidak diperkenankan menetapkan kewenangan dari token client tanpa verifikasi keadaan akun dan tugas di server.

## 6.3 Keamanan sesi

- Gunakan provider autentikasi yang sudah diaudit atau implementasi OIDC yang matang, **jangan merancang algoritme autentikasi sendiri**.
- Password tidak dikirim Admin; akun internal diaktivasi lewat undangan sekali pakai berjangka pendek.
- MFA wajib untuk Admin, dokter dan vendor; diterapkan untuk akun risiko tinggi lain berdasarkan analisis risiko.
- OTP diproteksi kedaluwarsa, throttle, anti-enumerasi dan redaksi log.
- Token akses berumur pendek, refresh token dirotasi/dicabut, deteksi logout dan pembekuan akun. Token seluler disimpan pada Android Keystore/iOS Keychain lewat secure storage; bukan plain-text local storage.
- Akun publik mendukung pemulihan yang tidak membocorkan keberadaan pengguna; perubahan informasi sensitif memerlukan autentikasi ulang.

# 7. Alur end-to-end produk

## 7.1 Alur pemesanan pasien

1. Pengguna membuka katalog sembilan layanan → hanya layanan aktif yang dapat dipesan.
2. Pilih untuk diri sendiri atau pasien yang diwakili dengan **kuasa terverifikasi**.
3. Isi keluhan/tujuan dan triase tanda bahaya. Jika red flag: jelaskan sistem **bukan layanan darurat**; hentikan booking rutin dan arahkan ke pertolongan darurat, sertakan tombol kontak yang sesuai tanpa janji layanan ambulans.
4. Pilih alamat kunjungan Sidrap via GPS atau manual; server melakukan geofence dan verifikasi lokasi.
5. Pilih preferensi jadwal; tampilkan biaya/komponen layanan yang valid, syarat layanan, dan consent pemrosesan/layanan yang tepat.
6. Server buat `BOOKING_REQUESTED`; untuk layanan khusus ke `ADMIN_REVIEW`; untuk alur perawat ke `ELIGIBILITY_CHECK`.
7. Sistem menampilkan nomor booking dan status nyata. Tidak ada pesan “petugas ditugaskan” sebelum assignment backend berhasil.
8. Pasien menerima konfirmasi, update berjenjang, pembatalan/reschedule menurut ketentuan dan bukti pembayaran bila diproses.

## 7.2 Triage dan pemilihan tenaga

- Triage adalah **skrining awal**, bukan diagnosis otomatis.
- Urutan matching: jenis layanan → kewenangan/sertifikat/izin yang masih berlaku → kompetensi tindakan → ketersediaan → cakupan alamat → waktu perjalanan realistis → kapasitas tugas.
- Untuk kategori berprofesi khusus, Admin membuat tugas hanya pada resource personel/mitra berwenang setelah persyaratan diverifikasi. Ketiadaan tenaga menghasilkan penolakan/penawaran penjadwalan ulang secara transparan.
- Dua petugas tidak boleh menerima booking sama secara bersamaan; klaim dan assignment atomik dengan idempotency key dan pencatatan pelaku.
- Manual override oleh Admin memerlukan alasan dan **tidak** boleh melewati eligibility atau kebutuhan instruksi klinis.

## 7.3 Kunjungan perawat dan koordinasi dokter

1. Perawat melihat hanya `ASSIGNED` miliknya; melakukan perjalanan dan check-in dengan timestamp (GPS kontekstual bila diizinkan dan diperlukan).
2. Verifikasi identitas pasien dan kesesuaian layanan; asesmen keperawatan, tanda vital, tanda bahaya dan kebutuhan konsultasi.
3. Jika kondisi tidak aman: hentikan/minta eskalasi dan catat tindakan sesuai SOP.
4. Kasus yang memerlukan dokter diarahkan ke dokter berwenang; dokter dapat berkonsultasi, memberi diagnosis jika relevan, instruksi, rujukan, atau resep berdasarkan pemeriksaan yang sah.
5. Tindakan perawat hanya dapat dilanjutkan ketika syarat kompetensi, instruksi dan consent sesuai statusnya terpenuhi.
6. Dokumentasi terstruktur: assessment, waktu, tindakan, tanda vital, respons pasien, material relevan, edukasi, consent dan bukti foto/video **hanya bila diperlukan**.
7. Kunjungan tidak dapat dinyatakan `CLINICALLY_COMPLETE` jika data wajib/otentikasi/signature atau integrasi RME tidak jelas; gunakan status pending/reconciliation bila RME bermasalah.
8. Perubahan catatan final harus **amendment** yang terlacak, bukan overwrite.

## 7.4 Resep–apotek–kurir

1. Dokter yang sah menerbitkan dan mengesahkan resep sesuai ketentuan sistem RME.
2. Resep yang ditujukan kepada apotek mitra dapat dilihat apotek tersebut dalam scope minimum; apoteker memvalidasi, mengonfirmasi ketersediaan, biaya dan ketentuan penyerahan.
3. Pasien menerima rincian biaya dan persetujuan transaksi sesuai merchant/payee yang benar; pembayaran tidak dianggap sukses sebelum callback terverifikasi.
4. Setelah order siap, kurir terverifikasi ditugaskan; detail hanya alamat pickup/dropoff, kontak dan syarat logistik yang perlu.
5. Pickup dan delivery menggunakan status, timestamp, kode/konfirmasi penerima, serta bukti serah-terima minimum. Jangan menampilkan isi resep lengkap kepada kurir.
6. Penolakan apotek, stok kosong, pengantaran gagal, alamat berubah, retur, atau obat yang memerlukan ketentuan khusus harus mempunyai alur pengecualian dan eskalasi.
7. Apotek dapat melaksanakan proses manual **terkontrol** selama API belum ada, tetapi aktivitas tetap diarsipkan dan diverifikasi; tidak boleh ada perpindahan resep melalui kanal personal tanpa perlindungan memadai.

## 7.5 Kunjungan dokter, fisioterapi, terapi, lansia, ibu-bayi, laboratorium

- Semua permintaan masuk `ADMIN_REVIEW`; Admin menentukan profesi dan memastikan kesiapan legal/klinis/mitra.
- Workflow lapangan khusus memiliki form, izin, consent dan pemeriksaan berbeda sesuai profesi; **tidak meminjam** kewenangan perawat hanya karena modul belum dibangun.
- Untuk layanan profesi yang belum memiliki workflow aman, kategorinya boleh ditampilkan sebagai informasi atau menerima permintaan konsultasi administratif **tanpa konfirmasi booking klinis**, berdasarkan kebijakan yang disetujui.
- Pengambilan sampel mempunyai kode unik, label, verifikasi pasien, dokumentasi rantai penguasaan, penanda sampel ditolak, dan pelaporan hasil melalui pihak berwenang.

# 8. Model status dan rekonsiliasi

## 8.1 Booking

`DRAFT → REQUESTED → TRIAGE_OK → LOCATION_OK/LOCATION_REVIEW → ELIGIBILITY_CHECK/ADMIN_REVIEW → CONFIRMED → ASSIGNED → EN_ROUTE → ARRIVED → IN_PROGRESS → DOCUMENTATION_PENDING → COMPLETED`.

Status terminal/alternatif: `REJECTED_OUT_OF_AREA`, `REJECTED_SERVICE_UNAVAILABLE`, `CANCELLED_BY_PATIENT`, `CANCELLED_BY_ADMIN`, `ESCALATED_EMERGENCY`, `NO_SHOW`, `FAILED`, `RESCHEDULE_REQUESTED`. Transisi hanya ditentukan backend sesuai izin dan precondition; semua perubahan status memiliki event log.

## 8.2 Klinis dan integrasi

- Consent: `NOT_REQUESTED → REQUESTED → ACCEPTED/DECLINED/REVOKED` (pencabutan menurut kebijakan dan kewajiban pencatatan).
- Perintah dokter: `DRAFT → SIGNED → ACKNOWLEDGED → EXECUTED/CANCELLED/EXPIRED`.
- Catatan: `DRAFT → READY_FOR_REVIEW → FINALIZED → AMENDED`, terhubung dengan identitas pemberi catatan dan waktu.
- RME sync: `PENDING → SENT → ACKNOWLEDGED/RETRYABLE_ERROR/PERMANENT_ERROR → RECONCILED`; kegagalan tidak boleh menghapus sumber sementara sebelum aman.
- Pharmacy: `RECEIVED → VALIDATING → ACCEPTED/REJECTED → PREPARING → READY → HANDED_OFF/RETURNED`.
- Courier: `PENDING → ASSIGNED → PICKED_UP → IN_TRANSIT → DELIVERED` atau `FAILED/RETURNED`.
- Pembayaran: `INITIATED → PENDING → VERIFIED_PAID/FAILED/EXPIRED/REFUNDED`; hanya callback tervalidasi mengubah status keuangan final.

Sistem menerapkan transactional outbox atau mekanisme andal setara, retry berbatas dengan backoff, dead-letter/reconciliation yang terlihat Admin, idempotency pada webhook, dan penolakan transisi ilegal.

# 9. Spesifikasi fungsional per dashboard

## 9.1 DB-PAT — Pasien

| ID | Kebutuhan wajib | Penerimaan |
|---|---|---|
| PAT-01 | Registrasi/login & relasi kuasa | Pasien/keluarga sah; tidak membuka rekam medis hanya dengan nomor identitas. |
| PAT-02 | Katalog 9 kategori layanan | Semua kategori sesuai V1.3.7 tampil; label aktif/tidak aktif jujur. |
| PAT-03 | Detail layanan | Deskripsi, indikasi umum, prasyarat, jenis tenaga, status, harga jika disetujui. |
| PAT-04 | Booking & triase | Tanda bahaya memicu penghentian booking rutin; hasil triase tercatat. |
| PAT-05 | Lokasi Sidrap | Validasi backend; kasus ambigu ditahan untuk pemeriksaan. |
| PAT-06 | Jadwal dan ketersediaan | Konfirmasi tidak muncul sebelum tenaga dan kapasitas disetujui. |
| PAT-07 | Status/timeline | Menampilkan hanya status nyata pada server, tanpa menebak ETA. |
| PAT-08 | Consent dan ringkasan | Persetujuan per tindakan/dokumentasi; riwayat yang boleh diakses. |
| PAT-09 | Resep, obat, dan tagihan | Hanya milik sendiri/kuasa sah; detail harga dan status transaksi jelas. |
| PAT-10 | Keluhan & permintaan bantuan | Terkait booking, status tiket, eskalasi keselamatan. |

## 9.2 DB-NRS — Perawat

| ID | Kebutuhan wajib | Penerimaan |
|---|---|---|
| NRS-01 | Antrean tugas personal | Hanya aktif, eligible, assigned; tidak dapat claim milik orang lain. |
| NRS-02 | Navigasi/check-in | Izin lokasi kontekstual, validasi status kunjungan. |
| NRS-03 | Asesmen & tanda vital | Validasi tipe/satuan/batas kewajaran; tidak diperlakukan sebagai diagnosis. |
| NRS-04 | Konsultasi dokter | Permintaan, status, rekaman keputusan/instruksi yang sah. |
| NRS-05 | Eksekusi tindakan | Gated kompetensi, SOP, instruksi klinis dan consent. |
| NRS-06 | Bukti foto/dokumen | Private upload, kontrol jenis/ukuran/retensi/akses. |
| NRS-07 | Catatan akhir | Draf, verifikasi, finalisasi sesuai kewenangan, amendment. |
| NRS-08 | Gangguan konektivitas | Draft lokal sensitif hanya bila diputuskan aman; jika tidak ada desain offline aman, **jangan** menyimpan PHI offline. |

## 9.3 DB-DOC — Dokter

| ID | Kebutuhan wajib | Penerimaan |
|---|---|---|
| DOC-01 | Antrean konsultasi | Hubungan perawatan dan kewenangan dokter dicek. |
| DOC-02 | Ringkasan klinis minimal | Informasi tepat untuk kasus aktif, melalui adapter RME yang disetujui. |
| DOC-03 | Konsultasi pesan/audio/video | Dilakukan hanya dengan sarana yang memenuhi perlindungan data dan aturan profesi; fitur video opsional sampai siap. |
| DOC-04 | Diagnosa/instruksi | Keputusan dokter tersahkan, tidak dapat ditulis akun perawat. |
| DOC-05 | Resep | Dokter berwenang, tanda tangan/otentikasi sesuai SOP, verifikasi apotek. |
| DOC-06 | Review catatan & tindak lanjut | Perubahan klinis berjejak audit, alur rujukan/eskalasi. |

## 9.4 DB-PHA — Apotek

`PHA-01` inbox resep hanya untuk mitra/cabang terikat; `PHA-02` validasi apoteker; `PHA-03` konfirmasi ketersediaan dan harga; `PHA-04` penyiapan; `PHA-05` handoff kurir dengan bukti; `PHA-06` penolakan/retur/insiden; `PHA-07` pembatasan informasi pasien dan audit.

## 9.5 DB-CUR — Kurir

`CUR-01` status pelamar dan verifikasi; `CUR-02` hanya order assigned setelah aktif; `CUR-03` alamat navigasi dan instruksi logistik minimal; `CUR-04` pickup; `CUR-05` proof of delivery secukupnya; `CUR-06` gagal/retur; `CUR-07` tidak pernah mengakses konten klinis; `CUR-08` geolokasi hanya saat tugas aktif dan dengan transparansi/izin yang diperlukan.

## 9.6 DB-ADM — Admin/Owner

`ADM-01` ringkasan operasional agregat; `ADM-02` review booking/triase lokasi; `ADM-03` dispatch, shift dan eligibility; `ADM-04` staf & dokumen izin; `ADM-05` verifikasi kurir dan mitra apotek; `ADM-06` katalog serta status aktivasi layanan; `ADM-07` invoice, pembayaran dan refund; `ADM-08` pelacakan gangguan RME/apotek/kurir; `ADM-09` audit akses operasional; `ADM-10` pelaporan KPI; `ADM-11` Owner workflow untuk rekrutmen, kebijakan layanan dan tindakan berisiko. Admin **tidak** memiliki mode universal untuk membuka semua PHI.

## 9.7 Developer Console Patah Pensil (teknis)

`VEN-01` metrik availability dan latency tanpa PHI; `VEN-02` alert/error log tersanitasi; `VEN-03` status integrasi/antrian; `VEN-04` deployment staging/produksi terotorisasi; `VEN-05` rollback dan versi; `VEN-06` jadwal/hasil backup; `VEN-07` restore dengan persetujuan terpisah; `VEN-08` kontrol akses istimewa JIT, MFA, timeout dan audit; `VEN-09` patch keamanan dan status kerentanan; `VEN-10` uji integrasi sandbox dan redaksi data; `VEN-11` incident runbook, pelacakan postmortem; `VEN-12` pencabutan akses vendor dan rotasi kredensial; `VEN-13` status retensi/audit kesehatan sistem.

**Batas implementasi konsol:** pada rilis awal, fungsi maintenance dapat berupa dashboard teknis terbatas yang mengintegrasikan workflow GitHub Actions, monitoring, backup dan tiket yang sudah ada. Tidak perlu membangun ulang platform DevOps dari nol. Operasi berisiko tetap diaudit dan memperoleh persetujuan.

# 10. Data dan skema minimum

## 10.1 Pemisahan domain

| Domain | Entitas inti | Data sensitif dan pemilik |
|---|---|---|
| Identity | `accounts`, `roles`, `role_bindings`, `sessions`, `mfa_factors`, `invitations`, `consents` | Kredensial dan PHI identity; Admin/identity service scoped |
| Patient/Booking | `patients`, `representatives`, `addresses`, `bookings`, `triage_events`, `service_catalog`, `service_availability` | Identitas pasien, alamat, keluhan minimal |
| Geo/Dispatch | `service_areas`, `area_versions`, `coverage`, `credential_checks`, `shifts`, `assignment_offers`, `assignments` | Lokasi dan status kerja |
| Clinical adapter | `care_encounters`, `assessments`, `doctor_orders`, `procedure_events`, `documentation_status`, `rme_references`, `integration_jobs` | Referensi RME dan dokumen klinis minimal; RME adalah source of truth |
| Medication | `prescription_references`, `pharmacies`, `pharmacy_orders`, `handoffs` | Data resep sebatas kebutuhan mitra sah |
| Logistics | `couriers`, `delivery_tasks`, `proof_of_delivery`, `return_events` | Kontak dan tujuan minimal |
| Finance | `invoices`, `invoice_items`, `payment_events`, `refunds`, `reconciliation` | Keuangan/identitas pembayaran minimal; dilarang menyimpan data kartu pembayaran sensitif |
| Security/Operations | `audit_events`, `security_alerts`, `access_grants`, `break_glass_events`, `backup_status`, `incident_tickets` | Metadata audit yang diminimalkan dan dilindungi |

## 10.2 Kebijakan data

- Setiap objek klinis terikat `patient_id`, `encounter_id`, `assigned_provider_id`, lokasi/mitra dan aturan akses; ID generik tidak boleh cukup untuk mengakses data.
- MADISING menyimpan referensi `rme_patient_id`, `rme_encounter_id` dan status sinkron; isi klinis disimpan sementara **hanya** jika diperlukan untuk kesinambungan layanan dan telah diputuskan kebijakan retensinya.
- Jangan mereplikasi rekam medis secara menyeluruh sebagai database kedua tanpa persetujuan pengelola RME dan dasar hukum.
- Semua upload klinis berada dalam **private object storage**, menggunakan identitas objek acak, encryption at rest, signed URL singkat dan verifikasi akses sebelum penyajian; jangan menyimpan PHI di public CDN.
- Catatan final immutable secara logis dan hanya dimodifikasi via amendment; audit terpisah dan tahan manipulasi.
- Backup dan retention mengikuti klasifikasi data, ketentuan hukum dan persetujuan penanggung jawab klinis; **tidak menetapkan durasi arbitrer di PRD ini**.
- Data pengembangan, demo dan pengujian menggunakan data sintetis; dilarang menyalin data produksi ke staging/CI.

# 11. Arsitektur teknis hemat kompleksitas

## 11.1 Komponen target

```text
Android / iOS (Flutter)    Web responsif (Next.js)
            \             /
             TLS / Edge Security
                      |
               API (NestJS)
      [AuthN/AuthZ, booking, clinical adapter,
       dispatch, pharmacy, courier, billing,
       audit, maintenance integration]
                /      |       \
      PostgreSQL    Private     Existing RME
      + PostGIS     Object      (adapter aman)
                    Storage
                      |
              Adapters mitra
             Apotek / Kurir / Lab
```

**Pilihan desain:** satu API modular monolith yang jelas pemisahan domainnya; satu skema database terkelola/sekuritas setara (dengan akses private network), bukan microservices/cluster banyak server. Pilihan penyedia cloud dan detail wilayah pemrosesan harus memenuhi hasil penilaian legal/privasi; jangan mengasumsikan layanan CDN/global telah cocok untuk data klinis.

Flutter dapat membangun Android/iOS dari satu codebase, tetapi artefak iOS tetap memerlukan proses signing Apple, pengujian pada perangkat/lingkungan iOS, dan persetujuan distribusi yang benar. Web dokter, apotek, admin responsif; kurir dapat memakai mobile/PWA jika pengalaman dan keamanan terpenuhi. Tidak wajib membuat aplikasi native terpisah untuk seluruh role.

## 11.2 Backend boundaries

- Modul domain: `identity`, `users`, `services`, `patient`, `booking`, `triage`, `geo`, `workforce`, `dispatch`, `visits`, `clinical_adapter`, `prescription`, `pharmacy`, `delivery`, `billing`, `audit`, `notifications`, `maintenance`.
- Modul memiliki kontrak input/output bertipe, validasi schema, authorization guard, rate limit dan audit event.
- Semua operasi sensitif tervalidasi transactional/invariant; tidak mempercayai status dari frontend.
- Komunikasi adapter memiliki timeout, retry, idempotency, queue yang bisa diaudit, serta kill switch untuk mitra bermasalah.
- Tidak memerlukan Kafka/Redis/microservices pada tahap awal kecuali kebutuhan operasional nyata membuktikan manfaat. Background job boleh memakai queue sederhana yang tahan restart dan aman.
- Notifikasi WhatsApp/SMS/email hanya membawa informasi minimum; jangan mencantumkan diagnosis, foto atau isi rekam medis di pesan push.

## 11.3 RME dan SATUSEHAT

- RME existing adalah sistem pencatatan resmi; integrasi harus mendukung identitas pasien, encounter, catatan tindakan, resep yang sah, dan hasil sinkronisasi sesuai cakupan API vendor RME.
- Catatan harus memiliki status antrean/outbox dan reconciliation. Jika API tidak tersedia, gunakan prosedur perantara aman, terotorisasi dan dibuktikan; jangan mengirim informasi klinis melalui grup chat biasa.
- Integrasi SATUSEHAT mengikuti tanggung jawab dan identitas fasilitas yang sebenarnya serta dokumentasi use case FHIR yang relevan; **tidak** mengklaim koneksi SATUSEHAT sebelum credential, sandbox, mapping dan hasil uji tersedia.

# 12. Keamanan aplikasi: kebutuhan yang tidak boleh dipotong

## 12.1 Prinsip dan sasaran verifikasi

- Target rancangan web/API: **OWASP ASVS 5.0**, dengan **target Level 3 pada alur data dan kewenangan klinis yang berisiko tinggi**. Baseline sistem sekurang-kurangnya mengimplementasikan kontrol ASVS relevan berdasarkan matriks risiko; **label L3 tidak boleh diklaim** tanpa verifikasi persyaratan yang sesuai dan penilaian independen.
- Untuk Flutter Android/iOS gunakan **OWASP MASVS** serta panduan pengujian MASTG; mencakup penyimpanan, autentikasi, komunikasi, interaksi platform, kerahasiaan, dan resilience.
- Threat model wajib mencakup: kebocoran PHI, BOLA/IDOR, spoofing role, pendaftaran staf ilegal, penyalahgunaan OTP, akses kurir/apotek lintas tenant, upload berbahaya, resep palsu, kompromi akun vendor, workflow race, geofence bypass, webhook palsu, payment duplication, ransomware, penyalahgunaan log, dan kesalahan integrasi RME.
- Pemilihan layanan cloud atau agen AI **tidak** dianggap sebagai sertifikasi keamanan. Setiap kontrol harus memiliki bukti pengujian.

## 12.2 Kontrol identitas dan akses

| ID | Kontrol wajib | Bukti minimal |
|---|---|---|
| SEC-01 | RBAC dan ABAC ditegakkan pada setiap API, file, ekspor, job, webhooks | Negative permission tests role × object × action |
| SEC-02 | Deny-by-default dan larangan horizontal/vertical privilege escalation | Uji IDOR, manipulasi JWT/payload, perubahan context |
| SEC-03 | MFA dan autentikasi ulang untuk akun istimewa | Test login, reset, revoke, perangkat baru |
| SEC-04 | Status lisensi/izin SDM memblokir tugas baru bila tidak valid | Uji expired/suspended credential |
| SEC-05 | Akses dokter berbasis clinical relationship dan legal scope | Uji dokter membuka pasien di luar assignment |
| SEC-06 | Mitra apotek/kurir dibatasi tenant dan tugas | Uji lintas apotek/kurir tidak bisa melihat objek lain |
| SEC-07 | Vendor teknis tidak memiliki PHI access by default | Uji API, file, report dan log denial |
| SEC-08 | Owner/Operator tidak memperoleh PHI read hanya karena status kepemilikan bisnis | Uji admin/owner menebak URL/ID klinis |

## 12.3 Perlindungan data, perangkat, jaringan

- TLS berlaku untuk seluruh jalur produksi, HSTS pada web, konfigurasi CORS dan cookie ketat; jangan menaruh token di URL/log.
- Database private network, encryption at rest, akun database minimum, rotasi secrets dan backup independen terenkripsi; uji restore berkala.
- Obyek klinis privat; upload divalidasi tipe nyata, ukuran, scan bahaya, metadata stripping bila perlu, quarantine dan expiry URL; akses berdasarkan appointment/role.
- Perangkat mobile tidak menampilkan PHI pada notification preview; rahasiakan data pada recent-app snapshot jika relevan; cache minimal dan terhapus ketika logout/akun dicabut.
- Rekaman chat/audio/video, bila diaktifkan, tidak boleh memanfaatkan provider tanpa penilaian transfer data, retensi, consent dan kontrak pemrosesan yang memadai.
- Security headers, input validation, output encoding, anti-CSRF untuk sesi cookie, proteksi SSRF pada adapter/URL input, query parameterized, rate limiting login/upload/booking, anti-automation abuse.
- Jangan menggunakan data medis dalam prompt ke layanan AI eksternal tanpa desain pengendalian data dan persetujuan tata kelola terpisah; AI coding memakai data sintetis dan potongan kode bebas PHI.

## 12.4 Audit, insiden, akses darurat

- Catat `actor_id`, konteks role, resource reference yang diminimalkan, tujuan/perintah, hasil, waktu, request correlation, sumber, alasan akses istimewa; jangan log diagnosis, password, OTP, token dan gambar mentah.
- Audit kritis tidak dapat dihapus atau ditimpa oleh pelaku yang diaudit; ekspor/tamper detection terpisah dari aplikasi.
- Alur break-glass untuk tenaga klinis hanya bila kebijakan layanan mengizinkan, dibatasi waktu, alasan, MFA ulang, pemberitahuan, dan review independen; tidak menjadi akses bebas Vendor.
- Insiden privasi dan keamanan mengikuti runbook yang disetujui, termasuk containment, logging, backup, rotasi kredensial, evaluasi kewajiban notifikasi dan dokumentasi tindakan.
- **DPIA/penilaian dampak perlindungan data** disiapkan untuk pemrosesan data kesehatan berisiko tinggi sebelum produksi, dengan penetapan pengendali/pemroses dan perjanjian terkait.

# 13. SDLC, GitHub Actions, dan pemeliharaan Patah Pensil

## 13.1 Repository dan alur kerja

- Repository resmi: `patahpensil/madising`, **private**; master branch `main` terlindungi bila fitur paket mendukung.
- Satu monorepo dengan direktori `apps/mobile`, `apps/web`, `apps/api`, `packages/shared` (jika dibutuhkan), `docs`, `infra` dan `.github`.
- Alur perubahan: issue → feature branch → Pull Request → CI + review → staging → UAT → persetujuan rilis → deployment produksi.
- CI: formatting, lint, typecheck, unit test, integration tests, Flutter analyze/test, security/dependency/secret scanning, dan kontrol policy yang bisa diotomasi. Workflow tidak boleh mendistribusikan secrets pada PR yang tidak dipercaya.
- CD: staging otomatis hanya dengan synthetic data; produksi menggunakan environment approval, protected secrets/OIDC, deploy idempotent, smoke test, rollback, release tag.
- Patah Pensil bertindak sebagai vendor, namun rilis kritis dan restore tetap membutuhkan persetujuan yang dapat ditelusuri sesuai matriks kewenangan.
- Pemeliharaan minimal: monitoring, patch dependency, pembaruan platform Android/iOS, pencadangan, pengujian pemulihan, rotasi token, peninjauan akses mitra, analisis insiden, dan dokumentasi release.

## 13.2 Kriteria DoD (Definition of Done)

Sebuah fitur baru boleh dinyatakan **selesai** bila: acceptance criteria lulus; otorisasi API dan negative tests ada; respons error/loading/empty nyata; audit dan perlindungan PHI diuji; perubahan DB dan rollback aman; dokumentasi diperbarui; tidak ada secret/PHI dalam repo; staging lulus; dan persetujuan klinis tersedia jika fiturnya menyentuh perawatan pasien.

## 13.3 Batas peran AI coding

Agen AI membantu menulis kode, tes, dokumentasi, dan review awal, tetapi **tidak** otomatis mengesahkan kepatuhan atau keselamatan klinis. Keputusan klinis, review hasil uji keamanan dan persetujuan produksi tetap ditandatangani manusia yang berwenang.

# 14. Antarmuka dan pengalaman pengguna

1. **Referensi utama:** prototipe V1.3.7, palet premium deep teal/hijau gelap, mint dan warm-white, layout responsif, tipografi jelas, radius kartu besar, komponen status yang konsisten.
2. **Pasien:** katalog sembilan layanan dengan kartu, ringkasan, detail, petugas, syarat dan status aktif; CTA booking terpisah; informasi biaya ditampilkan sebelum konfirmasi.
3. **Enam pengalaman berbeda:** bukan satu dashboard dan sekadar mengganti label role; hindari role switcher publik yang bebas seperti prototipe demo.
4. **Mobile Android/iPhone:** navigasi nyaman satu tangan, keyboard dan ukuran interaksi sesuai platform, aksesibilitas, kinerja pada koneksi yang tidak stabil.
5. **Desktop:** dashboard Admin lebih padat data, dokter berorientasi clinical inbox, apotek berorientasi antrean order.
6. **State eksplisit:** loading, empty, pending approval, action denied, offline, retryable, permanently failed, success yang telah diverifikasi server.
7. **Aksesibilitas:** target WCAG 2.2 AA pada komponen relevan, kontras, ukuran sentuh, fokus keyboard, label input, notifikasi tidak hanya warna.
8. **Privasi:** identitas pasien tidak dibuka pada pratinjau notifikasi; grafik dan KPI Owner menggunakan agregasi.
9. **Teks legal dan medis:** bahasa Indonesia jelas, tidak menjanjikan dokter/tenaga tersedia secara otomatis dan tidak menyamakan layanan dengan respons gawat darurat.

# 15. Kebutuhan nonfungsional dan ketahanan operasional

| ID | Kriteria | Implementasi dan pengukuran |
|---|---|---|
| NFR-01 | Keamanan sebelum data nyata | Uji ASVS/MASVS berbasis risiko, pen-test/review independen cakupan kritis, temuan kritis/tinggi terselesaikan/ditangani sebelum go-live menurut kebijakan yang disetujui |
| NFR-02 | Respons UI | Tetapkan tolok ukur p95 untuk login, katalog, booking, list tugas dan upload berdasarkan pengukuran staging pada perangkat/jaringan representatif |
| NFR-03 | Integritas state | Idempotency dan transaksi; webhook duplikat tidak membuat order/tagihan ganda |
| NFR-04 | Keandalan RME | Outbox, retry, reconciliation, observabilitas dan fallback klinis yang sah |
| NFR-05 | Backup dan recovery | Backup terenkripsi di lokasi/akun terpisah, restore test terdokumentasi, RPO/RTO disahkan penanggung jawab klinis |
| NFR-06 | Audit | Semua akses PHI dan perubahan klinis/izin/pembayaran/maintenance sensitif dapat ditelusuri tanpa logging PHI berlebihan |
| NFR-07 | Skalabilitas | Arsitektur dapat menaikkan kapasitas aplikasi dan database ketika data pemakaian membuktikan kebutuhan |
| NFR-08 | Mobile | Uji Android/iOS nyata atau runner yang memadai; build/signing sesuai platform; pembaruan OS ditangani |
| NFR-09 | Lokasi | Geofence tervalidasi; alamat ambigu tidak memicu dispatch otomatis |
| NFR-10 | Kelangsungan layanan | Ada SOP manual aman jika server/RME/mitra offline; tidak ada clinical success palsu |
| NFR-11 | Interoperabilitas | Semua adapter versioned, punya sandbox/mock contract tests, idempotency dan error reporting |
| NFR-12 | Privasi | Data mapping, tujuan proses, hak akses, DPIA yang diperlukan, retensi dan kontrak pemroses ditetapkan |

**KPI teknis kuantitatif** (availability, RPO, RTO, response time, load, concurrency, log retention) diisi setelah profiling pilot dan risk assessment, kemudian ditandatangani sebagai SLO operasional. Tidak disajikan sebagai janji yang belum dapat diverifikasi.

# 16. Strategi rilis berurutan tanpa menurunkan gerbang keamanan

## R0 — Spesifikasi dan fondasi (nonklinis)

Hasil: PRD disahkan; pemetaan izin, skema data, threat model, desain arsitektur; prototipe dan katalog; repo private + CI; web/API/Flutter kerangka; data sintetis. **Tidak boleh** menerima data pasien nyata.

## R1 — Core Homecare pilot (kelayakan produksi terbatas)

- Pendaftaran pasien dan kurir, provisioning internal, MFA, audit, penetapan consent/kuasa.
- Katalog sembilan layanan dengan flag aktivasi; booking layanan yang telah siap, triase, Sidrap geofence, review Admin, jadwal, dispatch eligible.
- Dashboard Pasien, Perawat, Dokter, Admin nyata dan role-scoped; DB-PHA/DB-CUR tetap tersedia sesuai kebutuhan alur, tetapi aktivasi transaksi ditahan hingga mitra siap.
- Perawat: check-in, asesmen, konsultasi dokter, instruksi, consent, tindakan, dokumentasi privat, sinkronisasi RME atau prosedur bridging yang telah disahkan.
- Status dan laporan dasar; monitoring, backup/restore, dan prosedur insiden.
- **Gerbang go-live** seluruh kontrol keamanan dan keselamatan yang relevan harus lulus; layanan belum eligible tidak boleh diaktifkan.

## R2 — Apotek & pengantaran penuh

Resep sah, apotek yang diverifikasi, persetujuan harga, penyiapan, handoff, kurir aktif, proof of delivery, gagal/retur, penagihan terkait dan rekonsiliasi. Bisa diaktifkan bila RME dan kontrak/prosedur apotek/kurir mendukung.

## R3 — Layanan khusus dan optimasi

Aktivasi bertahap fisio, terapi, ibu-bayi, lab, caregiver serta workflow profesi sesuai SOP dan mitra. Paket perawatan berulang, dashboard KPI lebih lengkap, alur follow-up, automasi notifikasi yang disetujui, laporan wilayah per kecamatan dan optimasi ETA jika terbukti dibutuhkan. Tidak membuka hak klinis baru tanpa pengujian.

> **Catatan scope:** Menampilkan kesembilan kategori di V1.3.7 bukan berarti semua sembilan kategori dapat ditransaksikan saat R1. Transparansi status layanan adalah persyaratan produk. Semua dashboard dapat memiliki shell sejak awal, sementara tindakan aktif masing-masing mengikuti gerbang implementasi dan legalitas.

# 17. UAT, security tests, dan acceptance criteria

## 17.1 UAT lintas enam peran (wajib)

| ID | Pengujian | Hasil yang diterima |
|---|---|---|
| UAT-01 | Registrasi pasien dari luar Sidrap untuk pasien yang beralamat Sidrap | Diizinkan jika relasi kuasa sah; booking tervalidasi alamat tujuan |
| UAT-02 | Pendaftaran kurir baru | Belum dapat melihat/mengambil tugas sebelum approval Admin |
| UAT-03 | Signup dengan parameter `doctor/nurse/admin/pharmacy/vendor` | Backend menolak eskalasi peran |
| UAT-04 | Login keenam role | Tiap role masuk dashboard berbeda dan memiliki data sesuai scope |
| UAT-05 | Pasien memanggil endpoint dokter/Admin | Ditolak dan log audit sesuai kebijakan |
| UAT-06 | Vendor melihat profil/foto klinis via API/file/log | Ditolak; log teredaksi |
| UAT-07 | Owner membuka diagnosis tanpa relasi sah | Ditolak walau Owner merangkap Admin |
| UAT-08 | Dokter membuka pasien di luar encounter/clinical relationship | Ditolak atau mengikuti prosedur break-glass sah, bukan akses default |
| UAT-09 | Apotek A mencoba membuka order Apotek B | Ditolak |
| UAT-10 | Kurir X membuka order Kurir Y/foto klinis | Ditolak |
| UAT-11 | Perawat menerbitkan resep/dokter palsu | Ditolak backend |
| UAT-12 | Perawat SIP/izin/kompetensi kedaluwarsa | Tidak eligible dispatch; tugas aktif dievaluasi |
| UAT-13 | Booking di luar Sidrap / pin palsu | Ditolak atau ditahan review server-side |
| UAT-14 | Alamat tidak jelas/dekat batas administratif | Tidak dispatch sebelum Admin review |
| UAT-15 | Booking dengan gejala darurat | Booking rutin dihentikan, diarahkan ke layanan darurat |
| UAT-16 | Petugas terdekat tidak punya kompetensi | Tidak dipilih meski lebih dekat |
| UAT-17 | Dua tenaga menerima satu tugas bersamaan | Hanya satu assignment final |
| UAT-18 | Menolak consent tindakan/foto | Tindakan/bukti yang memerlukan consent tidak dilanjutkan; penolakan tercatat |
| UAT-19 | Perawat memulai tindakan yang perlu instruksi dokter | Ditahan hingga instruksi sah |
| UAT-20 | File klinis diunggah/disalin URL oleh pihak lain | Akses tanpa token dan scope sah ditolak; file scan/validasi bekerja |
| UAT-21 | Catatan final diedit | Amendment berjejak, tidak menimpa isi final |
| UAT-22 | RME tidak aktif atau callback error | Status pending/retry jelas, data tidak hilang, prosedur fallback sesuai klinis |
| UAT-23 | Resep tidak valid/obat kosong | Apotek menolak/eskalasi; pasien tidak mendapat status siap palsu |
| UAT-24 | Callback bayar/kurir ganda | Idempotent; tidak terjadi duplikasi pemenuhan/pembayaran |
| UAT-25 | Kurir gagal menyerahkan obat | Tidak menandai DELIVERED; bukti gagal dan tindak lanjut |
| UAT-26 | Akun nonaktif atau vendor dicabut | Sesi/akses dicabut, secrets terkait dirotasi sesuai prosedur |
| UAT-27 | Backup gagal atau restore test | Alert aktif, hasil uji dan integritas tercatat, restore memerlukan approval |
| UAT-28 | Push perubahan ke branch atau deploy produksi tanpa approval | Workflow sesuai perlindungan branch/environment memblokir operasi |
| UAT-29 | Log, push dan CI mengandung input mirip PHI/OTP/token | Masking/redaction dan secret scan bekerja; tidak bocor ke penerima tak sah |
| UAT-30 | Katalog 9 layanan di HP dan PC | Semua tampil sesuai desain; hanya ACTIVE dapat booking; copy tidak menipu pengguna |

## 17.2 UAT spesifik sembilan layanan

| Layanan | Pengujian wajib |
|---|---|
| Kunjungan dokter | Tidak masuk queue perawat; dokter aktif/berwenang tersedia sebelum konfirmasi |
| Tindakan keperawatan khusus | SOP, kompetensi, consent dan instruksi dokter bila perlu mencegah tindakan ilegal |
| Perawatan luka | Catatan luka dan kebutuhan rujukan/escalation; foto hanya jika diperlukan dengan consent dan privacy |
| Fisioterapi | Tidak dapat diassign ke akun perawat tanpa kewenangan profesi fisioterapi |
| Terapi tambahan | Jenis terapi dan tenaga sesuai bidang; permintaan masuk review |
| Pascaoperasi | Rencana pulang, tindak lanjut dan eskalasi klinis sesuai kasus |
| Lansia/pramurukti | Pekerjaan caregiver tidak mengaktifkan tindakan keperawatan |
| Ibu dan bayi | Wali/kuasa sah, profesi berwenang dan persetujuan yang sesuai |
| Laboratorium | Identitas dan label sampel, chain of custody, mitra laboratorium dan akses hasil sah |

## 17.3 Gerbang wajib sebelum melayani pasien nyata

Tidak ada go-live klinis sebelum:

1. Identitas penyelenggara/izin fasilitas/ketenagaan, SOP layanan dan scope profesi diverifikasi oleh penanggung jawab yang sah.
2. Data mapping RME, pengendali/pemroses data, kebijakan consent/retensi dan DPIA yang diperlukan selesai dan ditandatangani.
3. Autentikasi/otorisasi server-side, MFA, pemeriksaan tenant/tugas, upload privat, audit, backup dan restore berfungsi dengan bukti uji.
4. Threat model ditinjau; pengujian keamanan independen berbasis risiko dilakukan untuk alur klinis dan peran; temuan kritis/tinggi tidak dibiarkan tanpa penanganan yang dapat dipertanggungjawabkan.
5. Pengujian klinis dan UAT enam dashboard relevan lulus dengan skenario negatif dan kegagalan jaringan/RME/mitra.
6. Persetujuan final dari Owner, penanggung jawab klinis dan penanggung jawab keamanan dicatat; Patah Pensil melaksanakan rilis yang telah disetujui.
7. Store review, legal notices, privacy policy, incident contacts dan mekanisme support sudah siap sebelum publikasi aplikasi.

Jika syarat ini belum terpenuhi, penggunaan dibatasi **staging/demo dengan data sintetis**, meskipun UI terlihat siap.

# 18. Operasi, layanan pelanggan, dan model bisnis yang dapat dipantau

- Ukur jumlah booking per kategori, review→confirmed, confirmed→completed, pembatalan, no-show, rata-rata waktu respons, kapasitas petugas dan cakupan kecamatan.
- Ukur perawatan ulang **berdasarkan kebutuhan klinis**, bukan pemesanan berulang yang dipaksakan.
- Laporkan pengadaan obat/kurir, keterlambatan RME sync, refund, dan keluhan pasien tanpa data klinis berlebihan.
- Service-level target dan pembayaran aktual ditetapkan dalam SOP/komersial terpisah dari PRD ini; laporan tidak mengklaim SLA tanpa data.
- Tidak semua layanan memiliki volume yang cukup; owner dapat mengaktifkan atau menonaktifkan kategori menurut data kebutuhan, ketersediaan tenaga dan keselamatan.

# 19. Risk register dan mitigasi awal

| Risiko | Dampak | Pengendalian produk/teknis | Pemilik mitigasi |
|---|---|---|---|
| Bocor PHI melalui API, object storage atau log | Kritikal | ABAC, storage privat, redaction, audit, uji IDOR | Vendor + pengelola data |
| Tindakan oleh tenaga tak berwenang | Kritikal | Credential gate, SOP, validasi instruksi dokter dan assignment | Penanggung jawab klinis + Admin |
| Diagnosis/resep palsu | Kritikal | Identitas dokter, sign-off, server validation, audit, RME integration | Dokter/PJ klinis + vendor |
| Cakupan wilayah salah | Tinggi | Polygon geofence server, manual review, verifikasi ulang alamat | Admin + vendor |
| Vendor/Owner mengakses klinis tanpa hak | Tinggi | Akun terpisah, deny default, JIT, justifikasi dan audit | Owner + vendor + auditor |
| Mitra/RME offline | Tinggi | Queue/outbox/reconciliation, fallback manual aman dan status jelas | Admin/PJ klinis + vendor |
| Kehilangan data/ransomware | Kritikal | Backup off-host terenkripsi, least privilege, uji restore, patch | Vendor + Owner |
| Overpromising layanan belum tersedia | Tinggi | Flag `ACTIVE`, review, pengaturan kapasitas & copy jujur | Admin + PJ klinis |
| Kegagalan deployment | Tinggi | PR, CI, staging, approval, rollback | Patah Pensil |
| Fitur banyak di luar kesiapan operasional | Sedang/Tinggi | Release gates, modular monolith, scope per layanan | Owner |

# 20. Dependensi dan keputusan terbuka untuk sign-off

| ID | Keputusan yang masih dibutuhkan | Penanggung jawab |
|---|---|---|
| OPEN-01 | Identitas resmi fasilitas/pemberi layanan, cakupan izin dan PJ klinis | Owner + Dokter PJ |
| OPEN-02 | Daftar layanan yang **benar-benar aktif** pertama kali dan SOP masing-masing | Owner + Dokter PJ |
| OPEN-03 | Daftar tenaga, profesi tambahan, bukti kewenangan dan lokasi kerja | Owner/Admin + PJ klinis |
| OPEN-04 | Vendor/kontrak API RME, sandbox, mapping nomor pasien/kunjungan | RME owner + Patah Pensil |
| OPEN-05 | Metode konsultasi dokter serta penilaian layanan jarak jauh | PJ klinis + legal |
| OPEN-06 | Perjanjian mitra apotek, courier, lab, handling obat/sampel | Admin + mitra |
| OPEN-07 | Payment provider/merchant of record/refund/invoice | Owner/Finance |
| OPEN-08 | Persetujuan privasi, subjek data, retensi, DPIA dan kontrak pemroses | Pengendali data + legal |
| OPEN-09 | Penyedia hosting, lokasi pemrosesan dan strategi pemulihan | Owner + Patah Pensil |
| OPEN-10 | Ketersediaan perangkat pengujian iOS dan publikasi Android/iOS | Patah Pensil |
| OPEN-11 | Parameter SLO/RPO/RTO serta kapasitas layanan | Owner + PJ klinis + Patah Pensil |
| OPEN-12 | Persetujuan master PRD dan kedudukan dokumen ini sebagai pengganti V1.3.6 | Owner |

# 21. Change log dan traceability

| Aspek | Baseline | PRD V1.4.0 |
|---|---|---|
| Identitas produk | MADISING V1.3.4+ | Dipertahankan |
| Enam dashboard | V1.3.6 | Dipertahankan, dengan spesifikasi akses dan acceptance tests terkonsolidasi |
| Registrasi akun | ACCOUNT-LOCK V1.3.6 | Dipertahankan, disertai lifecycle dan pengujian negatif |
| Wilayah | SIDRAP-LOCK | Dipertahankan, geofence produksi ditegaskan |
| SDM/Owner/Vendor | STAFF-LOCK, GOVERNANCE-LOCK | Dipertahankan; Patah Pensil disebut vendor resmi proyek |
| Katalog | 9 layanan V1.3.7 | Dimasukkan ke master PRD dengan gate profesi dan aktivasi |
| UI/UX | Prototipe HTML V1.3.7 | Referensi visual tidak diubah oleh PRD; transisi role demo harus diganti dengan login nyata |
| Arsitektur | Konseptual sebelumnya | Modular monolith, satu codebase Flutter, web responsif, adapter RME |
| Keamanan | Kontrol dasar dan governance | Threat model, ASVS/MASVS, negative tests, DPIA, data minimization, go-live gates diperjelas |
| Rilis | Alur MVP dan mitra | Bertahap R0–R3; seluruh kategori terlihat, aktivasi sesuai kemampuan yang sah |
| Dokumen biaya | Rencana terpisah | Tidak ada nominal biaya di PRD |

# 22. Persetujuan dan pengendalian versi

Dokumen ini adalah **draft pengganti terstruktur** untuk PRD V1.3.6 berdasarkan desain V1.3.7. Belum otomatis mengubah keputusan yang sebelumnya dikunci. Implementasi dilakukan berdasarkan acceptance criteria dan ketentuan yang telah disahkan. Revisi PRD dilakukan melalui Pull Request dengan ringkasan perubahan dan analisis dampak terhadap privasi/keamanan/klinis.

Tanda persetujuan yang dibutuhkan:

- **Owner MADISING:** ruang lingkup produk, prioritas layanan, alur operasional, dan penetapan vendor Patah Pensil.
- **Dokter penanggung jawab klinis:** SOP, eligibility, triase, instruksi, rujukan, dokumentasi dan ruang lingkup layanan.
- **Penanggung jawab data/privasi:** kepatuhan pengolahan data, kontrol akses, integrasi, retensi, kontrak pemrosesan dan DPIA.
- **Vendor Patah Pensil:** kelayakan teknis, implementasi, pengujian, operasi, backup, dan CI/CD.

# 23. Referensi normatif dan sumber teknis

**Dokumen internal:**

- `MADISING_PRD_V1.3.6_Registrasi_Dashboard_Terkunci.md` — dasar ketentuan terkunci.
- `MADISING_UIUX_Prototype_V1.3.7_Katalog_9_Layanan_Sidrap.html` — referensi pengalaman pengguna terbaru.
- `MADISING_Addendum_Katalog_Layanan_V1.3.7.md` — sembilan layanan dan gate profesi.

**Sumber resmi/standar, diperiksa 6 November 2026:**

1. UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi: https://jdih.komdigi.go.id/produk_hukum/view/id/832/t/crc32/ (data kesehatan merupakan data pribadi spesifik; penilaian dampak untuk pemrosesan berisiko tinggi).
2. Permenkes No. 24 Tahun 2022 tentang Rekam Medis, status berlaku: https://jdih.kemkes.go.id/documents/peraturan-menteri-kesehatan-nomor-24-tahun-2022 .
3. Permenkes No. 11 Tahun 2025 tentang standar kegiatan usaha dan produk/jasa dalam perizinan berusaha subsektor kesehatan: https://jdih.kemkes.go.id/documents/peraturan-menteri-kesehatan-nomor-11-tahun-2025 . Perizinan spesifik setiap layanan tetap harus ditelaah penanggung jawab berwenang.
4. OWASP ASVS 5.0.0 (rilis stabil): https://asvs.owasp.org/ .
5. OWASP MASVS: https://mas.owasp.org/MASVS/ .
6. Dokumentasi interoperability SATUSEHAT, HL7 FHIR dan penggunaan sandbox: https://satusehat.kemkes.go.id/platform/docs/id/api-catalogue/integrations/ .
7. Permenkes No. 20 Tahun 2019 tentang telemedicine antar fasilitas pelayanan kesehatan: https://jdih.kemkes.go.id/documents/peraturan-menteri-kesehatan-nomor-20-tahun-2019 . **Bukan** dasar otomatis untuk setiap model konsultasi langsung ke pasien; ruang lingkup MADISING memerlukan telaah regulasi terkini.

---

**Akhir PRD V1.4.0 — Untuk Tinjauan Pemilik.**