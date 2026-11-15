# Panduan UI/UX MADISING

Acuan kerja: [PRD V1.4.2 §14](PRD_V1.4.2.md), [prototipe alur inti](reference/MADISING_UIUX_Core_V1.4.2.html) dan identitas visual V1.3.7. Dokumen ini merangkum acuan MADISING yang tersedia; apabila referensi khusus pemilik diterima, tinjau dan selaraskan sebelum mengubah implementasi.

## Identitas dan hierarki

Gunakan warna utama #123F3A, aksi #176B5B, latar #F7F8F5, permukaan #FFFFFF, tinta #172A27, teks sekunder #53635E dan garis #DCE4DF. Warna status mempunyai makna operasional; tampilkan label selain warna. Satu aksi utama per layar. Gunakan tipografi sistem, isi 15–16 px, label 13–14 px, judul 22–28 px, grid 4/8, margin 16–20 px, target sentuh minimum 48 px dan radius 12–16 px.

## Alur inti

Pasien: alamat, Pesan perawat, kebutuhan dan jadwal, konfirmasi, status pencarian, peta saat EN_ROUTE, ringkasan kunjungan. Perawat: ketersediaan, penawaran tugas, navigasi, pengkajian, diagnosis keperawatan, rencana, tindakan dan evaluasi. Dokter: antrean klinis dan detail kasus, diagnosis medis, instruksi, mandat, resep, tindak lanjut. Admin, apotek dan kurir memiliki alur tersendiri sesuai PRD; tidak menyalin dashboard satu sama lain.

## Kriteria penerimaan

Tidak ada gradien dekoratif, glassmorphism, emoji sebagai ikon, kartu berlapis tanpa fungsi, label promosi, statistik atau ETA fiktif. Gunakan foto berizin bila diperlukan. Semua aksi memiliki status nyata, loading, empty, error, akses ditolak dan offline sesuai konteks. Tidak menampilkan PHI di notifikasi. Prototipe memakai data sintetis dan tidak mengklaim layanan aktif. Uji viewport 360–430 px dan 1280–1440 px, Android/iOS, keyboard, screen reader, kontras WCAG 2.2 AA, fokus, clipping, overflow, serta interaksi dengan koneksi tidak stabil. Catat hasil review sebelum rilis. UI tidak menggantikan otorisasi server.
