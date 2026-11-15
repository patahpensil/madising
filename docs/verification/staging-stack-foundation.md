# Staging stack verification

Scope: isolated synthetic NestJS/Next.js and PostgreSQL session integration. No production API is replaced. The existing prototype remains available separately.

- Added test cases for post-service invoice, duplicate settlement, sequential offers, stale version, concurrent same-session actions and cross-session bearer isolation. CI installs and builds both frameworks, applies the trial migration, runs the unit/concurrency suite and exercises the HTTP boundary.
- PostgreSQL locks one session row for action validation and write. The version and expiry are rechecked immediately before update; stale actions return conflict without a second write. Pool size, connection/query/lock timeouts, session lifetime, bounded state history and session cap constrain resource usage. Rollback and connection release are in finally paths. Actual database contention, deadlock and resource behavior require the CI execution; no heap profiling or independent penetration test is claimed.
- The API and web bind loopback; the synthetic route is disabled unless explicitly enabled. Session role chooser is a test harness, not RBAC. Bearer token is generated server-side, hashed at rest, kept in browser memory; no real data inputs.
- No dependency lock files yet: package registry unavailable in the development runtime. Direct framework versions selected; CI must resolve and check dependency trees. Lock files, audit and repeatable dependency install are mandatory before shared staging deployment. No external deployment, DNS change, clinical media provider, payment provider, real dispatch matching or real RME connections are performed.
- Browser rendering and device accessibility tests remain pending. No evidence claim until CI result is retrieved.
