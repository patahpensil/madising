# MADISING — GitHub governance and release gates

**Status:** panduan konfigurasi. Berkas ini tidak otomatis mengaktifkan ruleset,
environment approval, review, staging, atau deployment produksi.

## 1. Riwayat PR sebelum konsolidasi (15 November 2026)

- PR #1: `chore/initial-foundation` → `main` (Draft; fondasi + PRD V1.4.0).
- PR #3: `feature/identity-authz-baseline` → `chore/initial-foundation` (Draft; identitas dan keamanan).
- PR #4: `docs/prd-v1.4.1-governance-consistency` → `feature/identity-authz-baseline` (Draft; PRD V1.4.1 dengan change requests klinis/data).
- Jangan merge PR #4 hanya karena checks berhasil. Persetujuan substantif OPEN-12/OPEN-18 belum otomatis diperoleh.
- Setelah review dan prasyarat PR #1 dipenuhi, merge secara berurutan; retarget basis PR berikutnya ke `main` dan pastikan diff/CI tetap benar.
- Pertahankan SHA/CI traceability, jangan force push `main`.

## 2. Konfigurasi yang harus diaktifkan di Settings oleh pengelola repository

**Settings → Rules → Rulesets:** buat aturan aktif untuk `main`.
Minimal: blokir force-push dan delete, wajib pull request sebelum merge,
wajib status checks lulus, review sebelum merge, dan penyelesaian conversation.
Jika fitur private-repository rulesets/required checks belum tersedia pada
paket GitHub, catat keterbatasan dan wajibkan persetujuan manual lewat PR.
File dokumentasi dan status CI saja bukan pengganti perlindungan branch.

PR #1, #3, #4, #6, #7, #8, #9 sudah digabung ke main untuk baseline pengembangan sintetis; tidak mengesahkan OPEN-12/18. Main belum dilindungi.

Required check/job yang saat ini tersedia:
- `Foundation API tests`
- `Flutter static analysis and tests`
- `PostgreSQL identity schema and constraints`
- `Reject tracked credentials and patient exports`
- `Locked requirements recorded`
- `NestJS Next.js PostgreSQL synthetic integration`

**Settings → Environments:** siapkan `staging` dan `production` terpisah.
Staging menggunakan data sintetis saja. `production` memerlukan manual
review sebelum pekerjaan deployment, scoped credentials, audit, rollback,
dan pemisahan keputusan teknis vs persetujuan klinis/data. Jangan menyimpan
kredensial pasien atau token API di repository. Belum ada workflow deploy
yang diaktifkan oleh langkah dokumentasi ini.

## 3. Tanggung jawab

- **Patah Pensil**: penanggung jawab teknis, arsitektur, CI, perbaikan,
  keamanan teknis dan operasi rilis terkontrol.
- **MADISING Owner/PJ Klinis**: izin layanan, SOP, aktivasi klinis,
  serta persetujuan perubahan historis yang mengikat pada OPEN-12.
- **Pengendali/penanggung jawab data sah**: pengolahan data pasien, integrasi
  dan kontrak terkait (OPEN-18). Vendor tidak memperoleh hak PHI rutin.

Tidak ada kelayakan go-live hanya dari checklist ini. PRD dan UAT yang
relevan harus lulus terlebih dahulu. Tidak ada pasien/data nyata di CI.

## 4. Batas pengujian saat ini

CI mencakup Node tests, Flutter analyze/widget tests, PostgreSQL smoke,
heuristik file rahasia, dan pemeriksaan token keputusan LOCK. Ini **bukan**
audit OWASP ASVS/MASVS lengkap, SAST penuh, pentest, verifikasi
kredensial production, atau pengujian end-to-end alur klinis.

Sebelum pengguna nyata: tambahkan scanner secret dengan histori commit,
SAST/dependency scanning yang sesuai izin paket, analisis ancaman,
integration tests OIDC/DB, uji akses negatif dan isolasi tenant,
pengujian restore, dan penilaian independen.
