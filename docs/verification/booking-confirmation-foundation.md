# Booking confirmation evidence — verification

Date: 15 November 2026. Scope: standalone confirmation evidence checks (§4.2, §7.1, §7.2 and §8.1 in PRD V1.4.2). Synthetic records only.

| Check | Evidence |
|---|---|
| Synchronous JavaScript V8 scenario execution | 50/50 passed using the same function body and case data as the committed tests |
| Input immutability | 50/50 passed |
| Positive/negative/boundary cases | Verified representative, routine visit, direct doctor review, red flags, destination, active service, consent, slot, capacity and expiry |
| Missing parameters and spelling | Selected missing/mismatched identifiers and records tested; English names reviewed; no user-facing copy |
| Async, loops, resource leaks | Evaluator is synchronous; no I/O, timers, persistent state or unbounded loops. No load or heap profiling |
| Race, deadlock, TOCTOU | No transaction here; not established for the integration. Confirmation must use authoritative reads, reservation locks, revalidation, version checks, idempotency and audit in one database transaction |
| Node syntax and full test suite | Added to existing npm scripts; awaiting CI evidence |

The evaluator is not a live endpoint, triage algorithm, capacity allocator, geofence engine or patient-identity verifier. A trusted caller must verify self/representative authority; review and consent evidence; current credential/competency, slot and service validity; approved clinical release and official destination boundary. The clock must come from the server. Do not accept these fields from client JSON. Do not persist CONFIRMED on a positive return outside the atomic transaction. The model intentionally does not gate on payment while OPEN-07 is unresolved. OPEN-19/20 and other release gates remain in effect. Partial acceptance evidence only for PAT-04..06 and UAT-01,13..16; no end-to-end UAT is claimed.
