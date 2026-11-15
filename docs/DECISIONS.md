# MADISING — Locked Product Decisions

**PRD V1.4.2 adalah proposed master**. Patah Pensil menetapkan keputusan rekayasa teknis; **OPEN-12** tetap diperlukan untuk pengesahan perubahan ketentuan historis yang mengikat MADISING, aspek klinis, dan tata kelola data. Owner tidak perlu menilai file JSON, stack, CI/CD ataupun detail keamanan teknis. LOCK V1.3.6 diringkas pada §2.1 PRD V1.4.2; rincian ketentuan dan uji V1.3.6 dipetakan di §21.1 dan yang belum dipindahkan tetap berlaku melalui arsip V1.3.6; salinan historis [PRD V1.3.6](reference/MADISING_PRD_V1.3.6_Registrasi_Dashboard_Terkunci.md) diarsipkan di `docs/reference/` untuk traceability. Arsip tidak secara otomatis mengesahkan interpretasi tata kelola lama; klarifikasi V1.4.1 harus disetujui Owner melalui OPEN-12. Selama menunggu persetujuan, ketentuan LOCK V1.3.6 tetap berlaku.

## SIX-DASHBOARD-LOCK

Six operational experiences with server-enforced authorization: **Patient, Nurse, Doctor, Pharmacy, Courier, and Admin/Owner**. Never grant access by frontend route selection alone.

## ACCOUNT-LOCK

- Patients and couriers: self-registration is allowed, with verification.
- Courier registration **does not** grant permission to accept deliveries; Admin approval is required first.
- Nurse, doctor, pharmacy: **no public signup**. Accounts provisioned by Admin following relevant verification and approval.
- Owner dapat tetap menggunakan konteks ADM sesuai GOVERNANCE-LOCK dengan audit terpisah, tetapi satu akun Admin harian dipegang tenaga medis yang ditunjuk Owner. Owner dan Admin adalah pihak berbeda.

## STAFF-LOCK

Owner MADISING (dokter, PJ Klinis) menyeleksi dan menyetujui staf/tenaga. Admin yang ditunjuk memeriksa dokumen/kredensial dan mengirim undangan hanya setelah persetujuan serta pemeriksaan kompetensi/kewenangan yang diperlukan. Dispatch tetap memeriksa kelayakan aktif dan kompetensi.

## SIDRAP-LOCK

Pilot homecare service area: **Kabupaten Sidenreng Rappang (Sidrap)** only, based on **visit destination**, not the requesting user's device location. Its 11 districts are Maritengngae, Panca Rijang, Baranti, Kulo, Watang Pulu, Panca Lautang, Tellu Limpoe, Watang Sidenreng, Dua Pitue, Pitu Riawa, and Pitu Riase. Production location checks require authoritative polygons and backend validation, never dropdown-only acceptance.

## GOVERNANCE-LOCK / VENDOR-MAINTENANCE

Owner (dokter, PJ Klinis), satu Admin operasional tenaga medis yang ditunjuk Owner, dan Vendor **Patah Pensil** adalah **tiga pihak berbeda**. Akun Owner `INTERNAL` untuk OWN/ADM bila digunakan, serta akun dokter `CLINICIAN` untuk DOC, harus terpisah; Admin memakai akun `INTERNAL` role ADM. Scope `CCO` Admin adalah **opsional**, hanya jika diberikan Owner, dapat dicabut dan diaudit, dan belum diimplementasikan.

Patah Pensil memakai identitas `VENDOR`/`VEN` yang terpisah dari Admin dan bukan pemilik atau pemberi layanan kesehatan. Kemampuan **VENDOR-MAINTENANCE** wajib mencakup monitoring, perbaikan, deployment terkendali, backup/recovery, integrasi SATUSEHAT/RME, penanganan insiden dan pencabutan akses, tanpa akses PHI rutin. **CR-TECH-01 (usulan penyelarasan tata kelola):** Patah Pensil berwenang memutuskan stack, database, pengamanan, CI/CD, patch, rilis dan pemulihan teknis melalui gerbang keamanan, review dan audit; Owner tidak menjadi approver tindakan teknis rutin. Akses PHI, pengaturan pemrosesan data, dampak klinis atau keputusan institusional tetap memerlukan otorisasi sah MADISING; perubahan kewajiban persetujuan historis belum efektif sebelum OPEN-12/OPEN-18 terselesaikan. Akses istimewa tetap terbatas, sementara dan diaudit.

**Perubahan ketentuan terkunci V1.3.6, efektif hanya setelah OPEN-12 disetujui Owner (juga sebagai Dokter PJ Klinis):**
- **Menggantikan GOV-03 V1.3.6 — Vendor bukan Admin:** Vendor Patah Pensil tidak dapat ditunjuk sebagai Admin operasional dan tidak memegang role `ADM`/`OWN`. Akun teknis `VEN` tidak memperoleh hak Admin; akibatnya ACC-11, ACC-T14, dan GOV-T03 perlu mengikuti change request ini.
- **Menggantikan GOV-07 V1.3.6 — kepemilikan kode dan data:** repository `patahpensil/madising` dan kode sumber dimiliki serta dikelola **Patah Pensil sebagai pembuat aplikasi**, bukan Owner MADISING. **MADISING mengendalikan data pasien produksi dan backup-nya**, sedangkan Patah Pensil menjalankan fungsi pemroses data menurut pengaturan yang perlu dikonfirmasi pada OPEN-18. Akses Vendor terhadap data produksi berdasarkan persetujuan Owner dan dapat dicabut. Hosting, DNS, dan serah terima merupakan **OPEN-09 dan kontrak**, tidak diputuskan sepihak melalui catatan ini. Perubahan ini juga berdampak pada interpretasi MAINT-11.

Sebelum OPEN-12 diselesaikan, GOV-03/GOV-07 dan ketentuan persetujuan operasi berisiko yang terdampak CR-TECH-01 tetap dibaca sebagai ketentuan historis yang sedang diajukan perubahan, bukan dianggap digantikan otomatis. Pelaksanaan teknis nonklinis dapat diteruskan dengan data sintetis; akses Production/data pasien nyata tidak boleh melewati gerbang kewenangan.

## PRIORITY — SATUSEHAT interoperability

Integrasi SATUSEHAT adalah prioritas **R0 feasibility dan R1 implementation**. Patah Pensil bertanggung jawab memeriksa dua jalur: **RME existing dengan API/bridging sah** atau **integrasi langsung yang memenuhi ketentuan fasyankes/partner system**. Kode akses Production bukan hak otomatis Vendor; fasyankes yang berwenang harus teridentifikasi dan otorisasi pertukaran data harus sah. Gunakan mock/Sandbox dengan data sintetis sampai jalur, kredensial dan izin benar-benar terverifikasi. Rujuk [rencana integrasi](SATUSEHAT_INTEGRATION_PLAN.md) dan OPEN-04/OPEN-18.

## Clinical integrity

MADISING berfokus pada pemesanan perawat untuk kunjungan rumah (nurse-led, physician-supported), bukan marketplace. Dokter menetapkan diagnosis medis, terapi dan resep. Perawat melakukan pengkajian, diagnosis keperawatan, rencana, tindakan dan evaluasi mandiri sesuai kewenangan; mandat medis hanya jika diperlukan dan sah. Delegasi tidak diaktifkan pada R1. OPEN-19/20 menutup matriks tindakan dan dispatch/tracking sebelum implementasi klinis R1 difinalkan. Pharmacists validate dispensing; couriers receive minimum delivery information. Existing RME is the authoritative medical record system until explicit integration design proves otherwise.

## Scope and financing

Pilot target: implementation with budget ceilings under evaluation (Rp30 million build, Rp5 million/month IT). Cost ceilings never override clinical safety and mandatory production security controls. Kesesuaian cakupan R1 dengan plafon merupakan **OPEN-17**; nominal tidak dimasukkan dalam PRD.
