# MADISING — Addendum Katalog Layanan V1.3.7

**Tanggal:** 6 November 2026  
**Vendor:** Patah Pensil  
**Wilayah pilot:** Kabupaten Sidenreng Rappang (Sidrap)  
**Status:** Penambahan katalog layanan berdasarkan instruksi Pemilik; belum merupakan konfirmasi operasional atau izin seluruh layanan.

## Perubahan

Menambahkan **9 kategori** dalam dashboard Pasien pada prototipe V1.3.6. UI/UX utama, enam dashboard, model rekrutmen akun tertutup untuk tenaga medis, pemisahan Vendor/Admin, dan SIDRAP-LOCK **tetap**.

| ID | Kategori layanan | Contoh cakupan | Pelaksana sesuai kewenangan | Simulasi pemesanan |
|---|---|---|---|---|
| doctor | Layanan Medis & Kunjungan Dokter | Pemeriksaan, evaluasi, pemantauan | Dokter terverifikasi | Tinjauan Admin, tidak otomatis ke perawat |
| special_nursing | Tindakan Keperawatan Khusus | Infus, kateter, NGT, injeksi bila diindikasikan | Perawat kompeten dan instruksi klinis sah | Alur demo perawat |
| wound | Perawatan Luka | Luka diabetes, luka tekan, pascaoperasi | Tenaga perawatan luka kompeten | Alur demo perawat |
| physio | Fisioterapi & Rehabilitasi | Pemulihan fungsi dan mobilitas | Fisioterapis berizin/kompeten | Tinjauan Admin, tidak otomatis ke perawat |
| therapy | Terapi Tambahan | Wicara, okupasi, menelan | Terapis sesuai kewenangan | Tinjauan Admin |
| postop | Perawatan Pascaoperasi | Tindak lanjut kondisi pasien sesuai rencana pulang | Perawat + dokter sesuai indikasi | Alur demo perawat |
| elderly | Perawatan Lansia & Pramurukti | Pendampingan harian, mobilitas, nutrisi, monitoring | Pramurukti/caregiver atau perawat menurut jenis tindakan | Tinjauan Admin dan pemilahan tugas |
| mother_baby | Perawatan Ibu & Bayi | Perawatan bayi baru lahir, edukasi, laktasi | Bidan/tenaga kesehatan berwenang | Tinjauan Admin |
| lab | Pemeriksaan Laboratorium | Pengambilan spesimen di rumah | Tenaga kompeten dan mitra laboratorium resmi | Tinjauan Admin |

## Kontrol operasional dan keselamatan

1. Tidak semua layanan dapat ditugaskan otomatis kepada perawat. Kategori dokter, fisioterapi, terapi tambahan, lansia/pramurukti, ibu-bayi, dan laboratorium membutuhkan peninjauan Admin untuk memastikan profesi serta kompetensi.
2. Tindakan keperawatan yang mensyaratkan instruksi dokter tidak boleh dilakukan sebelum instruksi sah, penilaian indikasi, informed consent, dan pemeriksaan kelayakan.
3. Status katalog tidak sama dengan ketersediaan tenaga atau layanan aktif. Produksi wajib memiliki pengaturan status `draft`, `verified`, `active`, `suspended` serta pemeriksaan wilayah, jadwal, dan kredensial secara server-side.
4. RME yang sudah ada tetap menjadi sistem catatan klinis resmi sesuai rancangan integrasi yang disetujui. Data klinis, sampel laboratorium, dan rincian terapi khusus tidak boleh dikirim ke kurir kecuali informasi logistik yang diperlukan.
5. Tanda bahaya kegawatdaruratan tidak ditangani melalui booking rutin; perlu arahan akses pertolongan darurat.
6. Pelayanan fisioterapi, terapi tambahan, kebidanan, laboratorium, dan pramurukti membutuhkan verifikasi ketersediaan tenaga/mitra dan prosedur pengelolaan layanan sebelum diaktifkan.
7. Cakupan tindakan, harga, frekuensi layanan, serta tanggung jawab profesi ditentukan melalui SOP dan evaluasi klinis, bukan semata deskripsi katalog.

## Implementasi prototipe

- Sembilan kartu layanan pada dashboard Pasien, responsif untuk desktop/HP.
- Pemilihan kartu menampilkan penjelasan, petugas, jenis pelayanan, serta persyaratan.
- Booking contoh untuk layanan yang memerlukan profesi khusus diterima sebagai **permintaan review**; tidak ada auto-dispatch perawat.
- Alur demo existing untuk layanan keperawatan tetap tersedia.
- Tidak menambahkan dashboard ketujuh; manajemen kemitraan dan layanan spesialis melalui otorisasi Admin serta integrasi saat implementasi nyata.

## Yang belum termasuk

Pengaktifan tenaga profesional/mitra, harga layanan, perjanjian laboratorium, implementasi backend, persetujuan legal-klinis, autentikasi produksi, dan audit keamanan. Prototipe V1.3.7 bukan aplikasi medis siap pakai.