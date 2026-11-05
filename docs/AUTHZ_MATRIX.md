# MADISING — Implementasi awal AuthN/AuthZ (R0 → R1)

Status: **implementasi baseline, belum siap pasien nyata**.
Referensi produk: [PRD V1.4.1](PRD_V1.4.1.md) dan prototipe V1.3.7.

## Identity boundary / prinsip keamanan

- Login dan verifikasi token **tidak dibuat sendiri**. Produksi akan menggunakan provider OIDC terverifikasi, dengan library standar untuk signature/JWKS, issuer, audience, TTL, dan assurance MFA.
- Runtime saat ini **fail closed**: endpoint privat mengembalikan 401 sampai implementasi OIDC serta PostgreSQL identity adapter yang telah diuji dihubungkan. Header \`X-Role\`, parameter \`role\`, atau daftar role dari JWT tidak pernah menentukan privilege.
- \`loadPrincipal(issuer,subject)\` HARUS mengambil account state dan role bindings yang aktif dari database pada setiap request (atau cache dengan revocation semantik yang diuji). User tidak dapat memperbarui data role binding melalui self-service.
- Untuk session MFA wajib DOC, ADM, OWN, VEN. Pernyataan \`mfa: true\` hanya diterima dari adapter OIDC terverifikasi. Tanda tangan, issuer, audience dan amr/acr harus dicek oleh adapter; \`mfa\` dari token/klien tanpa verifikasi tidak valid.
- Account status nonaktif atau izin profesi expired ditolak. CUR yang \`PENDING_REVIEW\` hanya bisa melihat dashboard status pelamar, bukan menerima tugas.
- Patah Pensil merupakan **vendor teknis** terpisah; status Owner/Admin tidak menjadi hak baca PHI dan tidak otomatis memperoleh konteks vendor.

## Enam dashboard

| Dashboard | Role | Ketentuan |
|---|---|---|
| patient | PAT | Akun ACTIVE; hanya data sendiri / kuasa sah setelah verifikasi |
| nurse | NRS | ACTIVE, kredensial VERIFIED, tidak kedaluwarsa, assignment aktif |
| doctor | DOC | ACTIVE, MFA, kredensial VERIFIED, clinical relationship |
| pharmacy | PHA | ACTIVE, kredensial VERIFIED, tenant terikat |
| courier | CUR | Pelamar bisa lihat status; tugas hanya ACTIVE dan terverifikasi |
| admin | ADM/OWN | ACTIVE, MFA; operasi tanpa akses PHI bebas |

Vendor \`VEN\` bukan dashboard ketujuh. Endpoint \`/api/v1/vendor/status\` hanya metadata teknis tersanitasi.

## Matriks izin teruji (fungsi murni)

| Action | PAT | NRS | DOC | PHA | CUR | ADM/OWN | VEN |
|---|---|---|---|---|---|---|---|
| booking.create | Milik sendiri | Tolak | Tolak | Tolak | Tolak | Tolak | Tolak |
| booking.read | Milik sendiri | Ditugaskan | Hubungan klinis | Tolak | Tolak | Metadata operasi | Tolak |
| clinical.read | Tolak* | Ditugaskan | Hubungan klinis | Tolak | Tolak | Tolak | Tolak |
| prescription.create | Tolak | Tolak | Kasus aktif & berwenang | Tolak | Tolak | Tolak | Tolak |
| pharmacy.order.read | Tolak | Tolak | Tolak | Tenant yang sama | Tolak | Tolak | Tolak |
| delivery.task.read | Tolak | Tolak | Tolak | Tolak | Ditugaskan | Tolak | Tolak |
| operations.read | Tolak | Tolak | Tolak | Tolak | Tolak | Metadata operasi | Tolak |
| maintenance.status.read | Tolak | Tolak | Tolak | Tolak | Tolak | Tolak | Teknis tersanitasi |

*Pasien memperoleh ringkasan yang sah melalui endpoint khusus kemudian, bukan kebebasan membuka objek clinical internal.

> **Penting:** semua atribut \`resource\` dalam policy harus disediakan melalui query DB terikat identitas dan relasi. Jangan membuat endpoint yang menerima \`assignedNurseAccountId\`, \`tenantId\`, \`authorizedDoctorAccountId\` dari JSON klien sebagai sumber kebenaran. Fungsi ini belum diterapkan ke endpoint klinis karena endpoint tersebut belum diaktifkan.

## Database

Migration \`infra/postgres/migrations/001_identity_authz.sql\` menyiapkan \`accounts\`, \`role_bindings\`, dan \`access_audit\`. Migration tidak otomatis dijalankan CI. Skema ini belum merupakan database klinis atau RME. Audit append-only di tingkat DB membutuhkan sistem ekspor eksternal, grant minimal dan verifikasi untuk menahan perubahan oleh role DB berprivilege.

## Kriteria integrasi berikutnya

1. Tentukan provider OIDC, skema MFA dan metode verifikasi identitas pasien/kurir.
2. Implementasikan adapter verifikasi token dengan SDK standar, mapping issuer/subject ke akun dan status di PostgreSQL.
3. Susun permission matrix endpoint klinis dan object lookup yang menguji assignment/tenant dari DB.
4. Implementasikan provisioning staf yang hanya bisa dilakukan Admin setelah evidence/approval klinis; undangan sekali pakai tanpa password dikirim Admin.
5. Pengujian integrasi pada PostgreSQL staging, MFA, expired token, account revocation, race/IDOR, dan audit.
6. Uji keamanan independen, DPIA dan sign-off klinis sebelum data pasien nyata.
