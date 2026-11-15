# MADISING
## PRODUCT REQUIREMENTS DOCUMENT (PRD) — V1.4.3
### Layanan keperawatan di rumah, penugasan tenaga, dan koordinasi klinis

| Atribut | Ketentuan |
|---|---|
| Nama produk | **MADISING** |
| Pemilik/penyelenggara | Owner MADISING adalah dokter yang sekaligus Dokter Penanggung Jawab Klinis homecare. Operasional aplikasi harian dijalankan oleh satu akun Admin yang dipegang tenaga medis yang ditunjuk Owner. |
| Vendor pengembang dan pemelihara | **Patah Pensil** (pemilik kode/repository dan penanggung jawab pengembangan, arsitektur, keamanan teknis serta maintenance; bukan Owner MADISING, bukan Admin, bukan pemberi layanan kesehatan; akses teknis terpisah dari akses klinis/operasional) |
| Dokumen | PRD V1.4.3 — baseline pilihan pengembangan 15 November 2026; pengesahan klinis, legal dan data tetap mengikuti gerbang yang berlaku |
| Tanggal | 15 November 2026 |
| Referensi pengalaman pengguna | §14 dan `reference/MADISING_UIUX_Core_V1.4.2.html` (demo sintetis); V1.3.7 menjadi arsip visual pendukung |
| Baseline persyaratan terkunci | PRD V1.3.6: SIDRAP-LOCK, STAFF-LOCK, ACCOUNT-LOCK, ROLE-LOCK, GOVERNANCE-LOCK, IDENTITY-LOCK |
| Cakupan geografis pilot | Kabupaten Sidenreng Rappang (Sidrap), Sulawesi Selatan |
| Kanal utama | Flutter Android/iOS untuk pasien dan perawat; mobile/PWA untuk kurir; web responsif untuk dokter, apotek, dan Admin/Owner |
| Status sistem | PRD implementasi; **bukan** pernyataan bahwa sistem telah lulus pengujian keamanan atau sudah layak melayani pasien nyata |

> **Aturan dokumen:** PRD menetapkan perilaku, kontrol, kriteria uji, urutan rilis, dan tanggung jawab. PRD ini tidak memuat nominal biaya pembangunan atau maintenance. Batas sumber daya pengembangan diperlakukan sebagai kendala desain internal, **tidak** sebagai alasan meniadakan keselamatan pasien atau perlindungan data.

---

# 1. Ringkasan eksekutif

MADISING adalah sistem operasional untuk **layanan homecare milik sendiri** di Sidrap, bukan marketplace terbuka. MADISING mengoordinasikan katalog layanan, registrasi pasien, triase awal, pemesanan, penugasan tenaga berwenang, kunjungan rumah, koordinasi dokter, pendokumentasian layanan, rekam medis elektronik (RME) yang sudah ada, pemenuhan resep oleh apotek mitra, pengantaran obat oleh kurir, administrasi, dan pemeliharaan oleh Patah Pensil.

**Tujuan utama:** menghubungkan pasien dengan perawat MADISING untuk pelayanan di rumah. Pasien memesan, sistem mencari perawat berwenang, perawat menerima tugas, menuju alamat pasien, melakukan asuhan, dan mendokumentasikan hasil. Dokter memberi pelayanan medis langsung atau dukungan klinis jika dibutuhkan. Pengalaman pemesanan mengikuti pola layanan on-demand, bukan model marketplace terbuka atau aplikasi telemedicine yang berpusat pada konsultasi dokter.

**Prinsip produk:**

1. **Safety first:** tanda gawat darurat tidak diproses sebagai booking biasa; tindakan hanya oleh personel yang kompeten, berwenang, serta berdasarkan keputusan/instruksi yang sah.
2. **Six-dashboard lock:** tepat enam dashboard operasional. Developer Console Patah Pensil adalah konsol teknis terpisah, bukan dashboard pelayanan ketujuh.
3. **Interoperabilitas SATUSEHAT sebagai prioritas:** mulai R0, Patah Pensil menilai jalur RME existing maupun integrasi langsung yang memenuhi persyaratan fasyankes/partner system. RME existing tetap sumber catatan medis sampai keputusan integrasi dan klasifikasi data klinis OPEN-04 diselesaikan; MADISING tidak otomatis menjadi RME baru.
4. **Privacy by design:** data pasien dan berkas klinis hanya diterima, disimpan, diteruskan, dan ditampilkan sejauh dibutuhkan oleh peran yang sah.
5. **Lean engineering:** satu basis kode Flutter untuk Android/iOS, web responsif, backend modular monolith, database terpusat, integrasi melalui adapter; tidak membuat layanan infrastruktur kompleks tanpa kebutuhan terbukti.
6. **Operasional yang dapat diverifikasi:** status layanan, penugasan, persetujuan, pembayaran, sinkronisasi dan kegagalan harus nyata di backend, bukan sekadar animasi UI.
7. **Incremental release:** seluruh kategori ada dalam katalog, tetapi dapat diaktifkan per layanan hanya setelah SDM, SOP, izin, harga, wilayah, dan mitranya terbukti siap.
8. **Nurse-led, physician-supported:** perawat menjalankan asuhan keperawatan sesuai kewenangan; tidak perlu order dokter untuk setiap tindakan mandiri. Keputusan medis tetap pada dokter berwenang. Kunjungan dokter dan profesi khusus memiliki jalur tersendiri.

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
| ROLE-LOCK | Setiap pengguna hanya dapat memakai resource dan tindakan yang diizinkan untuk peran dan penugasannya; dashboard utama tetap enam. |
| STAFF-LOCK | Owner menyeleksi; Admin memeriksa dokumen dan mengundang setelah pemeriksaan kompetensi/kredensial serta persetujuan yang berlaku. |
| SIDRAP-LOCK | Booking divalidasi dari **tujuan kunjungan**, bukan posisi pemesan. Hanya Sidrap dalam pilot. |
| GOVERNANCE-LOCK | Owner boleh juga menjadi Admin dengan audit konteks terpisah; Patah Pensil beridentitas teknis dan memperoleh sarana maintenance wajib; tidak mendapat akses rutin rekam medis. |
| CLINICAL-LOCK | Diagnosis medis/resep dokter; diagnosis dan asuhan keperawatan oleh perawat sesuai kewenangan; tindakan yang mensyaratkan instruksi atau pelimpahan kewenangan hanya setelah syarat sah dipenuhi; consent dan RME existing dipertahankan. |
| SERVICE-CATALOG-LOCK | Kesembilan kategori V1.3.7 tercantum; ketersediaan aktual tetap berdasarkan persetujuan aktivasi layanan. |
| PROTOTYPE-LOCK | V1.3.7 merupakan referensi historis. Untuk alur inti pasien, perawat, dan dokter, §14 dan prototipe V1.4.2 menjadi acuan perilaku serta tata letak; tidak meniru merek atau aset pihak lain. Prototipe bukan bukti implementasi atau keamanan. |

**Klarifikasi tata kelola V1.4.1 (change request atas interpretasi GOVERNANCE-LOCK; baris LOCK historis dipertahankan):** Owner, Admin dan Vendor adalah pihak berbeda. Patah Pensil berwenang mengambil keputusan rekayasa perangkat lunak dan menjalankan kontrol teknis tanpa meminta Owner memahami JSON, database, CI/CD atau rincian API. Owner sebagai PJ Klinis menetapkan keputusan pelayanan, dan penyelenggara MADISING tetap menentukan dasar, tujuan serta otorisasi sah pemrosesan data pasien. Perubahan dari persetujuan teknis oleh Owner menjadi tata kelola teknis Vendor didaftarkan sebagai **CR-TECH-01** untuk penyelarasan OPEN-12; tidak menghapus gerbang legal, klinis, privasi atau ketentuan break-glass §12.4.

Perubahan ketentuan terkunci didokumentasikan sebagai change request beserta dampak keamanan, privasi dan klinis. Patah Pensil menentukan implementasi teknis; keputusan yang mengubah pelayanan, penggunaan data pasien atau kewajiban penyelenggara tetap memerlukan otorisasi pihak MADISING yang berwenang. Item yang belum mendapat persetujuan substantif tidak dianggap efektif hanya karena PR dokumentasi diterbitkan.

## 2.2 Fakta yang dilaporkan pemilik vs hal yang belum diverifikasi

**Dikonfirmasi pemilik (6 November 2026):** Owner MADISING adalah dokter sekaligus Dokter Penanggung Jawab Klinis homecare; satu akun Admin operasional harian dipegang tenaga medis yang ditunjuk Owner; Vendor Patah Pensil adalah pihak eksternal terpisah, bukan Owner, Admin, atau pemberi layanan kesehatan.

**Dilaporkan telah tersedia oleh pemilik:** fasilitas/klinik, dokter, perawat, RME, apotek mitra dan kurir mitra. Status dokumen dan identitas fasilitas, cakupan izin per kategori layanan, PJ RME, konektivitas RME, kesiapan apotek dan kurir **belum divalidasi dalam PRD ini**.

**Belum final dan harus diputuskan sebelum aktivasi terkait:** identitas fasilitas, izin per layanan, dan penanggung jawab RME; daftar tenaga dan izin per tindakan; kontrak/persetujuan pemrosesan data; API atau prosedur kerja aman dengan RME, apotek, kurir dan laboratorium; batas retensi; metode pembayaran/refund; geofence administratif resmi; parameter RPO/RTO dan tingkat layanan respons; ketentuan konsultasi jarak jauh; kebijakan perwakilan pasien anak/lansia dan pembuktian kewenangan kuasa.

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

Peran pendukung CCO (koordinator klinis) dan FIN (keuangan) adalah **scope izin** di workspace terkait, bukan dashboard tambahan. Profesi fisioterapis, bidan, terapis, petugas laboratorium, dan pramurukti **belum memiliki dashboard sendiri** dan tidak boleh memperoleh hak perawat/dokter hanya untuk mempersingkat implementasi. Desain aksesnya merupakan **OPEN-14** dan harus mematuhi SIX-DASHBOARD-LOCK. **Opsi untuk dinilai (belum diputuskan):** workspace lapangan di dashboard yang sudah ada, dengan kode role profesi terpisah, bukan `NRS`, serta pembatasan izin berdasarkan profesi dan penugasan.

## 3.2 Developer Console — Patah Pensil

Konsol teknis **di luar** keenam dashboard. Wajib mengelola status sistem, deployment, job/integrasi, backup, troubleshooting, notifikasi insiden, aktivitas audit teknis, dan pencabutan akses. Konsol **tidak** mengungkap rekam medis, foto, diagnosis, resep, nomor identitas pasien, atau token produksi pada penggunaan rutin.

### 3.2.1 Pemisahan kewenangan Owner–Admin–Vendor

- **Owner MADISING (dokter sekaligus PJ Klinis):** satu akun `INTERNAL` untuk `OWN` (dan konteks `ADM` bila dipakai) serta satu akun `CLINICIAN` terpisah untuk `DOC`, masing-masing memakai kredensial, MFA dan audit sendiri. Akses PHI oleh Owner hanya melalui akun/konteks `DOC` dengan relasi perawatan yang sah, **tidak pernah** lewat `OWN/ADM`. Kehadiran konteks `OWN` tidak membenarkan akses klinis otomatis.
- **Admin operasional:** satu akun `INTERNAL` dengan role `ADM`, MFA wajib dan tidak mempunyai akses PHI bebas. Karena pemegang akun Admin adalah tenaga medis, Owner **dapat** memberikan scope `CCO` untuk penilaian kelayakan klinis awal di `ADMIN_REVIEW`; pemberian scope tercatat, dapat dicabut dan diaudit. Scope `CCO` tidak otomatis aktif dan bukan kewenangan diagnosis, instruksi atau resep dokter.
- **Vendor Patah Pensil:** akun terpisah berjenis `VENDOR` dengan role `VEN`, tanpa akses PHI default, tanpa role `ADM/OWN`, dan bukan pemberi layanan kesehatan.
- **Tata kelola operasi teknis — CR-TECH-01:** Patah Pensil menentukan arsitektur, database, API, implementasi keamanan, CI/CD, jadwal rilis, patch, backup/restore, dan rotasi kredensial teknis. **Persetujuan teknis operasional dikelola Patah Pensil**, dengan gerbang pengujian, pengendalian hak istimewa, pencatatan perubahan, dan audit; **Owner tidak diwajibkan memahami atau menyetujui detail teknis tiap tindakan**. Bila tindakan akan membuka PHI, mengubah tujuan pemrosesan data, memulihkan data klinis yang berdampak pada pelayanan, atau mengaktifkan layanan klinis baru, otorisasi sah dari MADISING sebagai pengendali/PJ Klinis tetap diperlukan sesuai cakupan dan kontrak. Tidak boleh memakai kewenangan Vendor untuk melampaui izin klinis/data. Ketentuan historis tentang persetujuan independen untuk operasi berisiko dicatat sebagai **perubahan tata kelola yang belum efektif sampai OPEN-12/OPEN-18 diselesaikan**, bukan dihapus diam-diam.
- **Aktivasi staf — STAFF-LOCK:** Owner menyeleksi dan menyetujui tenaga/staf; Admin memeriksa dokumen/kredensial dan mengirim undangan sesuai persetujuan serta pemeriksaan kewenangan yang berlaku. Aktivasi tidak boleh mendahului persetujuan Owner dan syarat klinis yang relevan.
- **Kepemilikan kode dan data (GOV-07 CR, efektif setelah OPEN-12):** Repository dan kode sumber dimiliki serta dikelola **Patah Pensil** sebagai pengembang. Data pasien produksi dan backup dikendalikan **MADISING**; Patah Pensil bertindak sebagai pemroses sesuai pengaturan yang harus dipastikan melalui OPEN-18. Akses ke PHI hanya dengan dasar, cakupan dan otorisasi sah dari MADISING, dapat dicabut dan wajib diaudit; akses ke sistem teknis tersanitasi tidak sama dengan hak baca PHI. Pemilihan hosting/DNS/arsitektur merupakan keputusan teknis Patah Pensil, sedangkan pengaturan pengendalian data, lokasi pemrosesan serta serah terima yang mengikat MADISING ditetapkan melalui OPEN-09 dan kontrak.
- **Vendor bukan Admin (menggantikan GOV-03 V1.3.6; change request, efektif setelah OPEN-12):** Vendor **tidak dapat ditunjuk sebagai Admin operasional** dan tidak memegang role `ADM`/`OWN`. Ketentuan lama GOV-03 serta turunan ACC-11/ACC-T14 ditandai untuk diselaraskan melalui change request ini; identitas teknis `VEN` tetap terpisah.

## 3.3 Matriks akses minimum (ringkasan)

Legenda: `Y` diperbolehkan dengan scope; `L` terbatas metadata/status; `—` dilarang. Semua otorisasi diverifikasi **di server** terhadap hubungan perawatan, penugasan, afiliasi mitra, kepemilikan, dan status akun.

| Resource/Aksi | PAT | NRS | DOC | PHA | CUR | ADM/OWN | VEN |
|---|---|---|---|---|---|---|---|
| Buat booking sendiri/kuasa sah | Y | — | — | — | — | L | — |
| Kelola booking/dispatch | L | L (sendiri) | L | — | — | Y (operasional; CCO¹ terbatas) | — |
| Asesmen & dokumentasi perawatan | L sesuai hak | Y (ditugaskan) | Y (relasi sah) | — | — | — | — |
| Diagnosis medis/instruksi/resep | L sesuai hak | L (instruksi) | Y (dokter berwenang) | L (resep dialokasikan) | — | — | — |
| Diagnosis, rencana dan evaluasi keperawatan | L sesuai hak | Y (ditugaskan, kompeten) | L (relasi sah untuk koordinasi) | — | — | — | — |
| Mandat medis dan pencabutan | L sesuai hak | L (penerima; laporan sendiri) | Y (pemberi berwenang) | — | — | — | — |
| Penawaran tugas dan lokasi perjalanan | L (petugas assigned, EN_ROUTE) | Y (penawaran sendiri; lokasi sendiri) | — | — | — | L (operasional, minimum) | — |
| Order apotek | L | — | L | Y (mitra terkait) | L (logistik) | L | — |
| Delivery | L | — | — | L | Y (ditugaskan) | L | — |
| Credentialing SDM/mitra | — | L (diri sendiri) | L (diri sendiri) | L (mitra) | L (diri) | Y | — |
| Ringkasan dan tagihan | L (milik) | — | — | L (terkait) | L (terkait) | Y | — |
| Infrastruktur/CI/CD/backup | — | — | — | — | — | L (monitoring dampak layanan/data; bukan approval teknis rutin) | Y (scope teknis dan audit) |

**¹ Catatan scope CCO pada kolom ADM/OWN:** khusus **Admin ber-role `ADM` yang diberi scope `CCO` oleh Owner**, penilaian kelayakan klinis awal di `ADMIN_REVIEW` boleh membaca data triase/keluhan **minimum yang diperlukan**, dengan audit. Scope ini **bukan akses diagnosis, resep atau RME** dan **belum diimplementasikan**. Kolom ADM/OWN untuk **Asesmen & dokumentasi perawatan** dan **Diagnosis medis/instruksi/resep** tetap `—`; konteks `OWN` tidak otomatis memperoleh scope CCO.

Rincian izin per endpoint diterbitkan sebagai lampiran `AUTHZ_MATRIX` sebelum implementasi API klinis. Tidak ada izin wildcard untuk PHI.

## 3.4 Kewenangan klinis (clinical authority)

| Ruang lingkup | Dokter (DOC) | Perawat (NRS) |
|---|---|---|
| Pemeriksaan/pengkajian | Pemeriksaan medis sesuai kompetensi dan relasi pelayanan | Pengkajian keperawatan, tanda vital, identifikasi kebutuhan dan tanda bahaya |
| Diagnosis | Diagnosis medis | Diagnosis keperawatan; dilarang menetapkan diagnosis penyakit |
| Rencana dan evaluasi | Menentukan, mengubah, menghentikan terapi medis; evaluasi dan rujukan | Menetapkan, melaksanakan, mengevaluasi dan merevisi rencana asuhan keperawatan sesuai kewenangan |
| Obat | Meresepkan dan mengubah terapi dalam scope praktik yang sah | Melaksanakan pemberian sesuai order/pelimpahan yang dipersyaratkan; tidak menerbitkan resep atau mengubah dosis secara mandiri |
| Tindakan | Tindakan medis sesuai kompetensi | Tindakan keperawatan mandiri yang diizinkan; tindakan kolaboratif/pelimpahan sesuai syarat |
| Keselamatan | Menilai kebutuhan pemeriksaan langsung/rujukan | Menahan tindakan tidak aman, memberi pertolongan sesuai kompetensi dan SOP, eskalasi/rujukan sesuai kewenangan |
| Dokumentasi | Catatan medis, keputusan dan pengawasan | Catatan asuhan, pelaksanaan, respons pasien dan laporan kepada pemberi mandat |

Admin, Owner dalam konteks OWN/ADM, Vendor dan profesi lain tidak memperoleh hak DOC/NRS dari jabatan atau tampilan dashboard. Scope CCO tetap terbatas sebagaimana §3.3. Dokter tidak diwajibkan mengesahkan setiap asuhan mandiri; pengecualian review hanya menurut SOP yang disahkan. Diagnosis keperawatan, diagnosis medis, dan instruksi medis disimpan sebagai tipe data dan izin berbeda.

## 3.5 Pelimpahan kewenangan

Dasar rancangan: Permenkes 13/2025 Pasal 182–184 dan Standar Profesi Perawat (Kepmenkes HK.01.07/MENKES/425/2020). Pimpinan fasyankes menetapkan jenis pelayanan yang dapat dilimpahkan berdasarkan kebutuhan dan kompetensi. Mandat dan delegasi harus tertulis; order elektronik hanya berlaku bila bentuk pengesahan, identitas, izin dan SOP sah telah diverifikasi.

- Mandat: pemberi berwenang mengawasi, keputusan tidak dialihkan, tanggung jawab pelimpahan tetap pada pemberi; penerima kompeten melaporkan hasil dan bertanggung jawab atas pelaksanaan sesuai kewajibannya. Order tidak dengan sendirinya merupakan mandat yang sah.
- Delegasi: hanya jika kondisi berhalangan dan syarat Pasal 184 terpenuhi, kepada penerima terlatih dan kompeten, dengan tanggung jawab kewenangan yang didelegasikan beralih serta kewajiban laporan. Tidak digunakan sebagai pengganti dokter yang sesaat offline. **Tidak diaktifkan pada R1**; tidak ada tombol delegasi sebelum kebijakan fasyankes, legal, scope, pengawasan/pertanggungjawaban dan pengujian disahkan.
- Jika dokter tidak tersedia dan tindakan membutuhkan mandat/order baru atau pengawasan yang tidak dapat dipenuhi, tahan tindakan dan tawarkan konsultasi, penjadwalan ulang atau rujukan yang aman. Tidak ada auto-approval.

Jenis tindakan belum boleh dianggap sah hanya dari contoh di PRD. PJ Klinis bersama pimpinan fasyankes yang berwenang mengesahkan daftar tindakan, batas kompetensi, SOP, prasyarat, pengawasan, dan bentuk pengesahan sebelum aktivasi.

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

State katalog: `DRAFT → VERIFIED → ACTIVE ↔ SUSPENDED → RETIRED`. Hanya `ACTIVE` boleh menghasilkan booking terkonfirmasi. Transisi ke `VERIFIED` dan `ACTIVE` **memerlukan sign-off Owner sebagai Dokter PJ Klinis** setelah kesiapan personel dan tata kelola terkait ditelaah; Admin tidak dapat mengaktifkan layanan sendiri. Perubahan ketersediaan petugas tidak otomatis mengubah legalitas layanan. Layanan `DRAFT/SUSPENDED` dapat ditampilkan sebagai “Belum tersedia” jika sesuai kebijakan, tetapi **tanpa tombol booking aktif**.

## 4.3 Alur layanan khusus

- Kategori `doctor`, `physio`, `therapy`, `elderly`, `mother_baby`, `lab` **tidak** langsung diassign ke akun perawat. Admin memeriksa kebutuhan dan memetakan tenaga/mitra berwenang.
- Kategori `special_nursing`, `wound`, `postop` boleh masuk alur perawat hanya bila tipe tindakan, kewenangan, SOP dan prasyarat perawatan memenuhi aturan. Kondisi yang memerlukan instruksi dokter wajib menunggu order sah.
- Pramurukti nonmedis dipisahkan dari tugas perawat; tidak ada prosedur klinis yang dapat dieksekusi lewat akun caregiver.
- Lab harus mempunyai identitas permintaan dan pasien, label sampel, waktu pengambilan, kondisi transport, penerimaan lab, hasil rujukan, dan akses hasil yang dibatasi.
- Pemantauan pasien rentan (anak/lansia) memperhitungkan persetujuan dari pihak yang berwenang dan relasi wali/kuasa.

Pada `ADMIN_REVIEW`, Admin menangani aspek administratif dan, **bila diberi scope `CCO` oleh Owner**, penilaian kelayakan klinis awal. Keputusan diagnosis, instruksi dan resep tetap berada pada dokter berwenang. Tanpa scope `CCO`, Admin tidak dapat menyatakan kelayakan klinis.

## 4.4 Matriks tindakan internal (bukan kategori katalog baru)

Setiap versi tindakan dalam katalog memiliki klasifikasi `NURSING_INDEPENDENT`, `ORDER_REQUIRED`, `MANDATE_REQUIRED`, `MEDICAL_DOCTOR_ONLY`, `OTHER_PROFESSION` atau `UNCLASSIFIED`. Satu kategori dapat memuat beberapa jenis tindakan. Keadaan darurat adalah jalur eskalasi, bukan SKU yang dijual. Status `UNCLASSIFIED` menolak konfirmasi tindakan klinis.

| ID kebijakan | Ketentuan | Contoh untuk penilaian PJ Klinis, bukan izin otomatis |
|---|---|---|
| CLA-01 | Asuhan mandiri berdasarkan scope perawat, SOP dan consent; tidak meminta order dokter tanpa dasar | Pemantauan tanda vital, edukasi, pencegahan luka tekan, mobilisasi sesuai kondisi |
| CLA-02 | Tindakan dengan order: instruksi medis sah, kondisi klinis dan kompetensi cocok | Perawatan berdasarkan rencana terapi/pascaoperasi |
| CLA-03 | Tindakan dengan mandat: tambahan pelimpahan tertulis, pengawasan dan laporan yang sah | Terapi infus/injeksi bila memang dinilai perlu dan diizinkan |
| CLA-04 | Dokter saja dalam model aplikasi | Diagnosis medis, resep, keputusan terapi |
| CLA-05 | Profesi lain | Tidak menggunakan role NRS sebagai pengganti |
| CLA-06 | Tolak jika izin, scope, SOP, consent, order/mandat atau pengawasan tidak terpenuhi | Tidak ada override administratif; gunakan jalur eskalasi |

Klasifikasi contoh tidak mengaktifkan tindakan apa pun. Versi aturan menyimpan profesi, tindakan, scope/kompetensi, batas kondisi, prasyarat, SOP, kebutuhan order/mandat, persetujuan pasien, pengawasan, fallback, tanggal efektif, masa berlaku dan persetujuan pimpinan fasyankes/PJ Klinis. Perubahan rule membatalkan kelayakan yang tidak lagi sah sebelum eksekusi; histori dipertahankan. Jika beberapa prasyarat berlaku, semuanya harus dipenuhi.

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

**Padanan istilah historis V1.3.6 (bukan status kanonik baru):** `DOCUMENT_REVIEW` / `DOCUMENT_VERIFIED` → `DOC_CHECKED`; `CLINICAL_REVIEW` / `CLINICALLY_CLEARED` → `CLINICAL_CHECKED`; `LEGAL_VERIFIED` → `LEGAL_CHECKED`. Penamaan kanonik tetap sebagaimana dua baris tenaga klinis dan apotek di atas serta model data yang sudah disiapkan.

**Cabang STAFF-LOCK V1.3.6 §2B yang wajib dipertahankan:** `REJECTED`, `ON_HOLD`, `EXPIRED`, `OFFBOARDED`. Semuanya **tidak dapat mengambil tugas**. Dokumen rusak/ambigu atau SIP tidak cocok harus diproses ke `ON_HOLD`, bukan lolos otomatis. Hubungan cabang ini dengan status utama, revokasi sesi dan evaluasi tugas aktif harus ditangani pada implementasi identitas.

**Batas implementasi:** Branch identitas (PR #3, masih Draft) telah menambahkan `ON_HOLD` dan `OFFBOARDED` ke `accounts.state` dalam migrasi `001_identity_authz.sql`; `REJECTED` sudah tersedia pada `accounts.state` dan `EXPIRED` pada `role_bindings.credential_state`. Penambahan status SQL **bukan** implementasi state machine rekrutmen lengkap: transisi, penilaian tugas aktif, revokasi sesi, dan pemeriksaan provisioning masih harus dibangun dan diuji. Perubahan PR #3 belum tergabung ke `main`, sehingga status ini belum boleh disebut aktif dalam produksi.

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

1. Beranda menampilkan CTA utama **Pesan perawat**, alamat kunjungan, dan katalog sembilan layanan. CTA mengarah ke pemilihan kebutuhan keperawatan yang aktif, bukan menambah kategori kesepuluh. Kunjungan dokter dan profesi khusus tetap dapat dipilih sesuai jalurnya.
2. Pilih untuk diri sendiri atau pasien yang diwakili dengan **kuasa terverifikasi**.
3. Isi keluhan/tujuan dan triase tanda bahaya. Jika red flag: jelaskan sistem **bukan layanan darurat**; hentikan booking rutin dan arahkan ke pertolongan darurat, sertakan tombol kontak yang sesuai tanpa janji layanan ambulans.
4. Pilih alamat kunjungan Sidrap via GPS atau manual; server melakukan geofence dan verifikasi lokasi.
5. Pilih kunjungan secepatnya jika kapasitas tersedia atau jadwalkan kunjungan; tampilkan biaya/komponen yang valid, syarat layanan, dan consent. Tidak ada jaminan perawat tersedia atau prosedur yang diminta pasti dilakukan.
6. Server buat `REQUESTED`; untuk layanan khusus ke `ADMIN_REVIEW`; untuk alur perawat ke `ELIGIBILITY_CHECK`.
7. Sistem menampilkan nomor booking dan status nyata. Tidak ada pesan “petugas ditugaskan” sebelum assignment backend berhasil.
8. Pasien menerima konfirmasi, update berjenjang, pembatalan/reschedule menurut ketentuan dan bukti pembayaran bila diproses.

## 7.2 Triage dan pemilihan tenaga

- Triage adalah **skrining awal**, bukan diagnosis otomatis.
- Urutan matching: jenis layanan → kewenangan/sertifikat/izin yang masih berlaku → kompetensi tindakan → ketersediaan → cakupan alamat → waktu perjalanan realistis → kapasitas tugas.
- Untuk kategori berprofesi khusus, Admin membuat tugas hanya pada resource personel/mitra berwenang setelah persyaratan diverifikasi. Ketiadaan tenaga menghasilkan penolakan/penawaran penjadwalan ulang secara transparan.
- Dua petugas tidak boleh menerima booking sama secara bersamaan; klaim dan assignment atomik dengan idempotency key dan pencatatan pelaku.
- Manual override oleh Admin memerlukan alasan dan **tidak** boleh melewati eligibility atau kebutuhan instruksi klinis.

### 7.2.1 Penawaran dan pengalihan tugas

Nurse menandai tersedia/tidak tersedia dalam shift yang sah. Lokasi terbaru hanya dikumpulkan dengan tujuan dan izin yang sah ketika tersedia untuk penugasan atau bertugas sesuai kebijakan privasi; tidak ditampilkan ke pasien sebelum assignment. Kandidat disaring menurut §7.2; jarak lurus PostGIS hanya untuk shortlist, ETA rute bila tersedia untuk urutan akhir. Penawaran hanya berisi jenis layanan, zona kasar, jadwal dan informasi minimum untuk menerima tugas; bukan nama, alamat lengkap, diagnosis, atau foto pasien. Maksimal satu penawaran aktif per booking; kandidat eligible berikutnya baru ditawari setelah penawaran sebelumnya ditolak, kedaluwarsa atau dicabut secara atomik. Satu penawaran memiliki kedaluwarsa; nilai timeout, radius, jumlah kandidat, jumlah percobaan dan batas lokasi basi disahkan pada OPEN-20. Menerima penawaran memicu cek eligibility dan reservasi atomik serta assignment final; penawaran lain dicabut. Menolak/kedaluwarsa tidak membatalkan booking otomatis; server mencoba kandidat eligible berikutnya, atau mengarahkan Admin untuk tindak lanjut/reschedule. Pembatalan, penawaran telat, dua penerimaan bersamaan, dan penugasan ulang harus melepaskan reservasi yang tidak lagi terpakai secara aman. Admin dapat menetapkan petugas dengan alasan, tidak dapat melewati clinical gate. Setelah check-in, pergantian petugas harus melalui handover klinis sah, bukan auto-dispatch.

### 7.2.2 Pelacakan perjalanan

Ketika perawat mulai perjalanan (`EN_ROUTE`), aplikasi perawat mengirim titik GPS beserta waktu dan akurasi; backend memverifikasi assignment aktif, akses dan kewajaran, lalu meneruskan informasi perjalanan ke pasien/kuasa terkait. Peta menampilkan titik tujuan, posisi perawat terakhir yang valid, rute dan ETA jika penyedia rute dapat menghitungnya. Waktu pembaruan terlihat; posisi basi, izin GPS hilang, jaringan putus atau ETA tidak tersedia ditampilkan apa adanya. Tidak ada lokasi palsu atau animasi kurir/perawat tanpa data. Hentikan publikasi dan cabut akses saat tiba, tugas batal/diganti atau sesi dicabut. Lokasi untuk kesiapan kerja hanya digunakan internal, tidak untuk memantau di luar shift/tugas. Jangan kirim keluhan, nama pasien atau catatan klinis ke penyedia peta; penilaian kontrak, transfer data dan minimisasi koordinat tetap diperlukan. Frekuensi adaptif, stale threshold, retensi dan metode realtime ditutup pada OPEN-20; uji di Android/iOS nyata termasuk izin latar belakang. Fallback berbasis status dan kontak bantuan tetap tersedia. Tidak menghambat pertolongan klinis karena peta tidak tersedia.

## 7.3 Kunjungan perawat dan koordinasi dokter

1. Perawat menerima penugasan melalui §7.2.1; hanya tugas `ASSIGNED` miliknya menampilkan alamat lengkap, navigasi dan check-in bertimestamp.
2. Verifikasi identitas, kebutuhan, consent dan kondisi pasien. Lakukan pengkajian keperawatan, tanda vital, identifikasi tanda bahaya.
3. Tentukan diagnosis keperawatan dan rencana asuhan sesuai kompetensi; catat target, tindakan yang direncanakan dan kebutuhan konsultasi. Diagnosis medis bukan hasil input perawat atau algoritme.
4. Untuk tindakan mandiri, perawat dapat melanjutkan tanpa order dokter jika seluruh syarat CLA-01 terpenuhi. Untuk tindakan yang memerlukan keputusan medis, minta konsultasi dokter berwenang. Dokter menentukan apakah pemeriksaan jarak jauh memadai, perlu pemeriksaan langsung atau rujukan; dapat memberi diagnosis, instruksi atau resep sah.
5. Sebelum setiap tindakan, backend memvalidasi ulang aturan klinis, assignment, izin, kompetensi, consent, dan order/mandat/pengawasan jika diwajibkan. Catat pelaksanaan, waktu, material, respons pasien dan edukasi. Perawat boleh menahan tindakan yang tidak aman. Bila tanda bahaya, lakukan pertolongan dan eskalasi sesuai kompetensi/SOP tanpa menunggu klik approval aplikasi.
6. Evaluasi hasil asuhan, tindak lanjut atau rujukan; laporkan pelaksanaan mandat kepada pemberi mandat dan catat review sesuai SOP. Jika kondisi berubah, rencana asuhan dapat direvisi sesuai kewenangan; terapi medis hanya diubah dokter berwenang.
7. Finalisasi dokumentasi sesuai §8.2 dan kebijakan RME. Status `COMPLETED` tidak boleh disajikan sebelum data wajib dan autentikasi tercatat serta rekonsiliasi RME/bridging sah memenuhi syarat; jika belum, `DOCUMENTATION_PENDING`. Foto/video hanya jika diperlukan, dengan dasar dan consent yang sesuai.
8. Koreksi catatan final melalui amendment terlacak; tindakan yang telah dilakukan tidak dihapus ketika order dicabut.

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

Pada `ADMIN_REVIEW`, Admin menangani aspek administratif dan, **bila diberikan scope `CCO` oleh Owner**, kelayakan klinis awal sesuai kewenangan. Diagnosis, instruksi dan resep tetap merupakan keputusan dokter berwenang.

# 8. Model status dan rekonsiliasi

## 8.1 Booking

`DRAFT → REQUESTED → TRIAGE_OK → LOCATION_OK/LOCATION_REVIEW → ELIGIBILITY_CHECK/ADMIN_REVIEW → CONFIRMED → ASSIGNED → EN_ROUTE → ARRIVED → IN_PROGRESS → DOCUMENTATION_PENDING → COMPLETED`.

Status terminal/alternatif: `REJECTED_OUT_OF_AREA`, `REJECTED_SERVICE_UNAVAILABLE`, `CANCELLED_BY_PATIENT`, `CANCELLED_BY_ADMIN`, `ESCALATED_EMERGENCY`, `NO_SHOW`, `FAILED`, `RESCHEDULE_REQUESTED`. Transisi hanya ditentukan backend sesuai izin dan precondition; semua perubahan status memiliki event log.

- **`CONFIRMED`** berarti layanan berstatus `ACTIVE`, lokasi disetujui, serta slot jadwal dan kapasitas tenaga **eligible telah dicadangkan oleh backend**; belum berarti seorang petugas tertentu sudah menerima penugasan final.
- **`ASSIGNED`** berarti penugasan final dilakukan secara **atomik** kepada satu tenaga yang memenuhi persyaratan; baru pada status ini identitas petugas dapat ditampilkan kepada pasien.
- **Pembayaran:** tagihan final kunjungan diterbitkan hanya setelah pelayanan selesai (`COMPLETED`); pasien membayar setelah pelayanan. Estimasi biaya dan persetujuan tetap sebelum pelayanan. Tidak ada transisi booking atau asuhan yang bergantung pada status pembayaran. Kegagalan pembayaran tidak membatalkan catatan pelayanan. OPEN-07 tetap untuk provider, entitas penagih, refund, pengecualian dan pembayaran obat.

## 8.2 Klinis dan integrasi

- Consent: `NOT_REQUESTED → REQUESTED → ACCEPTED/DECLINED/REVOKED` (pencabutan menurut kebijakan dan kewajiban pencatatan).
- Perintah dokter: `DRAFT → SIGNED → ACKNOWLEDGED → EXECUTED`; `CANCELLED`, `EXPIRED` dan `SUPERSEDED` menutup order yang belum dieksekusi. Status eksekusi per tindakan/dosis mencegah duplikasi; pembatalan sisa tindakan tidak menghapus kejadian yang sudah selesai. Perubahan order membutuhkan versi baru yang disahkan; versi lama tidak dapat dipakai untuk tindakan baru.
- Order/mandat memuat encounter/pasien, tindakan, pemberi dan penerima/scope sah, indikasi, batas pelaksanaan, jadwal/masa berlaku, SOP, persyaratan pengawasan, pengesahan, status, alasan perubahan/pencabutan, acknowledgment dan laporan. Perintah dan bukti mandat dibedakan apabila keduanya disyaratkan. Server memeriksa versi dan kelayakan secara atomik saat mulai tindakan; apabila dicabut ketika tindakan berlangsung, hentikan/eskalasi dengan cara aman menurut SOP dan catat kejadian. Tidak ada pemberian mandat melalui chat bebas tanpa bukti sah.
- Penawaran tugas: `OFFERED → ACCEPTED/DECLINED/EXPIRED/REVOKED`; penerimaan efektif hanya setelah assignment atomik. Jika konfirmasi kapasitas tidak dapat dipenuhi lagi, booking kembali ke review/reschedule sesuai transisi yang disahkan, bukan menampilkan petugas fiktif.
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
| PAT-06 | Jadwal dan ketersediaan | Konfirmasi tidak muncul sebelum slot dan kapasitas tenaga eligible dicadangkan backend; nama petugas tampil hanya setelah `ASSIGNED`. |
| PAT-07 | Status dan peta perjalanan | Status server, lokasi perawat hanya EN_ROUTE, ETA rute valid atau tidak tersedia, waktu pembaruan dan fallback. |
| PAT-08 | Consent dan ringkasan | Persetujuan per tindakan/dokumentasi; riwayat yang boleh diakses. |
| PAT-09 | Resep, obat, dan tagihan | Hanya milik sendiri/kuasa sah; detail harga dan status transaksi jelas. |
| PAT-10 | Keluhan & permintaan bantuan | Terkait booking, status tiket, eskalasi keselamatan. |
| PAT-11 | Pesan perawat | CTA utama menuju kebutuhan aktif; pilihan kunjungan secepatnya/jadwal, triase, alamat dan harga sebelum konfirmasi. |

## 9.2 DB-NRS — Perawat

| ID | Kebutuhan wajib | Penerimaan |
|---|---|---|
| NRS-01 | Ketersediaan, penawaran dan tugas | Hanya penawaran sendiri dengan data minimum; tugas lengkap setelah assignment, penerimaan/penolakan/timeout dicatat. |
| NRS-02 | Navigasi/check-in | Izin lokasi kontekstual, validasi status kunjungan. |
| NRS-03 | Asesmen & tanda vital | Validasi tipe/satuan/batas kewajaran; tidak diperlakukan sebagai diagnosis. |
| NRS-04 | Konsultasi dokter | Permintaan, status, rekaman keputusan/instruksi yang sah. |
| NRS-05 | Eksekusi tindakan | CLA-01..06; order/mandat hanya jika disyaratkan, tidak ada eksekusi tanpa scope/consent yang sah. |
| NRS-06 | Bukti foto/dokumen | Private upload, kontrol jenis/ukuran/retensi/akses. |
| NRS-07 | Catatan akhir | Draf, verifikasi, finalisasi sesuai kewenangan, amendment. |
| NRS-08 | Gangguan konektivitas | Draft lokal sensitif hanya bila diputuskan aman; jika tidak ada desain offline aman, **jangan** menyimpan PHI offline. |
| NRS-09 | Diagnosis dan rencana keperawatan | Field tersendiri, target hasil dan tindakan sesuai scope; tidak bisa mengubah diagnosis/terapi medis. |
| NRS-10 | Evaluasi asuhan dan laporan mandat | Hasil, respons, tindak lanjut dan laporan ke pemberi tercatat; revisi berjejak. |
| NRS-11 | Perjalanan dan lokasi | Mulai perjalanan hanya untuk tugas sendiri; GPS kontekstual, status basi, berhenti berbagi saat tiba/batal. |
| NRS-12 | Penahanan tindakan | Menolak/menghentikan tindakan tidak aman dan eskalasi; tidak dapat bypass order/mandat. |

## 9.3 DB-DOC — Dokter

| ID | Kebutuhan wajib | Penerimaan |
|---|---|---|
| DOC-01 | Antrean konsultasi | Hubungan perawatan dan kewenangan dokter dicek. |
| DOC-02 | Ringkasan klinis minimal | Informasi tepat untuk kasus aktif, melalui adapter RME yang disetujui. |
| DOC-03 | Konsultasi pesan/audio/video | Dilakukan hanya dengan sarana yang memenuhi perlindungan data dan aturan profesi; pesan, audio dan video termasuk cakupan rilis pertama; aktivasi setelah pengesahan OPEN-05, kontrol privasi dan uji keamanan. Tidak merekam panggilan secara default. |
| DOC-04 | Diagnosis medis, terapi dan instruksi | Keputusan, perubahan, penghentian terapi dan order tersahkan, tidak dapat ditulis akun perawat. |
| DOC-05 | Resep | Dokter berwenang, tanda tangan/otentikasi sesuai SOP, verifikasi apotek. |
| DOC-06 | Review catatan & tindak lanjut | Perubahan klinis berjejak audit, alur rujukan/eskalasi. |
| DOC-07 | Mandat dan pemantauan | Pemberi/penerima, kompetensi, scope, pengawasan, bukti tertulis, laporan dan review sesuai §3.5. |
| DOC-08 | Perubahan/pencabutan order | Versi baru atau pencabutan, validasi ulang atomik, notifikasi kepada penerima dan audit; tidak menghapus tindakan terlaksana. |
| DOC-09 | Kunjungan dokter | Tugas kunjungan langsung, pemeriksaan dan evaluasi medis sesuai relasi pelayanan dan izin. |

## 9.4 DB-PHA — Apotek

`PHA-01` inbox resep hanya untuk mitra/cabang terikat; `PHA-02` validasi apoteker; `PHA-03` konfirmasi ketersediaan dan harga; `PHA-04` penyiapan; `PHA-05` handoff kurir dengan bukti; `PHA-06` penolakan/retur/insiden; `PHA-07` pembatasan informasi pasien dan audit.

## 9.5 DB-CUR — Kurir

`CUR-01` status pelamar dan verifikasi; `CUR-02` hanya order assigned setelah aktif; `CUR-03` alamat navigasi dan instruksi logistik minimal; `CUR-04` pickup; `CUR-05` proof of delivery secukupnya; `CUR-06` gagal/retur; `CUR-07` tidak pernah mengakses konten klinis; `CUR-08` geolokasi hanya saat tugas aktif dan dengan transparansi/izin yang diperlukan.

## 9.6 DB-ADM — Admin/Owner

`ADM-01` ringkasan operasional agregat; `ADM-02` review booking/triase lokasi; `ADM-03` dispatch, shift dan eligibility administratif; `ADM-04` staf & dokumen izin; `ADM-05` verifikasi kurir dan mitra apotek; `ADM-06` pengelolaan katalog, dengan aktivasi hanya setelah sign-off Owner sebagai PJ Klinis; `ADM-07` invoice, pembayaran dan refund; `ADM-08` pelacakan gangguan RME/apotek/kurir; `ADM-09` audit akses operasional; `ADM-10` pelaporan KPI; `ADM-11` Owner workflow untuk rekrutmen, kebijakan layanan dan tindakan berisiko. Admin **tidak** memiliki mode universal untuk membuka semua PHI. Penilaian eligibility klinis awal saat `ADMIN_REVIEW` hanya dengan scope `CCO` eksplisit dari Owner dan audit akses.

## 9.7 Developer Console Patah Pensil (teknis)

`VEN-01` metrik availability dan latency tanpa PHI; `VEN-02` alert/error log tersanitasi; `VEN-03` status integrasi/antrian; `VEN-04` deployment staging/produksi dengan gerbang teknis Vendor; `VEN-05` rollback dan versi; `VEN-06` jadwal/hasil backup; `VEN-07` restore melalui runbook teknis yang diaudit, dengan otorisasi pengendali data bila melibatkan data pasien/perubahan catatan klinis; `VEN-08` kontrol akses istimewa JIT, MFA, timeout dan audit, tanpa akses PHI otomatis; `VEN-09` patch keamanan dan status kerentanan; `VEN-10` uji integrasi Sandbox SATUSEHAT/RME dan redaksi data; `VEN-11` incident runbook, pelacakan postmortem; `VEN-12` pencabutan akses Vendor dan rotasi kredensial; `VEN-13` status retensi/audit kesehatan sistem.

**Batas implementasi konsol:** pada rilis awal, fungsi maintenance dapat berupa dashboard teknis terbatas yang mengintegrasikan workflow GitHub Actions, monitoring, backup dan tiket yang sudah ada. Tidak perlu membangun ulang platform DevOps dari nol. Operasi berisiko tetap diaudit dan menjalani gerbang otorisasi teknis Vendor; akses PHI atau perubahan pelayanan memerlukan otorisasi yang sah dari pihak MADISING.

# 10. Data dan skema minimum

## 10.1 Pemisahan domain

| Domain | Entitas inti | Data sensitif dan pemilik |
|---|---|---|
| Identity | `accounts`, `roles`, `role_bindings`, `sessions`, `mfa_factors`, `invitations`, `consents` | Kredensial dan PHI identity; Admin/identity service scoped |
| Patient/Booking | `patients`, `representatives`, `addresses`, `bookings`, `triage_events`, `service_catalog`, `service_availability` | Identitas pasien, alamat, keluhan minimal |
| Geo/Dispatch | `service_areas`, `area_versions`, `coverage`, `credential_checks`, `shifts`, `assignment_offers`, `assignments`, `availability`, `location_latest`, `travel_sessions` | Lokasi dan status kerja |
| Clinical adapter | `care_encounters`, `assessments`, `nursing_diagnoses`, `nursing_care_plans`, `nursing_evaluations`, `doctor_orders`, `mandate_records`, `procedure_events`, `documentation_status`, `rme_references`, `integration_jobs` | Referensi RME dan dokumen klinis minimal; RME adalah source of truth |
| Medication | `prescription_references`, `pharmacies`, `pharmacy_orders`, `handoffs` | Data resep sebatas kebutuhan mitra sah |
| Logistics | `couriers`, `delivery_tasks`, `proof_of_delivery`, `return_events` | Kontak dan tujuan minimal |
| Finance | `invoices`, `invoice_items`, `payment_events`, `refunds`, `reconciliation` | Keuangan/identitas pembayaran minimal; dilarang menyimpan data kartu pembayaran sensitif |
| Security/Operations | `audit_events`, `security_alerts`, `access_grants`, `break_glass_events`, `backup_status`, `incident_tickets` | Metadata audit yang diminimalkan dan dilindungi |

Tambahkan domain aturan klinis `clinical_authority` dengan `procedure_policy_versions`, `clinical_privileges`, `mandate_references` dan hasil pemeriksaan (referensi, bukan isi klinis berlebihan). Entitas di atas adalah model konseptual; lokasi sumber data dan batas penyimpanan ditentukan OPEN-04/OPEN-19/OPEN-20 sebelum migrasi.

## 10.2 Kebijakan data

- Setiap objek klinis terikat `patient_id`, `encounter_id`, `assigned_provider_id`, lokasi/mitra dan aturan akses; ID generik tidak boleh cukup untuk mengakses data.
- MADISING menyimpan referensi `rme_patient_id`, `rme_encounter_id` dan status sinkron; isi klinis disimpan sementara **hanya** jika diperlukan untuk kesinambungan layanan dan telah diputuskan kebijakan retensinya.
- Jangan mereplikasi rekam medis secara menyeluruh sebagai database kedua tanpa persetujuan pengelola RME dan dasar hukum.
- Semua upload klinis berada dalam **private object storage**, menggunakan identitas objek acak, encryption at rest, signed URL singkat dan verifikasi akses sebelum penyajian; jangan menyimpan PHI di public CDN.
- Catatan final immutable secara logis dan hanya dimodifikasi via amendment; audit terpisah dan tahan manipulasi.
- Backup dan retention mengikuti klasifikasi data, ketentuan hukum dan persetujuan penanggung jawab klinis; **tidak menetapkan durasi arbitrer di PRD ini**.
- Data pengembangan, demo dan pengujian menggunakan data sintetis; dilarang menyalin data produksi ke staging/CI.

**Gerbang klasifikasi data klinis:** Bila **OPEN-04** menunjukkan RME existing tidak menyediakan API atau prosedur integrasi yang sah, catatan klinis MADISING berpotensi menjadi bagian rekam medis. Kewajiban rekam medis elektronik harus ditelaah Owner sebagai PJ Klinis bersama legal sebelum skema `clinical_adapter` difinalkan. **OPEN-04 harus terjawab pada R0**, bukan ditunda sampai data klinis diproses.

# 11. Arsitektur teknis hemat kompleksitas

## 11.1 Komponen target

```text
Android / iOS (Flutter)    Web responsif (Next.js)
            \             /
             TLS / Edge Security
                      |
               API modular (NestJS/TypeScript)
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

- Modul domain: `identity`, `users`, `services`, `patient`, `booking`, `triage`, `geo`, `workforce`, `dispatch`, `visits`, `clinical_authority`, `clinical_adapter`, `prescription`, `pharmacy`, `delivery`, `billing`, `audit`, `notifications`, `maintenance`. Pelacakan berada dalam `geo`/`dispatch`; penawaran dan pengalihan dalam `dispatch`.
- Modul memiliki kontrak input/output bertipe, validasi schema, authorization guard, rate limit dan audit event.
- Semua operasi sensitif tervalidasi transactional/invariant; tidak mempercayai status dari frontend.
- Komunikasi adapter memiliki timeout, retry, idempotency, queue yang bisa diaudit, serta kill switch untuk mitra bermasalah.
- Tidak memerlukan Kafka/Redis/microservices pada tahap awal kecuali kebutuhan operasional nyata membuktikan manfaat. Background job boleh memakai queue sederhana yang tahan restart dan aman.
- Notifikasi WhatsApp/SMS/email hanya membawa informasi minimum; jangan mencantumkan diagnosis, foto atau isi rekam medis di pesan push.

### 11.2.1 Clinical Authority dan realtime

Clinical Authority adalah policy module dalam modular monolith, bukan server baru. Ia mengotorisasi assignment dan setiap eksekusi tindakan berdasarkan data tepercaya; mendahulukan deny-by-default, mengikat revisi kebijakan dan order ke audit, dan tidak mendiagnosis pasien. Adapter RME tetap menangani interoperabilitas, bukan sumber izin profesi. Gunakan PostgreSQL/PostGIS, outbox dan adapter peta/rute/push; Google Maps Platform dan FCM/APNs adalah kandidat, bukan kewajiban vendor. Kanal realtime dapat berupa WebSocket/SSE atau mekanisme teruji yang setara dengan fallback polling. Redis tidak diwajibkan; hanya jika bukti beban dan kebutuhan session/event fanout menunjukkan manfaat. Map, push, dan transport realtime tidak boleh memberikan akses klinis. Server produksi/penempatan data tetap mengikuti OPEN-09; layanan klinis tidak menggunakan penyimpanan publik.

## 11.3 RME dan SATUSEHAT — prioritas arsitektur sejak R0

**Tujuan utama:** MADISING diupayakan interoperabel dengan **SATUSEHAT Platform Kementerian Kesehatan**, bukan mengklaim sudah tersambung. Patah Pensil memimpin seluruh investigasi API, rancangan adapter, mapping HL7 FHIR R4, implementasi, keamanan integrasi, pengujian Sandbox dan monitoring. Owner/PJ Klinis tidak diminta menentukan endpoint, struktur JSON, atau metode autentikasi.

**Dua jalur yang harus diverifikasi pada OPEN-04 (belum diputuskan):**

1. **Jalur A — melalui RME existing:** periksa sistem RME yang digunakan oleh fasyankes, status keterhubungannya ke SATUSEHAT, API/bridging resmi atau prosedur pertukaran data yang sah, hak penggunaan dan pemetaan identitas pasien/kunjungan. Gunakan jalur ini jika dukungan vendor RME dan perjanjian data memadai; jangan mengandaikan setiap RME menawarkan API.
2. **Jalur B — integrasi langsung yang sah:** Patah Pensil mengevaluasi persyaratan registrasi/validasi penyedia sistem RME (*partner system*) atau opsi fasyankes yang sah, lalu menerapkan antarmuka FHIR sesuai hak akses yang benar-benar diberikan. **Tidak boleh menganggap akun Vendor sendiri otomatis mempunyai kode akses Production.** Kredensial Production terkait fasyankes yang memenuhi persyaratan dan pilihan sistem RME; kewenangan institusional tetap harus diurus oleh pihak fasyankes.

**Pekerjaan R0:** identifikasi identitas resmi fasyankes dan PIC institusional, pilihan RME, status akun SATUSEHAT/Sandbox, use case FHIR homecare yang tersedia, pola mapping patient/encounter, data minimization, alur persetujuan berbagi data, dan contract tests dengan data sintetis. Jika akses Sandbox belum tersedia, gunakan mock FHIR lokal dan tandai status **belum terkoneksi**, bukan membuat kredensial atau mengklaim transaksi SATUSEHAT.

**Pekerjaan R1:** bangun `satusehat_adapter` yang terpisah dari `clinical_adapter` bila diperlukan, dengan validasi schema/profil FHIR, verifikasi OAuth/token lewat backend, vault/secret manager, pemetaan referensi patient/encounter yang sah, transaksi idempotent, antrean/outbox, retry aman, dead-letter handling, rekonsiliasi kegagalan, audit metadata dan pembatasan data sesuai otorisasi. Jangan menyimpan NIK/diagnosis/isi rekam medis dalam log atau payload error. Catatan pasien tetap bersumber pada RME yang sah sampai perubahan statusnya ditetapkan melalui OPEN-04.

**Gerbang akses Production:** verifikasi status fasyankes, jalur registrasi sistem RME/partner, kewenangan pemakaian kredensial dan tujuan pertukaran data oleh MADISING sebagai pengendali, validasi skenario resmi, penilaian privasi, kontrol keamanan dan persetujuan klinis bila relevan. Tanpa ini integrasi tetap pada mock/Sandbox dan **tidak mengirim PHI nyata**. Tidak ada asumsi bahwa semua homecare otomatis memenuhi use case yang tersedia.

**Gerbang klasifikasi data klinis (§10.2):** keputusan OPEN-04 wajib ditutup di R0. Jika RME tidak menyediakan API atau prosedur bridging sah, status catatan klinis MADISING sebagai kemungkinan rekam medis dan kewajiban terkait harus ditelaah PJ Klinis/legal sebelum skema `clinical_adapter` difinalkan.

**Dokumentasi operasional:** [Rencana Integrasi SATUSEHAT](SATUSEHAT_INTEGRATION_PLAN.md), termasuk alternatif arsitektur, bukti verifikasi R0 dan kriteria uji. Rujukan primer: [Panduan Registrasi](https://satusehat.kemkes.go.id/platform/docs/id/registration-guide/), [Kode Akses API](https://satusehat.kemkes.go.id/platform/docs/id/api-code/), [Interoperabilitas](https://satusehat.kemkes.go.id/platform/docs/id/api-catalogue/integrations/).

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

- Repository resmi: `patahpensil/madising`, **private**, **milik Patah Pensil sebagai pembuat aplikasi** (lihat §3.2.1); master branch `main` terlindungi bila fitur paket mendukung.
- Satu monorepo dengan direktori `apps/mobile`, `apps/web`, `apps/api`, `packages/shared` (jika dibutuhkan), `docs`, `infra` dan `.github`.
- Alur perubahan: issue → feature branch → Pull Request → CI + review → staging → UAT → persetujuan rilis → deployment produksi.
- CI: formatting, lint, typecheck, unit test, integration tests, Flutter analyze/test, security/dependency/secret scanning, dan kontrol policy yang bisa diotomasi. Workflow tidak boleh mendistribusikan secrets pada PR yang tidak dipercaya.
- CD: staging otomatis hanya dengan synthetic data; produksi menggunakan environment approval, protected secrets/OIDC, deploy idempotent, smoke test, rollback, release tag.
- Perubahan teknis rutin/kritis (deploy, rollback, patch, restore teknis, rotasi kredensial) dikelola oleh **Patah Pensil** berdasarkan kontrol perubahan, CI, audit, keamanan, dan risiko terdokumentasi (**CR-TECH-01**). Owner tidak menjadi approver teknis per deployment. Aktivitas yang memerlukan akses PHI atau keputusan klinis tetap tunduk pada dasar dan otorisasi sah MADISING sebagai pengendali data/PJ Klinis. Pemisahan pelaksana dan verifikasi teknis yang disyaratkan harus dipenuhi sebelum produksi; prosedur akses darurat §12.4 tetap berlaku.
- Pemeliharaan minimal: monitoring, patch dependency, pembaruan platform Android/iOS, pencadangan, pengujian pemulihan, rotasi token, peninjauan akses mitra, analisis insiden, dan dokumentasi release.

## 13.2 Kriteria DoD (Definition of Done)

Sebuah fitur baru boleh dinyatakan **selesai** bila: acceptance criteria lulus; otorisasi API dan negative tests ada; respons error/loading/empty nyata; audit dan perlindungan PHI diuji; perubahan DB dan rollback aman; dokumentasi diperbarui; tidak ada secret/PHI dalam repo; staging lulus; dan persetujuan klinis tersedia jika fiturnya menyentuh perawatan pasien.

## 13.3 Batas peran AI coding

Agen AI membantu menulis kode, tes, dokumentasi, dan review awal, tetapi **tidak** otomatis mengesahkan kepatuhan atau keselamatan klinis. Patah Pensil bertanggung jawab atas keputusan teknis dan review keamanan; keputusan klinis dan otorisasi penggunaan data pasien tetap pada pejabat MADISING yang berwenang. Rilis teknis dan izin membuka layanan klinis adalah dua gerbang berbeda.

# 14. Antarmuka dan pengalaman pengguna

Acuan utama alur inti: [prototipe V1.4.2](reference/MADISING_UIUX_Core_V1.4.2.html). Referensi V1.3.7 tetap menjadi arsip untuk identitas merek dan layar pendukung, bukan pembenaran untuk desain lama yang bertentangan. Pengalaman mengikuti pola pemesanan on-demand: alamat, kebutuhan, jadwal, pencarian, petugas, perjalanan, laporan kunjungan. Jangan menyalin logo, merek, aset atau identitas visual Gojek/Grab.

## 14.1 Sistem visual

- Gunakan palet identitas deep teal (#123F3A), teal aksi (#176B5B), warm-white (#F7F8F5), permukaan putih, teks #172A27, teks sekunder #53635E, garis #DCE4DF. Merah hanya tanda bahaya/penolakan; amber untuk pending. Kontras aktual diuji WCAG 2.2 AA.
- Tipografi sistem native (Android Roboto / iOS San Francisco; web system sans), teks isi 15–16px, label 13–14px, judul 22–28px. Grid 4/8, margin layar 16–20px, tombol minimal 48px; radius 12–16px, bayangan tipis atau garis pembatas.
- Tidak memakai gradien dekoratif, glassmorphism, glow, emoji sebagai ikon UI, badge promosi berlebihan, kartu bersarang, angka dekoratif judul, ilustrasi stok generik atau teks pemasaran berulang. Gunakan ikon garis konsisten, foto staf asli berizin jika dibutuhkan dan peta dari provider yang disetujui. Jangan menampilkan statistik, rating, ETA, harga atau identitas petugas rekaan dalam produksi.
- Bahasa Indonesia biasa: "Pesan perawat", "Cari perawat", "Perawat menuju lokasi", "Lokasi belum diperbarui", "Menunggu instruksi dokter", "Selesaikan catatan". Tidak memakai jargon internal untuk pasien, filler, placeholder tanpa isi, label role demo, atau penanda generator. Hindari klaim "terbaik", "instan", "100% aman" dan klaim klinis yang tidak terbukti. Komentar kode menjelaskan keputusan nontrivial, bukan narasi boilerplate; review kualitas manual, bukan klaim dapat membuktikan asal-usul kode.
- Layar kecil 360–430px dan desktop 1280–1440px sebagai viewport uji referensi, tidak membatasi layout aktual. Safe area, dynamic text, keyboard, fokus, label screen reader, target sentuh, kontras dan status selain warna wajib diperiksa.

## 14.2 Pasien (mobile)

Beranda memakai alamat yang dapat diganti di atas, CTA utama Pesan perawat, layanan aktif, kunjungan berjalan bila ada, tab Beranda/Jadwal/Riwayat/Akun. Katalog sembilan kategori tetap tersedia tanpa menjadikan semuanya CTA utama. Form pendek berurutan: kebutuhan/pasien, skrining tanda bahaya, alamat dan jadwal, biaya/consent, konfirmasi. Tidak ada daftar profil perawat bebas seperti marketplace. Saat mencari, tampilkan status yang sebenarnya dan pilihan batal/bantuan yang masih sah. Setelah ASSIGNED, kartu perawat berisi nama/foto berizin bila tersedia, profesi, status dan bantuan yang aman. Selama EN_ROUTE, peta dominan di atas, panel bawah berisi status, ETA valid atau tidak tersedia, waktu update, serta tindakan bantuan; lokasi basi dijelaskan. Ketika tiba, ganti peta dengan timeline kunjungan. Riwayat menampilkan ringkasan yang sah, bukan RME penuh.

## 14.3 Perawat (mobile)

Beranda berorientasi tugas: status ketersediaan/shift, penawaran masuk dengan lokasi kasar dan jadwal, tombol Terima/Tolak, tugas hari ini. Setelah assigned, peta navigasi dan kartu alamat hanya untuk tugas sah. Tombol kontekstual Mulai perjalanan, Tiba, Mulai pengkajian mengikuti status server. Workspace klinis berupa langkah Pengkajian → Diagnosis keperawatan → Rencana asuhan → Tindakan → Evaluasi. Daftar tindakan menandai mandiri atau perlu instruksi/mandat, alasan terkunci dan tombol Hubungi dokter bila perlu. Tampilan instruksi memperlihatkan pemberi, scope, waktu, status, syarat dan acknowledgment; perawat dapat melaporkan masalah. Tidak ada tombol resep, diagnosis penyakit, atau perubahan terapi medis. Penyelesaian kunjungan menampilkan syarat dokumentasi/rekonsiliasi, bukan indikator sukses palsu.

## 14.4 Dokter, Admin, Apotek, Kurir

Dokter memakai web responsif dengan clinical inbox, antrean kasus, ringkasan pengkajian, ruang diagnosis medis, instruksi/mandat, resep, evaluasi, rujukan, dan tugas kunjungan langsung. Desktop memakai daftar kasus dan panel detail, mobile menumpuk secara berurutan. Perubahan/pencabutan order meminta alasan dan konfirmasi. Admin menggunakan tabel dispatch, status kapasitas/shift, pengecualian dan audit; data klinis minimum hanya bagi CCO yang sah. Apotek berorientasi antrean resep dan pemenuhan; kurir pada tugas pengiriman dan peta saat tugas aktif. Developer Console tersendiri, bukan dashboard ketujuh. Layout tidak menyalin satu dashboard dan mengganti label; login nyata menentukan role.

## 14.5 State dan pemeriksaan visual

Setiap aksi harus punya loading, kosong, review, ditolak, gagal, offline, retry dan sukses yang sesuai state server. Tidak boleh memakai spinner sebagai bukti assignment atau ETA. Notifikasi tidak membuka PHI. Demo memakai data sintetis yang diberi label jelas di luar tampilan produk; tidak ada tombol yang berpura-pura mengirim data produksi. Visual review pada perangkat Android/iOS nyata dan desktop memeriksa keterbacaan, clipping, overflow, keterjangkauan CTA, keyboard, kontras, state error, privacy dan konsistensi mikrocopy. Seluruh role dan alur tetap membutuhkan pengujian fungsional serta keamanan independen.

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

Hasil: spesifikasi teknis dipimpin Patah Pensil; pemetaan izin, skema data, threat model, desain arsitektur; prototipe dan katalog; repo private + CI; web/API/Flutter kerangka; data sintetis. **Prioritas: verifikasi opsi koneksi SATUSEHAT/RME di OPEN-04 dan uji mock/Sandbox sesuai kelayakan akses.** **Tidak boleh** menerima data pasien nyata.

**Gerbang keluar R0:** OPEN-04 (jalur SATUSEHAT/RME dan status kewenangan fasyankes), OPEN-13 (stack), OPEN-15 (offline perawat), OPEN-16 (kanal kurir), OPEN-17 (cakupan pengujian), dan OPEN-18 (pengaturan privasi/pengendali–pemroses) **harus diputuskan dan didokumentasikan** sebelum keluar dari R0. Patah Pensil menyelesaikan keputusan teknis dan membuktikan feasibility integrasi tanpa PHI; penetapan institusional/klinis/data tetap memerlukan otorisasi yang sah. Ketiadaan akses Sandbox atau Production tidak dapat ditutupi dengan klaim 'sudah terintegrasi'.

**Tambahan gerbang R0 V1.4.2:** OPEN-19 (kebijakan kewenangan dan bentuk order/mandat) serta OPEN-20 (dispatch, tracking dan penilaian privasi lokasi) wajib ditutup sebelum implementasi klinis R1 difinalkan; prototipe dan matriks uji ditinjau dengan data sintetis.

## R1 — Core Homecare pilot (kelayakan produksi terbatas)

- Pendaftaran pasien dan kurir, provisioning internal, MFA, audit, penetapan consent/kuasa.
- Katalog sembilan layanan dengan flag aktivasi; booking layanan yang telah siap, triase, Sidrap geofence, review Admin, jadwal, dispatch eligible.
- Dashboard Pasien, Perawat, Dokter, Admin nyata dan role-scoped; DB-PHA/DB-CUR tetap tersedia sesuai kebutuhan alur, tetapi aktivasi transaksi ditahan hingga mitra siap.
- Perawat: penawaran/assignment, perjalanan dan live tracking kontekstual, check-in, proses asuhan lengkap, konsultasi dokter, order/mandat jika diperlukan, consent, tindakan, evaluasi dan dokumentasi privat, sinkronisasi RME atau prosedur bridging yang telah disahkan. Adapter SATUSEHAT hanya diaktifkan sesuai hasil verifikasi R0, hak akses FHIR dan pengujian R1; tidak memaksa koneksi Production jika prasyarat institusional belum terpenuhi.
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
| UAT-07 | Owner melalui konteks `OWN/ADM` membuka diagnosis | Ditolak walau Owner adalah dokter; akses klinis hanya melalui akun `DOC` dengan relasi perawatan sah. |
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
| UAT-31 | Deployment/restore/JIT dijalankan tanpa gerbang review keamanan dan audit, atau melibatkan akses PHI tanpa otorisasi pengendali | Ditolak. Patah Pensil bertanggung jawab atas approval teknis sesuai CR-TECH-01; akses PHI/keputusan klinis tidak dapat diberikan oleh Vendor sendiri. |
| UAT-32 | Admin tanpa scope `CCO` menetapkan kelayakan klinis, atau mengaktifkan layanan tanpa sign-off Owner | Ditolak; eligibility klinis memerlukan scope `CCO`, aktivasi katalog memerlukan persetujuan Owner sebagai PJ Klinis. |
| UAT-33 | Admin membuka diagnosis/foto klinis di luar scope `CCO` | Ditolak dan diaudit; izin operasional tidak mengizinkan akses PHI bebas. |
| UAT-34 | Perawat yang kompeten melakukan tindakan mandiri sah tanpa order dokter | Diizinkan; tidak ada approval dokter yang dipaksakan. |
| UAT-35 | Perawat menulis diagnosis medis atau mengubah dosis; Admin mencoba fungsi klinis | Ditolak server; diagnosis keperawatan dengan scope sah diizinkan. |
| UAT-36 | Mandat wajib tanpa dokumen sah/pengawasan/penerima sesuai | Tindakan ditolak; eskalasi tersedia. |
| UAT-37 | Order dibatalkan/expired/superseded atau izin/consent dicabut saat penawaran atau sebelum tindakan | Validasi ulang mencegah eksekusi; histori utuh. |
| UAT-38 | Dokter tidak tersedia, kondisi tidak aman, atau tanda bahaya | Tindakan non-darurat yang membutuhkan syarat ditahan; pertolongan/eskalasi sesuai SOP tidak menunggu approval UI. |
| UAT-39 | Penawaran ditolak, timeout, diterima telat atau bersamaan | Assignment tunggal atau review/reschedule; reservasi sesuai state dan data pasien tidak bocor. |
| UAT-40 | Perawat terdekat tidak eligible; lokasi kandidat basi | Tidak masuk shortlist yang siap ditugaskan; fallback sesuai kebijakan. |
| UAT-41 | Pelacakan EN_ROUTE; akses pasien lain atau sebelum assignment/setelah tiba/batal | Hanya pasien/kuasa sah menerima posisi; akses berakhir sesuai state. |
| UAT-42 | GPS/jaringan/ETA tidak tersedia, lokasi spoofed atau sesi dicabut | Status stale/unavailable dan fallback nyata; tidak ada posisi/ETA fiktif. |
| UAT-43 | Asuhan mandiri dan mandat dalam satu encounter | Data diagnosis/rencana/evaluasi terpisah dari order medis, laporan mandat tercatat, RME direkonsiliasi sesuai aturan. |
| UAT-44 | Delegasi dipanggil melalui UI atau API R1 | Ditolak; tidak dapat digunakan mengganti mandat. |
| UAT-45 | Review UI pada mobile/desktop dan aksesibilitas | CTA perawat dominan, peta/panel tugas/clinical inbox sesuai §14, tidak ada overflow/placeholder, keadaan error dan izin tervalidasi. |
| UAT-46 | Penugasan ulang dan order penerima lama | Akses dicabut, order/mandat dicek ulang; setelah tiba perlu handover sah. |
| UAT-47 | Duplikasi eksekusi atau race pencabutan order | Transaksi memastikan versi dan eksekusi yang sah; tindakan lampau tidak dihapus. |

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
6. Gerbang kesiapan klinis dan pemrosesan data pasien disahkan pihak MADISING yang berwenang; Patah Pensil bertanggung jawab atas pemeriksaan keamanan dan keputusan rilis teknis. Tidak diperlukan sign-off Owner atas perintah CI/CD, JSON atau komponen teknis per deployment.
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
| Owner merangkap PJ Klinis dan dokter praktik | Sedang | Akun terpisah, audit akses per konteks | Owner + Vendor |

# 20. Dependensi dan keputusan terbuka untuk sign-off

| ID | Keputusan yang masih dibutuhkan | Penanggung jawab |
|---|---|---|
| OPEN-01 | PJ Klinis telah ditetapkan: Owner (dokter). Identitas resmi fasilitas/pemberi layanan, cakupan izin per layanan serta PJ RME tetap terbuka. | Owner (PJ Klinis) |
| OPEN-02 | Daftar layanan yang **benar-benar aktif** pertama kali dan SOP masing-masing | Owner + Dokter PJ |
| OPEN-03 | Daftar tenaga, profesi tambahan, bukti kewenangan dan lokasi kerja | Owner/Admin + PJ klinis |
| OPEN-04 | **Prioritas R0 SATUSEHAT**: verifikasi status fasyankes dan RME existing, API/prosedur bridging yang sah, kredensial Sandbox (jika memenuhi syarat), mapping pasien/encounter, jalur via RME atau integrasi langsung | Patah Pensil (teknis) + penanggung jawab fasyankes/RME untuk identitas dan otorisasi |
| OPEN-05 | Kanal pesan, audio dan video diputuskan; kelayakan layanan jarak jauh, provider, SOP dan perlindungan data belum disahkan | PJ klinis + legal |
| OPEN-06 | Perjanjian mitra apotek, courier, lab, handling obat/sampel | Admin + mitra |
| OPEN-07 | Pembayaran kunjungan setelah pelayanan selesai diputuskan; provider, merchant of record, refund, kebijakan pengecualian dan obat belum ditetapkan | Owner/Finance |
| OPEN-08 | Persetujuan privasi, subjek data, retensi, DPIA dan kontrak pemroses | Pengendali data + legal |
| OPEN-09 | Cloudflare untuk edge staging dengan backend dan PostgreSQL terpisah diputuskan; hosting, DNS, lokasi pemrosesan, pengaturan akses/serah terima dan strategi pemulihan masih terbuka; keputusan teknologi oleh Vendor, pengendalian data dan kontrak oleh MADISING | Patah Pensil (teknis) + MADISING (data/kontrak) |
| OPEN-10 | Ketersediaan perangkat pengujian iOS dan publikasi Android/iOS | Patah Pensil |
| OPEN-11 | Parameter SLO/RPO/RTO serta kapasitas layanan | Owner + PJ klinis + Patah Pensil |
| OPEN-12 | Pengesahan substansi klinis/data serta perubahan GOVERNANCE-LOCK/CR-TECH-01 untuk kedudukan PRD V1.4.1 terhadap V1.3.6; **bukan** persetujuan JSON, stack atau operasi DevOps | Patah Pensil (spesifikasi teknis) + MADISING (keputusan klinis/data yang mengikatnya) |
| OPEN-13 | **Diputuskan 15 November 2026:** NestJS/TypeScript, Next.js, PostgreSQL/PostGIS. Bukti build, migrasi dan pengujian tetap wajib. | Patah Pensil |
| OPEN-14 | Model akses profesi nonperawat dalam batas enam dashboard, tanpa mengasumsikan role `NRS` | Owner (PJ Klinis) |
| OPEN-15 | Dokumentasi perawat offline (NRS-08), mempertimbangkan konektivitas kecamatan pinggiran | Owner + Vendor |
| OPEN-16 | Kanal kurir: PWA vs Flutter; termasuk keterbatasan lokasi latar belakang PWA di iOS | Vendor |
| OPEN-17 | Kelayakan teknis/pengujian R1 terhadap plafon sumber daya dan prioritas klinis; tidak mengurangi kontrol wajib | Patah Pensil (teknis) + MADISING (prioritas pelayanan) |
| OPEN-18 | Penetapan penanggung jawab data/privasi dan evaluasi kebutuhan Pejabat PDP; pengendali = penyelenggara MADISING, pemroses = Patah Pensil (perlu pengesahan legal dan kontrak); Vendor tidak merangkap PJ privasi | Owner + legal |
| OPEN-19 | Matriks tindakan versi awal, kewenangan profesi, SOP, jenis pelimpahan yang sah, format pengesahan, pengawasan dan eskalasi; delegasi tidak aktif R1. Wajib diputuskan R0. | Pimpinan fasyankes/PJ Klinis + legal; Vendor menerjemahkan ke policy dan uji |
| OPEN-20 | Penawaran satu per satu diputuskan; radius/timeout penawaran, kapasitas, freshness GPS, kebijakan ETA, interval/retensi lokasi, provider peta/rute/push, transport realtime, fallback, izin OS serta penilaian privasi. Wajib diputuskan R0. | Vendor (teknis) + MADISING (operasi dan privasi) |

# 21. Change log dan traceability

| Aspek | Baseline | Perubahan V1.4.1–V1.4.2 |
|---|---|---|
| Identitas produk | MADISING V1.3.4+ | Dipertahankan |
| Enam dashboard | V1.3.6 | Dipertahankan, dengan spesifikasi akses dan acceptance tests terkonsolidasi |
| Registrasi akun | ACCOUNT-LOCK V1.3.6 | Dipertahankan, disertai lifecycle dan pengujian negatif |
| Wilayah | SIDRAP-LOCK | Dipertahankan, geofence produksi ditegaskan |
| SDM/Owner/Vendor | STAFF-LOCK, GOVERNANCE-LOCK | Dipertahankan; Patah Pensil disebut vendor resmi proyek |
| Katalog | 9 layanan V1.3.7 | Dimasukkan ke master PRD dengan gate profesi dan aktivasi |
| UI/UX | Prototipe HTML V1.3.7 | Referensi historis; alur inti disempurnakan pada V1.4.2, login nyata tetap wajib |
| Arsitektur | Konseptual sebelumnya | Modular monolith, satu codebase Flutter, web responsif, adapter RME |
| Keamanan | Kontrol dasar dan governance | Threat model, ASVS/MASVS, negative tests, DPIA, data minimization, go-live gates diperjelas |
| Rilis | Alur MVP dan mitra | Bertahap R0–R3; seluruh kategori terlihat, aktivasi sesuai kemampuan yang sah |
| Dokumen biaya | Rencana terpisah | Tidak ada nominal biaya di PRD |
| **V1.4.1 — pemisahan pihak** | Interpretasi lama Owner/Admin/Vendor | Owner dokter sekaligus PJ Klinis, satu Admin tenaga medis yang ditunjuk, Vendor Patah Pensil eksternal; pemisahan akun dan audit |
| **V1.4.1 — persetujuan teknis (CR-TECH-01)** | Ketentuan sebelumnya mensyaratkan approval Owner pada operasi teknis | Patah Pensil memutuskan dan menjalankan perubahan teknis melalui gerbang review, keamanan dan audit. Owner tidak menyetujui instruksi teknis rutin; data pasien/keputusan klinis tetap berada pada otorisasi MADISING. CR belum mengesampingkan persetujuan pengendali dan ketentuan break-glass. |
| **V1.4.1 — kewenangan CCO** | Review administratif/klinis belum dipisah rinci | Admin hanya menilai klinis awal dengan scope `CCO` dari Owner; tanpa akses PHI bebas |
| **V1.4.1 — aktivasi katalog** | Sign-off klinis generik | Transisi `VERIFIED/ACTIVE` harus ditandatangani Owner sebagai PJ Klinis |
| **V1.4.1 — status booking** | Status `REQUESTED` dan definisi slot belum lengkap | Penamaan `REQUESTED`, `CONFIRMED` dengan kapasitas dicadangkan, `ASSIGNED` atomik, pembayaran tetap OPEN-07 |
| **V1.4.1 — verifikasi/keputusan terbuka** | UAT-01..30, OPEN-01..12 | UAT-31..33 dan OPEN-13..18 ditambahkan; keputusan R0 tidak diasumsikan selesai |
| **V1.4.1 — klasifikasi rekam medis** | RME existing sebagai rujukan | Gerbang OPEN-04 memastikan status catatan klinis dan kewajiban RME sebelum skema `clinical_adapter` final |
| **V1.4.1 — GOV-03 & GOV-07 (CR)** | GOV-03 memperbolehkan penunjukan Vendor sebagai Admin; GOV-07 menyatukan kendali infrastruktur/kode | Vendor tidak menjadi Admin; repo/kode milik Patah Pensil sebagai pembuat; data produksi dan backup dikendalikan MADISING; hosting/DNS/serah terima OPEN-09 dan kontrak |
| **V1.4.1 — traceability** | Ketentuan dan uji rinci V1.3.6 | ROLE-LOCK di §2.1, pemetaan §21.1, nama status rekrutmen kanonik dan cabang STAFF-LOCK dipulihkan; persyaratan belum dimigrasi tetap berlaku melalui arsip |
| **V1.4.1 — SATUSEHAT prioritas R0** | Integrasi RME hanya digambarkan sebagai adapter | Evaluasi jalur RME existing atau integrasi langsung sah, Sandbox/mock, FHIR mapping, production gate dan bukti verifikasi pada OPEN-04; Patah Pensil mengambil keputusan teknis |
| **V1.4.1 — delegasi teknis (CR-TECH-01)** | Persetujuan teknis Owner menjadi gerbang tiap tindakan Vendor | Owner tidak menandatangani JSON/CI/CD; Vendor memimpin keamanan dan rilis teknis; keputusan klinis/data tetap pada MADISING; ketentuan lama yang terdampak dicatat sebagai CR untuk OPEN-12 |
| **V1.4.2 — fokus homecare** | Alur umum homecare | Pesan perawat sebagai CTA inti, layanan lain tetap sembilan kategori, bukan marketplace; §1, §7, §14 |
| **V1.4.2 — kewenangan klinis** | Gate umum | §3.4–3.5, CLA-01..06, NRS-09..12, DOC-07..09, OPEN-19, UAT-34..38/43/44/47 |
| **V1.4.2 — dispatch dan tracking** | Matching dan status dasar | §7.2.1–7.2.2, PAT-07/11, NRS-01/11, OPEN-20, UAT-39..42/46 |
| **V1.4.2 — UI inti** | Referensi visual V1.3.7 | §14 dan prototipe V1.4.2, UAT-45; tidak mengubah SIX-DASHBOARD-LOCK |

## 21.1 Pemetaan ketentuan V1.3.6 → V1.4.1

Pemetaan berikut disusun **dari ID dan teks yang benar-benar tercantum** dalam [arsip PRD V1.3.6](reference/MADISING_PRD_V1.3.6_Registrasi_Dashboard_Terkunci.md). Tanda **Dipindahkan** dipakai hanya untuk ketentuan dengan padanan substantif di V1.4.1; **Diubah (CR)** memerlukan penyelesaian OPEN-12 untuk dampak klinis/data atau perubahan ketentuan historis, bukan persetujuan Owner atas detail JSON/CI/CD; **Tetap berlaku dari V1.3.6** berarti persyaratan rinci dalam arsip belum dinyatakan tergantikan atau belum memiliki padanan identik. Kolom lokasi menunjukkan padanan utama atau lokasi detail yang masih dipertahankan, **bukan** klaim bahwa kode sudah mengimplementasikannya.

**Cakupan terhitung:** GOV 7, MAINT 11, ACC 16, ACC-T 18, STAFF-T 14, GOV-T 4 (**70 ID wajib**); ditambah STAFF-01..10 (10 hard gate) dan MAINT-T01..12 (12 skenario maintenance), sehingga **92 ID sumber** dipetakan. Penomoran lama dijaga untuk regresi. GOV-03 dan GOV-07 merupakan change request yang belum menggantikan keputusan historis sampai OPEN-12 selesai; ACC-11, ACC-T14, GOV-T03 dan MAINT-11 terdampak. **CR-TECH-01** menandai tambahan perubahan otorisasi teknis pada GOV-06, MAINT-04/05/07/08, MAINT-T03/04/08; hak pengendali data, gerbang klinis, dan §12.4 tidak dihapus.

| ID V1.3.6 | Ringkasan | Lokasi di V1.4.1 | Status |
|---|---|---|---|
| `GOV-01` | Owner boleh merangkap Admin dalam satu identitas manusia | §3.2.1; §3.3 | Dipindahkan |
| `GOV-02` | Vendor mempunyai identitas teknis khusus dan tidak menggunakan akun Admin bersama | §3.2.1; §9.7 | Dipindahkan |
| `GOV-03` | Vendor boleh bertugas sebagai Admin hanya setelah ditunjuk, dengan akun operasional terpisah | §3.2.1 (GOV-03 CR: Vendor tidak boleh menjadi Admin) | Diubah (CR) |
| `GOV-04` | Owner/Admin tidak otomatis mendapat izin membuka catatan RME atau file klinis | §3.2.1; §3.3; §12.2 | Dipindahkan |
| `GOV-05` | Verifikasi klinis dan pengesahan Owner terhadap akun perawat/dokter tetap berlaku (STAFF-LOCK) | §3.2.1; §6.1 | Dipindahkan |
| `GOV-06` | Perubahan kebijakan hak akses, ekspor data besar, dan akses vendor ke produksi merupakan operasi berisiko tinggi | §3.2.1 CR-TECH-01; §12.4 tetap; kontrol perubahan/akses PHI wajib diuji | Diubah (CR) |
| `GOV-07` | Kepemilikan infrastruktur dan hak administratif tertinggi berada pada entitas pengelola MADISING atau pihak yang sah ditunjuknya | §3.2.1 (GOV-07 CR: kode Vendor, data MADISING); §13.1 | Diubah (CR) |
| `MAINT-01` | Health monitoring | §9.7 VEN-01, VEN-03 (rincian tetap pada arsip) | Tetap berlaku dari V1.3.6 |
| `MAINT-02` | Diagnosis error & troubleshooting | §9.7 VEN-02, VEN-11 (rincian tetap pada arsip) | Tetap berlaku dari V1.3.6 |
| `MAINT-03` | Bug fix & perubahan kode | §13.1; §9.7 VEN-09 (rincian tetap pada arsip) | Tetap berlaku dari V1.3.6 |
| `MAINT-04` | Pembaruan dan deployment | §9.7 VEN-04/VEN-05; §13.1 CR-TECH-01 (approval teknis Vendor) | Diubah (CR) |
| `MAINT-05` | Backup & pemulihan | §9.7 VEN-06/VEN-07; §10.2 dan §13.1 (restore teknis vs otorisasi data) | Diubah (CR) |
| `MAINT-06` | Pengujian integrasi eksternal | §9.7 VEN-03, VEN-10 (rincian tetap pada arsip) | Tetap berlaku dari V1.3.6 |
| `MAINT-07` | Manajemen keamanan teknis | §9.7 VEN-09; §13.1 (rotasi teknis Vendor; data tetap terkontrol) | Diubah (CR) |
| `MAINT-08` | Akses darurat terkendali | §9.7 VEN-08; §3.2.1 CR-TECH-01; §12.4 tidak berubah | Diubah (CR) |
| `MAINT-09` | Kinerja dan kapasitas | §9.7 VEN-01 (rincian tetap pada arsip) | Tetap berlaku dari V1.3.6 |
| `MAINT-10` | Penanganan insiden dan continuity | §9.7 VEN-11 (rincian tetap pada arsip) | Tetap berlaku dari V1.3.6 |
| `MAINT-11` | Serah terima & terminasi vendor | §3.2.1 (GOV-07 CR); §9.7 VEN-12 (kewajiban offboarding tetap) | Diubah (CR) |
| `ACC-01` | Halaman publik hanya menawarkan Daftar sebagai Pasien atau Daftar sebagai Kurir | §6.1; §6.2 | Dipindahkan |
| `ACC-02` | Signup publik tidak menerima parameter 'role' dari pengguna sebagai sumber kebenaran | §6.2; §12.2 | Dipindahkan |
| `ACC-03` | Pasien memverifikasi kontak serta menyetujui pemberitahuan privasi sebelum akun aktif | §6.1; §6.3 | Dipindahkan |
| `ACC-04` | Kurir yang baru signup masuk status PENDING_VERIFICATION, tidak bisa menerima atau melihat order | §6.1; §6.2; §9.5 | Dipindahkan |
| `ACC-05` | Pembuatan dokter/perawat hanya lewat workflow STAFF-LOCK | §3.2.1; §6.1 | Dipindahkan |
| `ACC-06` | Pembuatan akun apotek hanya Admin berdasarkan mitra/cabang terverifikasi | §6.1; §12.2 SEC-06 | Dipindahkan |
| `ACC-07` | Admin mengirim tautan undangan sekali pakai yang kedaluwarsa; pemilik akun mengatur kredensial sendiri | §6.3 | Dipindahkan |
| `ACC-08` | Login sukses selalu diarahkan backend ke dashboard sesuai peran | §3.1; §6.2; §12.2 | Dipindahkan |
| `ACC-09` | Otorisasi berlaku pada endpoint, upload/download lampiran, pencarian, ekspor, webhook, dan background job | §3.3; §12.2 SEC-01 | Dipindahkan |
| `ACC-10` | Owner dapat merangkap Admin, tetapi aktivitas tetap menyimpan konteks hak yang digunakan | §3.2.1 (detail asal tetap di arsip) | Tetap berlaku dari V1.3.6 |
| `ACC-11` | Vendor menggunakan akun teknis terpisah dari akun Admin operasional (jika ditunjuk) | §3.2.1 (GOV-03 CR: tanpa opsi Vendor sebagai Admin); §9.7 | Diubah (CR) |
| `ACC-12` | Pengguna yang dinonaktifkan, izin praktik kedaluwarsa, atau kemitraan berakhir kehilangan kemampuan operasional | §6.2; §6.3; §12.2 | Dipindahkan |
| `ACC-13` | Reset password dan pemulihan akun memerlukan faktor verifikasi yang aman, tanpa pengungkapan apakah akun ada | §6.3 | Dipindahkan |
| `ACC-14` | Satu pasien bisa didaftarkan oleh keluarga/kuasa hanya melalui relasi perwakilan yang diverifikasi | §9.1 PAT-01; §7.1 | Dipindahkan |
| `ACC-15` | Wilayah Sidrap membatasi alamat tujuan kunjungan bukan tempat pengguna berada saat registrasi | §5; §17.1 UAT-01, UAT-13 | Dipindahkan |
| `ACC-16` | Tidak ada pembuatan otomatis akun internal oleh kurir/pasien yang berhasil login | §6.2; §12.2 | Dipindahkan |
| `ACC-T01` | Signup publik sebagai pasien | —; detail masih pada arsip V1.3.6 §2C.5 | Tetap berlaku dari V1.3.6 |
| `ACC-T02` | Signup publik sebagai kurir | §17.1 UAT-02 | Dipindahkan |
| `ACC-T03` | Signup payload 'role=doctor', 'role=nurse', 'role=pharmacy', 'role=admin', 'role=vendor' | §17.1 UAT-03 | Dipindahkan |
| `ACC-T04` | Dokter/perawat/apotek membuka halaman login | —; detail masih pada arsip V1.3.6 §2C.5 | Tetap berlaku dari V1.3.6 |
| `ACC-T05` | Admin membuat akun dokter/perawat tanpa verifikasi/approval | —; detail masih pada arsip V1.3.6 §2C.5 | Tetap berlaku dari V1.3.6 |
| `ACC-T06` | Admin membuat apotek tanpa verifikasi mitra | —; detail masih pada arsip V1.3.6 §2C.5 | Tetap berlaku dari V1.3.6 |
| `ACC-T07` | Admin menyetujui kurir | —; detail masih pada arsip V1.3.6 §2C.5 | Tetap berlaku dari V1.3.6 |
| `ACC-T08` | Kurir baru/pending membuka order pengantaran | §17.1 UAT-02 (pembatasan tugas); detail lama tetap | Tetap berlaku dari V1.3.6 |
| `ACC-T09` | Pasien mencoba endpoint klinis/resep/mitra | §17.1 UAT-05 | Dipindahkan |
| `ACC-T10` | Kurir X mengakses order Kurir Y | §17.1 UAT-10 | Dipindahkan |
| `ACC-T11` | Apotek A membuka order Apotek B | §17.1 UAT-09 | Dipindahkan |
| `ACC-T12` | Owner/Admin membuka foto klinis tanpa dasar izin | §17.1 UAT-07 | Dipindahkan |
| `ACC-T13` | Vendor login ke Developer Console | §17.1 UAT-06 | Dipindahkan |
| `ACC-T14` | Vendor ditunjuk Admin | §3.2.1 (GOV-03 CR: Vendor tidak dapat menjadi Admin) | Diubah (CR) |
| `ACC-T15` | Perawat/dokter dinonaktifkan | §17.1 UAT-26 | Dipindahkan |
| `ACC-T16` | Pasien mendaftar dari luar Sidrap tetapi booking alamat Sidrap | §17.1 UAT-01 | Dipindahkan |
| `ACC-T17` | Pasien dari Sidrap booking tujuan luar Sidrap | §17.1 UAT-13 | Dipindahkan |
| `ACC-T18` | Owner/Admin satu identitas menyetujui tindakan yang mewajibkan reviewer independen | —; detail masih pada arsip V1.3.6 §2C.5 | Tetap berlaku dari V1.3.6 |
| `STAFF-01` | Endpoint registrasi publik tidak boleh membuat akun role 'DOC' atau 'NRS', termasuk lewat perubahan payload/API | §6.1; §6.2 | Dipindahkan |
| `STAFF-02` | Hanya admin SDM berizin yang dapat *provision* akun dan hanya jika 'document_verified=true', 'clinical_approved=true', 'owner_approved=true' dan prasyarat lokal terpenuhi | —; detail masih pada arsip V1.3.6 §2B.4 | Tetap berlaku dari V1.3.6 |
| `STAFF-03` | Owner tidak memperoleh akses baca rekam medis hanya karena mengesahkan perekrutan | §3.2.1; §12.2 SEC-08 | Dipindahkan |
| `STAFF-04` | Kredensial dan SIP terkait fasilitas/jenis praktik/daerah; tidak lolos dispatch bila tidak cocok atau tidak berlaku | §7.2; §12.2 SEC-04 (detail lama tetap) | Tetap berlaku dari V1.3.6 |
| `STAFF-05` | Tugas medis/keperawatan dievaluasi berdasarkan 'clinical_privileges', bukan label generik “perawat” | §7.2; §9.2 NRS-05 (detail lama tetap) | Tetap berlaku dari V1.3.6 |
| `STAFF-06` | Akun *unique-per-person*, bukan akun bersama; MFA klinisi, kode undangan sekali pakai, pembatalan sesi saat dinonaktifkan | §6.3 (detail lama tetap) | Tetap berlaku dari V1.3.6 |
| `STAFF-07` | Surat/ijazah/nomor SIP dan STR adalah dokumen sensitif personel; akses least-privilege, audit akses/unduh, penyimpanan privat terenkripsi, masa retensi sesuai kebijakan hukum | —; detail masih pada arsip V1.3.6 §2B.4 | Tetap berlaku dari V1.3.6 |
| `STAFF-08` | Perubahan peran/perizinan, expiry SIP dan revokasi hak klinis harus memicu peninjauan tugas aktif serta pemberitahuan ke pihak penanggung jawab | —; detail masih pada arsip V1.3.6 §2B.4 | Tetap berlaku dari V1.3.6 |
| `STAFF-09` | Dashboard perawat dan dokter tidak menampilkan tombol daftar akun; hanya masuk/aktivasi undangan. Role switch pada HTML prototipe merupakan alat simulasi UI, bukan autentikasi nyata | §6.1; §14 (detail lama tetap) | Tetap berlaku dari V1.3.6 |
| `STAFF-10` | Akun masih 'INVITED' tidak dapat menerima pasien, memberi instruksi, atau menandatangani resep | —; detail masih pada arsip V1.3.6 §2B.4 | Tetap berlaku dari V1.3.6 |
| `STAFF-T01` | Publik mencoba signup dokter atau perawat | §17.1 UAT-03 | Dipindahkan |
| `STAFF-T02` | Admin mencoba langsung aktifkan kandidat belum diverifikasi | —; detail masih pada arsip V1.3.6 §2B.6 | Tetap berlaku dari V1.3.6 |
| `STAFF-T03` | Dokumen STR/SIP ada tetapi belum diperiksa sumbernya | —; detail masih pada arsip V1.3.6 §2B.6 | Tetap berlaku dari V1.3.6 |
| `STAFF-T04` | Kandidat tanpa SIP sesuai konteks praktik | —; detail masih pada arsip V1.3.6 §2B.6 | Tetap berlaku dari V1.3.6 |
| `STAFF-T05` | Kompetensi perawatan luka tanpa privilege tindakan lain | —; detail masih pada arsip V1.3.6 §2B.6 | Tetap berlaku dari V1.3.6 |
| `STAFF-T06` | Admin mencoba mengesahkan keputusan Owner | —; detail masih pada arsip V1.3.6 §2B.6 | Tetap berlaku dari V1.3.6 |
| `STAFF-T07` | Owner menyetujui tanpa review klinis | —; detail masih pada arsip V1.3.6 §2B.6 | Tetap berlaku dari V1.3.6 |
| `STAFF-T08` | Semua syarat lolos dan Admin mengundang | §6.2; §6.3 (detail lama tetap) | Tetap berlaku dari V1.3.6 |
| `STAFF-T09` | Undangan dipakai berulang atau kedaluwarsa | —; detail masih pada arsip V1.3.6 §2B.6 | Tetap berlaku dari V1.3.6 |
| `STAFF-T10` | SIP kedaluwarsa setelah akun aktif | §17.1 UAT-12 | Dipindahkan |
| `STAFF-T11` | Perawat berstatus suspended mencoba check-in | —; detail masih pada arsip V1.3.6 §2B.6 | Tetap berlaku dari V1.3.6 |
| `STAFF-T12` | Dokter di luar relasi perawatan membuka rekam medis | §17.1 UAT-08 | Dipindahkan |
| `STAFF-T13` | Wilayah booking di luar Sidrap | §17.1 UAT-13 | Dipindahkan |
| `STAFF-T14` | Perpindahan peran via manipulasi UI | §17.1 UAT-04, UAT-05 (detail lama tetap) | Tetap berlaku dari V1.3.6 |
| `GOV-T01` | Owner sekaligus admin masuk dan menjalankan dua konteks | §3.2.1 (uji konteks lama tetap berlaku) | Tetap berlaku dari V1.3.6 |
| `GOV-T02` | Vendor teknis mencoba membuka profil/diagnosis/foto pasien melalui API langsung | §17.1 UAT-06 | Dipindahkan |
| `GOV-T03` | Vendor dengan akun teknis mencoba membuat akun perawat | §3.2.1 (GOV-03 CR: Vendor tidak memiliki jalur Admin) | Diubah (CR) |
| `GOV-T04` | Owner/Admin mencoba meloloskan kandidat tanpa validasi klinis independen | §3.2.1 (uji kelayakan klinis tetap berlaku) | Tetap berlaku dari V1.3.6 |
| `MAINT-T01` | Sistem API gagal / antrean webhook berhenti | —; detail masih pada arsip V1.3.6 §12A | Tetap berlaku dari V1.3.6 |
| `MAINT-T02` | Error log mengandung data klinis dan token uji | —; detail masih pada arsip V1.3.6 §12A | Tetap berlaku dari V1.3.6 |
| `MAINT-T03` | Vendor meminta akses privileged produksi | §17.1 UAT-31; §9.7 VEN-08; perubahan approval teknis pending | Diubah (CR) |
| `MAINT-T04` | Vendor mencoba deploy perubahan kritis tanpa persetujuan | §17.1 UAT-31; deployment tanpa gerbang teknis tetap ditolak | Diubah (CR) |
| `MAINT-T05` | Pengelola menyetujui release yang lulus uji | —; detail masih pada arsip V1.3.6 §12A | Tetap berlaku dari V1.3.6 |
| `MAINT-T06` | Simulasi backup gagal | —; detail masih pada arsip V1.3.6 §12A | Tetap berlaku dari V1.3.6 |
| `MAINT-T07` | Uji restore pada lingkungan terisolasi | —; detail masih pada arsip V1.3.6 §12A | Tetap berlaku dari V1.3.6 |
| `MAINT-T08` | Vendor meminta restore produksi tanpa approval terpisah | §17.1 UAT-31; restore teknis dengan kontrol, PHI tetap membutuhkan otorisasi sah | Diubah (CR) |
| `MAINT-T09` | Vendor mencoba menghapus audit aktivitasnya sendiri | §12.4 (rincian lama tetap berlaku) | Tetap berlaku dari V1.3.6 |
| `MAINT-T10` | Owner mencabut akses vendor saat kontrak selesai | §9.7 VEN-12 (rincian lama tetap berlaku) | Tetap berlaku dari V1.3.6 |
| `MAINT-T11` | Hotfix darurat terjadi ketika otorisator tidak tersedia | —; detail masih pada arsip V1.3.6 §12A | Tetap berlaku dari V1.3.6 |
| `MAINT-T12` | Pemeliharaan connector apotek/kurir/RME | —; detail masih pada arsip V1.3.6 §12A | Tetap berlaku dari V1.3.6 |

# 22. Persetujuan dan pengendalian versi

Dokumen ini adalah **revisi PRD V1.4.1** berdasarkan penajaman fokus homecare pada 15 November 2026. V1.4.1 disimpan untuk histori; usulan V1.4.2 menggantikan spesifikasi aktif yang bertentangan setelah pengesahan yang diperlukan. Belum otomatis mengubah keputusan yang sebelumnya dikunci. Implementasi dilakukan berdasarkan acceptance criteria dan ketentuan yang telah disahkan. Revisi PRD dilakukan melalui Pull Request dengan ringkasan perubahan dan analisis dampak terhadap privasi/keamanan/klinis.

Tanda persetujuan yang dibutuhkan:

- **Owner MADISING (dokter) — juga dalam kapasitas Dokter PJ Klinis:** kebijakan pelayanan, SOP, eligibility, triase, instruksi, rujukan, dokumentasi klinis dan aktivasi katalog; otorisasi institusional atas tujuan/penggunaan data pasien bersama pejabat data yang sah. Tidak diminta menyetujui konfigurasi JSON, pilihan database, desain API atau perintah deployment.
- **Penanggung jawab data/privasi — belum ditetapkan (OPEN-18):** kepatuhan pengolahan data, kontrol akses, integrasi, retensi, kontrak pemrosesan dan DPIA; persetujuan dilakukan setelah penetapannya sah.
- **Vendor Patah Pensil — kelayakan teknis:** keputusan arsitektur, implementasi, keamanan teknis, integrasi SATUSEHAT, testing, deployment, backup dan CI/CD; bukan penanda tangan klinis atau pengendali data.

Admin operasional bukan penanda tangan PRD; fungsi Admin dijalankan berdasarkan penunjukan dan batas kewenangan Owner.

# 23. Referensi normatif dan sumber teknis

**Dokumen internal:**

- `MADISING_PRD_V1.3.6_Registrasi_Dashboard_Terkunci.md` — dasar ketentuan terkunci.
- `docs/reference/MADISING_UIUX_Prototype_V1.3.7.html` — referensi pengalaman pengguna terbaru.
- `MADISING_Addendum_Katalog_Layanan_V1.3.7.md` — sembilan layanan dan gate profesi.

**Sumber resmi/standar (referensi V1.4.1 dan tambahan 15 November 2026):**

1. UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi: https://jdih.komdigi.go.id/produk_hukum/view/id/832/t/crc32/ (data kesehatan merupakan data pribadi spesifik; penilaian dampak untuk pemrosesan berisiko tinggi).
2. Permenkes No. 24 Tahun 2022 tentang Rekam Medis, status berlaku: https://jdih.kemkes.go.id/documents/peraturan-menteri-kesehatan-nomor-24-tahun-2022 .
3. Permenkes No. 11 Tahun 2025 tentang standar kegiatan usaha dan produk/jasa dalam perizinan berusaha subsektor kesehatan: https://jdih.kemkes.go.id/documents/peraturan-menteri-kesehatan-nomor-11-tahun-2025 . Perizinan spesifik setiap layanan tetap harus ditelaah penanggung jawab berwenang.
4. OWASP ASVS 5.0.0 (rilis stabil): https://asvs.owasp.org/ .
5. OWASP MASVS: https://mas.owasp.org/MASVS/ .
6. Dokumentasi interoperability SATUSEHAT, HL7 FHIR dan penggunaan sandbox: https://satusehat.kemkes.go.id/platform/docs/id/api-catalogue/integrations/ .
7. Permenkes No. 20 Tahun 2019 tentang telemedicine antar fasilitas pelayanan kesehatan: https://jdih.kemkes.go.id/documents/peraturan-menteri-kesehatan-nomor-20-tahun-2019 . **Bukan** dasar otomatis untuk setiap model konsultasi langsung ke pasien; ruang lingkup MADISING memerlukan telaah regulasi terkini.

8. Permenkes No. 13 Tahun 2025 tentang Pengelolaan SDM Kesehatan, khususnya Pasal 182–184: https://jdih.kemkes.go.id/documents/peraturan-menteri-kesehatan-nomor-13-tahun-2025 .
9. Kepmenkes HK.01.07/MENKES/425/2020 tentang Standar Profesi Perawat: https://jdih.kemkes.go.id/documents/keputusan-menteri-kesehatan-nomor-hk0107menkes4252020 .

---

**Akhir PRD V1.4.2.**

## Addendum keputusan pengembangan V1.4.3

[Keputusan 15 November 2026](DEVELOPMENT_DECISIONS_2026-11-15.md) berlaku atas ketentuan yang bertentangan dalam dokumen ini. Fokus Web First: Next.js dan NestJS pada origin staging terpisah dari PostgreSQL privat, Cloudflare di depan, data sintetis, pengujian browser sebelum Flutter. RME, klinis, data dan rilis tetap tunduk pada gerbang sebelumnya. Tidak ada tindakan medis, komunikasi klinis atau pembayaran nyata pada uji sintetis.
