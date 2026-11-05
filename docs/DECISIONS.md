# MADISING — Locked Product Decisions

**PRD V1.4.1 adalah proposed master**, berlaku setelah **OPEN-12** disetujui oleh Owner (dokter sekaligus PJ Klinis). LOCK V1.3.6 diringkas pada §2.1 PRD V1.4.1; rincian ketentuan dan uji V1.3.6 dipetakan di §21.1 dan yang belum dipindahkan tetap berlaku melalui arsip V1.3.6; salinan historis [PRD V1.3.6](reference/MADISING_PRD_V1.3.6_Registrasi_Dashboard_Terkunci.md) diarsipkan di `docs/reference/` untuk traceability. Arsip tidak secara otomatis mengesahkan interpretasi tata kelola lama; klarifikasi V1.4.1 harus disetujui Owner melalui OPEN-12. Selama menunggu persetujuan, ketentuan LOCK V1.3.6 tetap berlaku.

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

Patah Pensil memakai identitas `VENDOR`/`VEN` yang terpisah dari Admin dan bukan pemilik atau pemberi layanan kesehatan. Kemampuan **VENDOR-MAINTENANCE** wajib mencakup monitoring, perbaikan, deployment terkendali, backup/recovery, integrasi, penanganan insiden dan pencabutan akses, tanpa akses PHI rutin. Operasi teknis produksi (deployment, restore, JIT, rotasi kredensial) diajukan/dijalankan Vendor **setelah persetujuan Owner**; Vendor tidak menyetujui permintaannya sendiri. Hak istimewa bersifat terbatas, sementara dan diaudit.

**Perubahan ketentuan terkunci V1.3.6, efektif hanya setelah OPEN-12 disetujui Owner (juga sebagai Dokter PJ Klinis):**
- **Menggantikan GOV-03 V1.3.6 — Vendor bukan Admin:** Vendor Patah Pensil tidak dapat ditunjuk sebagai Admin operasional dan tidak memegang role `ADM`/`OWN`. Akun teknis `VEN` tidak memperoleh hak Admin; akibatnya ACC-11, ACC-T14, dan GOV-T03 perlu mengikuti change request ini.
- **Menggantikan GOV-07 V1.3.6 — kepemilikan kode dan data:** repository `patahpensil/madising` dan kode sumber dimiliki serta dikelola **Patah Pensil sebagai pembuat aplikasi**, bukan Owner MADISING. **MADISING mengendalikan data pasien produksi dan backup-nya**, sedangkan Patah Pensil menjalankan fungsi pemroses data menurut pengaturan yang perlu dikonfirmasi pada OPEN-18. Akses Vendor terhadap data produksi berdasarkan persetujuan Owner dan dapat dicabut. Hosting, DNS, dan serah terima merupakan **OPEN-09 dan kontrak**, tidak diputuskan sepihak melalui catatan ini. Perubahan ini juga berdampak pada interpretasi MAINT-11.

Sebelum OPEN-12 disetujui, bagian GOV-03/GOV-07 di arsip V1.3.6 tetap dibaca sebagai ketentuan historis yang sedang diajukan perubahannya, bukan dianggap sudah digantikan otomatis.

## Clinical integrity

Doctors own medical diagnoses and valid prescriptions. Nurses assess and execute within their legal/clinical scope. Pharmacists validate dispensing; couriers receive minimum delivery information. Existing RME is the authoritative medical record system until explicit integration design proves otherwise.

## Scope and financing

Pilot target: AI-assisted implementation with budget ceilings under evaluation (Rp30 million build, Rp5 million/month IT). Cost ceilings never override clinical safety and mandatory production security controls. Kesesuaian cakupan R1 dengan plafon merupakan **OPEN-17**; nominal tidak dimasukkan dalam PRD.
