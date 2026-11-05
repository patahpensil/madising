# MADISING — Layanan V1.3.7

Katalog layanan ditambahkan atas instruksi Pemilik dari referensi sembilan kategori layanan homecare. Ini menambah pilihan pada **dashboard Pasien**, tidak mengubah enam dashboard, SIDRAP-LOCK, STAFF-LOCK, ACCOUNT-LOCK, vendor Patah Pensil, maupun kontrol kewenangan klinis PRD V1.3.6.

| Layanan | Model penugasan di prototipe |
| --- | --- |
| Layanan Medis & Kunjungan Dokter | Harus diverifikasi Admin, tidak otomatis kepada perawat |
| Tindakan Keperawatan Khusus | Alur demo perawat dengan instruksi klinis |
| Perawatan Luka | Alur demo perawat dengan instruksi klinis |
| Fisioterapi & Rehabilitasi | Harus diverifikasi Admin, tidak otomatis kepada perawat |
| Terapi Tambahan | Harus diverifikasi Admin, tidak otomatis kepada perawat |
| Perawatan Pascaoperasi | Alur demo perawat dengan instruksi klinis |
| Perawatan Lansia & Pramurukti | Harus diverifikasi Admin, tidak otomatis kepada perawat |
| Perawatan Ibu & Bayi | Harus diverifikasi Admin, tidak otomatis kepada perawat |
| Pemeriksaan Laboratorium | Harus diverifikasi Admin, tidak otomatis kepada perawat |

## Keputusan implementasi

- Sembilan kategori adalah **katalog**, bukan deklarasi bahwa seluruh layanan sudah tersedia secara operasional.
- Untuk tindakan klinis, produksi wajib memvalidasi izin, kompetensi, indikasi medis, persetujuan dan SOP.
- Kunjungan dokter, fisioterapi, terapi khusus, pendampingan lansia, ibu/bayi, dan laboratorium tidak boleh dialihkan secara otomatis ke akun perawat biasa.
- Caregiver/pramurukti nonmedis tidak boleh menjalankan tindakan keperawatan.
- Pemeriksaan laboratorium membutuhkan mitra laboratorium dan tata kelola sampel.
- Booking tetap hanya menerima **tujuan kunjungan Sidrap**; tanda gawat darurat diarahkan ke layanan darurat, bukan booking rutin.
- Harga, jadwal dan status aktif harus dikelola sistem, bukan diklaim berdasarkan prototipe.
- File data tersedia dalam `apps/api/resources/services.json`. Tidak ada endpoint produksi; registrasi atau rekam medis belum diimplementasikan.
- Rancangan visual terbaru: `docs/reference/MADISING_UIUX_Prototype_V1.3.7.html` (prototipe HTML terpisah, belum deploy).

## Pekerjaan yang harus diuji saat implementasi

1. RBAC/ABAC pada semua layanan dan assignment.
2. Siklus status layanan: `DRAFT → VERIFIED → ACTIVE ↔ SUSPENDED → RETIRED`. Transisi ke `VERIFIED` maupun `ACTIVE` memerlukan sign-off **Owner sebagai Dokter PJ Klinis**; Admin tidak dapat mengaktifkan layanan secara mandiri. Kesiapan tenaga/mitra diperiksa terpisah.
3. Triage dan verifikasi dokter bila suatu tindakan memerlukannya.
4. Penerusan permintaan spesialis ke Admin untuk penugasan sesuai kompetensi.
5. Otorisasi akses data yang minimum untuk apotek, laboratorium, caregiver, kurir.
6. Validasi wilayah, jadwal, tarif dan data RME melalui integrasi yang disepakati.
