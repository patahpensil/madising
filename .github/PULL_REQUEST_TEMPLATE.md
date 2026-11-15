## Perubahan
<!-- Ringkas dampak aplikasi, berkas dan milestone PRD. -->

## Klasifikasi
- [ ] Perubahan teknis nonklinis
- [ ] Perubahan perilaku layanan/klinis
- [ ] Perubahan pemrosesan data/privasi atau tata kelola
- [ ] Perubahan infrastruktur/deployment

## Pemeriksaan wajib
- [ ] CI seluruh job terkait lulus pada SHA terakhir.
- [ ] Tidak ada kredensial, OTP, NIK, PHI, ekspor pasien maupun data medis nyata.
- [ ] Otorisasi server-side dan pengujian akses negatif diperbarui bila ada perubahan hak.
- [ ] Perubahan migrasi database disertai pengujian constraint dan jalur rollback/restore.
- [ ] Referensi PRD/keputusan LOCK dan dokumentasi diperbarui bila berlaku.
- [ ] Dampak terhadap keamanan, migrasi, dan kompatibilitas ditulis di bawah.
- [ ] Tidak ada deployment produksi otomatis dari PR atau feature branch.

## Persetujuan / gerbang
- [ ] Review teknis Patah Pensil.
- [ ] Review Owner/PJ Klinis bila mengubah SOP, layanan, keputusan klinis, atau LOCK historis.
- [ ] Otorisasi pengendali data yang sah bila memengaruhi PHI atau tujuan pemrosesan.
- [ ] Untuk rilis: UAT, rollback, backup/restore dan environment approval sesuai dokumen governance.

**Risiko dan cara mitigasi:**

**Cara menguji (data sintetis):**

**Bukti CI/UAT:**
