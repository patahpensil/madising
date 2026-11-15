# MADISING — Initial Architecture

## Approach

Rancangan awal berupa modular monolith: Flutter Android/iOS, web responsif, API modular, PostgreSQL/PostGIS, private clinical media storage serta adapter RME/SATUSEHAT/apotek/kurir. **Patah Pensil memutuskan OPEN-13** (NestJS + Next.js vs Node tanpa framework) berdasarkan uji teknis; belum ada keputusan stack final. Penyedia cloud, penempatan data, dan kontrak pemrosesan belum final; pilihan teknis Vendor harus mematuhi otorisasi pengendali data.

Baseline kode saat ini menggunakan **Node `.mjs` tanpa framework** untuk API healthcheck, policy otorisasi awal dan adapter lookup identitas PostgreSQL; frontend web masih statis dan Flutter masih skeleton. Verifikasi OIDC runtime, signup/undangan nyata, NestJS/Next.js, RME integration dan layanan produksi belum aktif. Baseline `.mjs` akan di-port atau dipertahankan **hanya setelah keputusan OPEN-13**; jangan menyatakan salah satunya sudah disahkan.

## Logical modules (planned)

- **Identity**: patient/courier signup and verification; Admin-provisioned clinical and pharmacy accounts; MFA for privileged users; RBAC + assignment-based ABAC on every request.
- **Care**: service requests, triage, location verification, dispatch (offers, expiry, atomic assignment), visit, doctor consultation, clinical directives, patient consent, nursing diagnosis/plan/evaluation.
- **Clinical Authority**: policy module dalam monolith untuk kewenangan per tindakan, consent, order/mandat, recheck saat eksekusi dan audit; delegasi nonaktif R1; tidak membuat keputusan medis.
- **Travel**: PostGIS shortlist, provider rute/ETA, scoped realtime EN_ROUTE via WebSocket/SSE atau transport setara, fallback; Redis hanya jika kebutuhan terbukti. OPEN-20 menetapkan privasi dan retensi lokasi.
- **Medication**: doctor-signed prescriptions, pharmacist review, pharmacy order, courier task, temperature constraints where applicable, proof of delivery.
- **Operations**: Admin/Owner, workforce credentialing, billing, reports and immutable audit events.
- **Vendor**: operational metrics, deployment, incident tooling and technical security without routine clinical-data access.
- **Interoperability**: `clinical_adapter` untuk RME existing; `satusehat_adapter` untuk mapping HL7 FHIR R4 bila jalur resmi/akses memungkinkannya; queue/outbox, idempotency, reconciliation dan audit metadata. Kedua jalur dievaluasi pada OPEN-04; tidak ada Production integration yang aktif.

## High-level request path

Flutter/Web → TLS/edge controls → authenticated API → policy checks → scoped domain module → PostgreSQL and private object storage. Third-party adapters exchange only the minimum required data. Event queues should retry idempotently; no clinical record should be silently dropped.

## SATUSEHAT R0 decision path

Pilihan A (preferensi bersyarat): gunakan RME existing yang mempunyai API/prosedur bridging sah dan sudah/akan diintegrasikan fasyankes. Pilihan B: Patah Pensil menguji integrasi langsung jika syarat registrasi sistem RME/partner dan wewenang fasyankes terpenuhi. Keduanya harus menggunakan identitas fasyankes yang benar dan konfigurasi Production yang sah; Vendor tidak otomatis memiliki Production API key. Patah Pensil menangani mapping FHIR, mock/Sandbox, vault dan contract tests tanpa PHI asli. Lihat [SATUSEHAT_INTEGRATION_PLAN.md](SATUSEHAT_INTEGRATION_PLAN.md).

## Data protection

Use a production-approved provider with verified data-processing contracts, encrypted storage and backups, least privilege, recovery testing, and documented retention policy. Never place PHI in public caches, CDN logs, CI output, screenshots, or demo data.

## Release safety

Branch PR → tests/review → staging sintetis → keputusan rilis teknis Patah Pensil melalui gerbang kontrol/audit → monitoring dan rollback. Kesiapan pelayanan klinis serta penggunaan data pasien tetap memerlukan otorisasi institusional yang sah. App Store/Play publication mengikuti persyaratan platform. No live deployment is configured in this baseline.
