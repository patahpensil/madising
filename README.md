# MADISING

**Secure integrated homecare platform** — developed and maintained by **Patah Pensil**.

Repository for the **Sidrap pilot**. The project aims for six segregated dashboards: Patient, Nurse, Doctor, Pharmacy, Courier, and Admin/Owner. **Three distinct parties**: MADISING Owner (doctor/clinical lead and data controller), one designated medical-personnel Admin for daily operations, and **Patah Pensil as code owner, developer and technical maintainer**. Patah Pensil leads architecture, APIs, technical security, CI/CD and SATUSEHAT integration; MADISING retains clinical and patient-data authorization. Clinical DOC identity for the Owner is separate from OWN/ADM; Vendor has no routine access to patient records.

## Status

**Foundation only (not production-ready).** No patient registration, medical records, prescription, dispatch or real authentication endpoints are active. Do not enter real patient data.

## Structure

- `apps/api` — current dependency-free Node.js .mjs foundation; legacy dependency-free baseline retained for regression tests.
- `apps/web` — static, nonclinical placeholder; historical static prototype.
- `apps/staging-api` — NestJS synthetic session API with PostgreSQL persistence.
- `apps/staging-web` — Next.js Web First trial.
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

The **proposed master PRD V1.4.3** is available at [docs/PRD_V1.4.3.md](docs/PRD_V1.4.3.md), restructured from the [V1.3.7 interactive prototype](docs/reference/MADISING_UIUX_Prototype_V1.3.7.html) and its [service catalogue addendum](docs/reference/MADISING_Addendum_Katalog_Layanan_V1.3.7.md). [Pratinjau alur inti V1.4.2](docs/reference/MADISING_UIUX_Core_V1.4.2.html) mencakup pemesanan perawat, peta perjalanan, asuhan dan konsultasi dokter dengan data sintetis. [V1.4.1](docs/PRD_V1.4.1.md) tetap sebagai histori. **Proposed master:** Patah Pensil owns technical decisions; OPEN-12 remains for changed historic governance and clinical/data obligations, not JSON or CI/CD approval. Until resolved, V1.3.6 legacy LOCK details remain traceable through §2.1/§21.1 and [docs/DECISIONS.md](docs/DECISIONS.md). See also the [SATUSEHAT integration plan](docs/SATUSEHAT_INTEGRATION_PLAN.md) and OPEN-04.

See [architecture](docs/ARCHITECTURE.md), [security](docs/SECURITY.md), and [roadmap](docs/ROADMAP.md).

## Isolated Web First trial

See [decisions](docs/DEVELOPMENT_DECISIONS_2026-11-15.md). Use a separate disposable PostgreSQL database and apply `infra/postgres/trial/001_sessions.sql` then `infra/postgres/trial/002_role_tokens.sql`. Install packages separately with `npm --prefix apps/staging-api install` and `npm --prefix apps/staging-web install`. Build each using `npm --prefix <app> run build`. Supply `TRIAL_DATABASE_URL` to the API, set `MADISING_TRIAL_ENABLED=1` for both processes, then run each package's start script. Open http://localhost:3000. The UI and API default to loopback; public hosting and clinical data are forbidden for this trial. Cloudflare Tunnel/Access staging is planned, not deployed. Set TRIAL_WEB_ORIGIN only to the actual approved web origin. Do not point the trial at a production database.


See [Web staging scope](docs/WEB_STAGING_SCOPE.md) for deferred interoperability, trial defaults and deployment boundaries.
