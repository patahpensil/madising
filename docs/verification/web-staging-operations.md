# Web staging operations verification

Code scope: role-bound trial bearer tokens, scoped projections, synthetic candidate ranking and offer expiry, synthetic travel points and refresh, consultation message/request states and full HTTP path. No production authorization or media connectivity. Existing API and clinical policy baseline retained unchanged.

Run `npm --prefix apps/staging-api test` with disposable PostgreSQL migrations 001/002, CI Next.js build, HTTP journey script and existing regressions. Test cases cover missing/invalid coordinates, competency, freshness, expiry, stale versions, cross-role access, trace of synthetic travel, consultation, post-service billing and concurrency inherited from the prior trial test. Results pending CI; no test pass is presumed.

Review: SQL row locks and version checks remain inside one transaction; separate per-role hash binding and expiry checked in SQL. Read projections omit consultation outside nurse/doctor roles and tracking outside travel. Polls are serialized through existing pending ref and cleaned up via effect cleanup; browser profiling, real multi-user load, deadlock stress, official geofence, actual GPS, secure identity provisioning, provider integration and visual/browser review are not established. No external media or clinical storage. Body allowlist and bounded messages/positions/session history remain. No RME calls.
