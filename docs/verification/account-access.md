# Verification — account access (16 November 2026)

Environment: Linux container, Node 22.23.4, PostgreSQL 16 (disposable local cluster), Chromium via Playwright with a CDP virtual authenticator (CTAP2, internal, user verification). Synthetic data only.

| Command | Result |
|---|---|
| `psql -f infra/postgres/trial/004_access.sql` (twice, after 001–003) | Applied; second run idempotent |
| `npm --prefix apps/staging-api test` | 34 passed, 0 failed (11 new in `access.test.mjs`) |
| `npm --prefix apps/staging-api run build`, `npm --prefix apps/staging-web run build` | Passed |
| `node apps/staging-web/test/access-flow.mjs` (origin http://localhost:3000) | Passed: invalid number, OTP wrong/right, countdown, passkey offer and enrolment, four-step guide, no repeat, empty care team, settings items, notification persistence, guide replay, logout, passkey login, cross-origin 403, anonymous 401 |
| `http-flow`, `browser-flow`, `preview-flow`, `account-flow` (origin http://127.0.0.1:3000) | Passed (account-flow updated for the staff login link, guide and settings logout) |

Reviewed: concurrency (OTP consumption, duplicate reviews, passkey challenge single use), TOCTOU (identity and exercise rechecked in the write transaction), resource cleanup (timers cleared on unmount, expired WebAuthn challenges deleted, bounded outstanding challenges), invalid inputs and boundaries (number length, code length, rating range, tag set, body size). Defect found and fixed during testing: PostgreSQL rejects regex repetition above 255, so credential ID length is checked separately. OTP inputs no longer use `maxLength`, which truncated pasted and autofilled codes.

Not run: physical Android/iOS authenticators, screen reader pass, penetration test, distributed load. Screenshots from the browser run are uploaded by CI as `access-flow-screenshots`.
