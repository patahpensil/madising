# MADISING — Initial Architecture

## Approach

A modular monolith is the intended target: Flutter on Android/iOS, web in Next.js, API in NestJS, PostgreSQL/PostGIS, private clinical media storage, and integration adapters for existing RME, pharmacy and courier. Specific cloud provider, capacity, and release contracts are **not yet approved**.

This commit provides only a dependency-free Node.js health service, static web foundation, Flutter starter, and CI. It does NOT implement NestJS/Next.js, identity, RME integration, or production data services.

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
