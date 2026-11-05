# MADISING — Initial Architecture

## Approach

Rancangan awal berupa modular monolith: Flutter Android/iOS, web responsif, API modular, PostgreSQL/PostGIS, private clinical media storage dan adapter RME/apotek/kurir. **Pemilihan NestJS + Next.js versus mempertahankan Node tanpa framework masih OPEN-13**, belum diputuskan. Penyedia cloud, kapasitas, serta kontrak rilis juga belum disetujui.

Baseline kode saat ini menggunakan **Node `.mjs` tanpa framework** untuk API healthcheck, policy otorisasi awal dan adapter lookup identitas PostgreSQL; frontend web masih statis dan Flutter masih skeleton. Verifikasi OIDC runtime, signup/undangan nyata, NestJS/Next.js, RME integration dan layanan produksi belum aktif. Baseline `.mjs` akan di-port atau dipertahankan **hanya setelah keputusan OPEN-13**; jangan menyatakan salah satunya sudah disahkan.

## Logical modules (planned)

- **Identity**: patient/courier signup and verification; Admin-provisioned clinical and pharmacy accounts; MFA for privileged users; RBAC + assignment-based ABAC on every request.
- **Care**: service requests, triage, location verification, dispatch, visit, doctor consultation, clinical directives, patient consent, nurse documentation.
- **Medication**: doctor-signed prescriptions, pharmacist review, pharmacy order, courier task, temperature constraints where applicable, proof of delivery.
- **Operations**: Admin/Owner, workforce credentialing, billing, reports and immutable audit events.
- **Vendor**: operational metrics and incident tooling without routine clinical-data access.

## High-level request path

Flutter/Web → TLS/edge controls → authenticated API → policy checks → scoped domain module → PostgreSQL and private object storage. Third-party adapters exchange only the minimum required data. Event queues should retry idempotently; no clinical record should be silently dropped.

## Data protection

Use a production-approved provider with verified data-processing contracts, encrypted storage and backups, least privilege, recovery testing, and documented retention policy. Never place PHI in public caches, CDN logs, CI output, screenshots, or demo data.

## Release safety

Branch PR → tests/review → staging with synthetic data → approved production release → monitoring and rollback. App Store/Play publication must be separately approved. No live deployment is configured in this baseline.
