# MADISING

**Secure integrated homecare platform** — developed and maintained by **Patah Pensil**.

Private repository for the **Sidrap pilot**. The project aims for six segregated dashboards: Patient, Nurse, Doctor, Pharmacy, Courier, and Admin/Owner. Vendor maintenance is separate from operational/clinical access.

## Status

**Foundation only (not production-ready).** No patient registration, medical records, prescription, dispatch or real authentication endpoints are active. Do not enter real patient data.

## Structure

- `apps/api` — dependency-free Node.js health endpoint and tests (temporary foundation; planned backend is NestJS).
- `apps/web` — initial static, nonclinical frontend placeholder (planned framework: Next.js).
- `apps/mobile` — Flutter application skeleton for Android/iOS.
- `docs` — architecture, security controls, governance decisions and delivery roadmap.
- `.github/workflows` — CI checks for Node, Flutter, and policy documentation.

## Local development

Node.js 22+:

```sh
npm test
npm run api
```

API checks at `http://localhost:3001/healthz`. For the Flutter skeleton, install Flutter SDK and run `cd apps/mobile && flutter pub get && flutter test && flutter run`.

## Git workflow

Feature branch → pull request → automated checks → review → approved merge. Deployment to production is **not** enabled. Staging and production credentials must be provisioned later with scoped access.

## Product specification

The current approved specification is **MADISING PRD V1.3.6** (ACCOUNT-LOCK, STAFF-LOCK, SIDRAP-LOCK, GOVERNANCE-LOCK). See [docs/DECISIONS.md](docs/DECISIONS.md). The signed master PRD should be brought into this repository without changing its locked requirements.

See [architecture](docs/ARCHITECTURE.md), [security](docs/SECURITY.md), and [roadmap](docs/ROADMAP.md).
