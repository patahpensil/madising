# Development decisions — 15 November 2026

The following product and technical choices are approved for implementation, with Web First staging as the delivery target.

| ID | Decision | Scope and outstanding conditions |
|---|---|---|
| DEC-20261115-01 | NestJS / TypeScript API, Next.js web, PostgreSQL (PostGIS for spatial queries) | OPEN-13 resolved for stack selection; build, dependency review and migration evidence remain mandatory. Preserve Flutter for Android/iOS after web UAT. |
| DEC-20261115-02 | Cloudflare staging edge plus separate backend and private PostgreSQL staging | OPEN-09 hosting/data contracts, provider, region, domain and access policy remain open. Prefer Cloudflare Tunnel and Access for restricted staging with TLS and no clinical cache. No infrastructure purchase or public deployment is implied. |
| DEC-20261115-03 | Homecare payment after service completion | No collection during booking, assignment or treatment. Provide estimate and consent beforehand; issue final itemized bill only after service completion, then verify settlement. Payment failure does not reverse clinical care. OPEN-07 provider, collection entity, refund/exception policy and medicine billing remain open. |
| DEC-20261115-04 | Sequential offers | At most one active offer per booking, to an eligible nurse; decline, expiry or revocation precedes next offer. Recheck authorization, eligibility and capacity atomically. OPEN-20 timeout, distance, candidate ranking and location privacy remain open. |
| DEC-20261115-05 | Text messages, audio and video calls in first release | Clinical relationship, consent, access control, no recording by default, clinical documentation and safe fallback mandatory. OPEN-05 legal feasibility, approved provider and clinical SOP remain open. No clinical call until gates pass. |

Web staging uses synthetic data only. Six operational dashboards are unchanged; developer console remains separate. The decisions do not authorize real patient data, clinical procedures, medical orders, payments or third-party contracts.
