# MADISING

**Secure integrated homecare platform** — developed and maintained by **Patah Pensil**.

Private repository for the **Sidrap pilot**. The project aims for six segregated dashboards: Patient, Nurse, Doctor, Pharmacy, Courier, and Admin/Owner. **Three distinct parties**: MADISING Owner (doctor/clinical lead and data controller), one designated medical-personnel Admin for daily operations, and **Patah Pensil as code owner, developer and technical maintainer**. Patah Pensil leads architecture, APIs, technical security, CI/CD and SATUSEHAT integration; MADISING retains clinical and patient-data authorization. Clinical DOC identity for the Owner is separate from OWN/ADM; Vendor has no routine access to patient records.

## Status

**Foundation only (not production-ready).** No patient registration, medical records, prescription, dispatch or real authentication endpoints are active. Do not enter real patient data.

## Structure

- `apps/api` — current dependency-free Node.js .mjs foundation; future NestJS vs Node decision belongs to Patah Pensil (OPEN-13).
- `apps/web` — static, nonclinical placeholder; framework decision remains OPEN-13.
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

The **proposed master PRD V1.4.1** is available at [docs/PRD_V1.4.1.md](docs/PRD_V1.4.1.md), restructured from the [V1.3.7 interactive prototype](docs/reference/MADISING_UIUX_Prototype_V1.3.7.html) and its [service catalogue addendum](docs/reference/MADISING_Addendum_Katalog_Layanan_V1.3.7.md). **Proposed master:** Patah Pensil owns technical decisions; OPEN-12 remains for changed historic governance and clinical/data obligations, not JSON or CI/CD approval. Until resolved, V1.3.6 legacy LOCK details remain traceable through §2.1/§21.1 and [docs/DECISIONS.md](docs/DECISIONS.md). See also the [SATUSEHAT integration plan](docs/SATUSEHAT_INTEGRATION_PLAN.md) and OPEN-04.

See [architecture](docs/ARCHITECTURE.md), [security](docs/SECURITY.md), and [roadmap](docs/ROADMAP.md).
