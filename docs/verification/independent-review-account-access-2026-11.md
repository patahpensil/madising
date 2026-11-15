# Independent review — account access (2026-11-16)

## Scope and environment

Baseline main e4bdc3a3c0f51400e73f892d0a19cf74f5b39a67; PRs 14, 17 and 18. Reviewed AGENTS.md, ACCOUNT_ACCESS.md, STAGING_ACCOUNT_AUTH.md, WEB_STAGING_SCOPE.md, verification/account-access.md, PRD addendum ACC-WA/ONB/PK/SET/PRO and UAT-48–55, OPEN-21–23, CI. Local environment attempted: node -v (v22.16.0), npm -v (10.9.2), command -v psql (not installed), chromium installed, git ls-remote (DNS failure). No local PostgreSQL/installation/build/browser run claimed. GitHub Actions is the available disposable PostgreSQL 16 runner. Prior baseline Actions run 43748520236 is green (existing evidence, not independent execution). Independent tests committed before remediation at fa7004066dd4bfef5091e3ea6e0348bd9d9d628c. New CI uses npm ci, production-only audit, fresh masked random OTP pepper, existing tests and additional independent tests. No real provider or data; fixture numbers never contacted.

## Findings and before/after evidence

| ID | Severity | Location (baseline) | Reproduction and expected result | Status |
|---|---|---|---|---|
| IAA-01 | High | access-store.mjs requestOtp, early eligibility return | Exact source in deterministic SQL stub: LOGIN for active and unknown, first both 202; second active 429, unknown 202. Expected same rate window independent of registration. | Fixed code: consumed decoy accounting for ineligible request; no delivery, same rate accounting. Regression test added; CI pending. Actual timing resistance remains unproven; future provider delivery timing must be reviewed. |
| IAA-02 | High | apps/api/src/authz.mjs authorizeAction | Exact function with PAT actor missing id and empty booking scope returned true. Expected false. | Fixed validation of nonblank string ID; negative regression test. |
| IAA-03 | High | main.ts otpVerify, account-api/route.js issuesSession | Source inspection: Nest fixed 200 for successful verify even when service returns code 202 pending; proxy requires token on 200 and returns 503. | Fixed HTTP status propagation; independent direct HTTP test. |
| IAA-04 | High | trial-store.mjs act, account page polling | READ unconditionally refreshes idle expiry, automatic poll 10 s; absent interaction fails 30-min idle policy. | Fixed READ not renewing; new database assertion. |
| IAA-05 | High | access-store.mjs identity | Active session lookup locks account only, ignores rowcount of session update and exercise validity. With logout/expiry or expired exercise could authorize a later operation. | Lock/recheck live exercise and live session update; expired-exercise regression added. Actual concurrent logout race test not yet executed. |
| IAA-06 | Medium | access-store.mjs requestOtp/verifyOtp | Issuance and consumption previously used different locks. | Same per-number advisory lock added; independent 10-way verification and parallel issuance tests. |
| IAA-07 | Medium | access-store.mjs OTP tables | No global per-IP distributed limits; decoy entries increase storage; pending accounts and challenges retention not bounded globally. | OPEN-21 and lifecycle design; no production activation. |
| IAA-08 | Medium | access.jsx Tour/PasskeyOffer/Settings, page.jsx | Dialogs lack full focus trap; completion/dismissal may swallow write errors; initial reload does not automatically resume unfinished tour. | Reported; keyboard, screen-reader and WCAG full review pending. |
| IAA-09 | Medium | 004_access.sql / careTeam | SQL allows some structural combinations (e.g. phone HMAC without last4, duplicate tags); review eligibility enforced at app layer, doctor REQUESTED counts as involvement; review history deleted with disposable exercise. | Review data constraints and clinical policy before operational use. |
| IAA-10 | Medium | main.ts legacy account/register; account-store | Legacy password self-registration remains available in synthetic account mode; pending, not an active account. | Legacy fixture compatibility retained; production staff provisioning is separate and unresolved. |

## Test ledger

| ID | Scenario | Expected | Outcome/evidence |
|---|---|---|---|
| A1 | 001–004, repeat 004, npm ci, build | success | CI configured; pending exact run |
| A2 | root syntax/tests, API tests, HTTP/browser/preview/account/access flows | success | Existing baseline green; independent rerun requested via PR CI |
| WA-01 | input length 9/10/13/14, prefixes, foreign/landline, separators, non-string, malformed code | only valid mobile/codes | new independent unit matrix |
| WA-02 | parallel issuance and 10 concurrent verifies | 202/429 and exactly one success | new independent DB test |
| WA-03 | cooldown/hourly limits, active/unknown body and response time | equivalent limits and responses | baseline reproduced in SQL stub; independent DB descriptive timing sample pending, not a statistical guarantee |
| WA-04 | wrong code, burn, expiry, 6th code | deny | existing tests rerun, no new independent proof for all cases |
| WA-05 | direct API staff signup, pending courier, body >8KiB | 400/202/413; no cookie | independent HTTP test pending |
| PK-01 | enroll/login with CDP virtual authenticator; forged/replay | allow valid / deny invalid | existing access-flow and access.test rerun; new cross-account/origin/RP/UV/counter/sixth/revoked tests NOT RUN |
| S-01 | local HttpOnly Strict, anon/cross-origin | valid flags/401/403 | existing browser rerun + independent HTTP; actual HTTPS __Host- test NOT RUN |
| S-02 | automatic read doesn't renew idle; expired exercise denied | deny | independent DB test pending |
| PRO-01 | visibility, rating and duplicate review | correct state/1 review | existing tests rerun; new role matrix and doctor involvement boundary NOT RUN |
| UI-01 | settings, tour and preference persistence | correct behavior | existing browser rerun; independent 5 viewport home screenshots pending |
| UI-02 | contrast/focus/tooltip/physical screen-reader | WCAG 2.2 AA | partial source inspection, no comprehensive audit |
| DB-01 | inspect actual HMAC and selected constraints | no raw data, invalid denied | independent DB test added, pending; not exhaustive constraint coverage |

## Cloudflare

Account 5e93a00997dc82771add36c9e1c91e74 owns existing madising worker. Historical build 631ebd07 failed: "Could not detect a directory containing static files (e.g. html, css and js) for the project". Actual current baseline check is SUCCESS, build 94d8fe4b-6a20-40ba-ac67-4574155e6f5c, version 97f1ca46-0b7f-4f27-b03b-d511abc1c915, commit e4bdc3a, root /, no build command, deploy npx wrangler@4.162.0 deploy --assets ./apps/web/trial --name madising --compatibility-date 2026-11-15. The stated universal failure is no longer current. Add root wrangler.jsonc and static _headers to make the source configuration explicit; keep working trigger until review. No integrated stack, no new resource. Public URL only synthetic preview. Actual external UI/header verification and final deployment pending.

## Release decision

No-go for real data and real account staging. OPEN-21/22/23, physical device, penetration testing, distributed rate limiting, full live account hosting with private DB and protected origin remain open. VPS purchase deferred. Future options: VPS + Tunnel with separate private database in Indonesian region; or paid Cloudflare Containers + Hyperdrive with private managed PostgreSQL, verify location controls and processor terms (global edge does not establish Indonesian data residency). Prices must be verified by owner before procurement. No purchase authorized. No RME/SATUSEHAT or actual billing/provider enabled.

The initial test run and fixed run must be checked before merge. The exact baseline source/stub tests are independent, not a full real DB or browser verification.

## Subsequent CI evidence

Baseline red run 43748980755: Foundation API 114 pass/1 fail (missing identifier); staging 37 pass/2 fail (active vs unknown throttle, READ renews idle), zero skips. After remediation run 43749065125: 39/39 staging tests, foundation job pass, migrations and npm ci/build pass, both production npm audits reported zero known vulnerabilities. Existing HTTP/browser/preview/account and CDP access-flow passed. Independent HTTP pending courier 202, forbidden staff roles, payload >8 KiB and cookie assertions passed before the new viewport check failed at 360 px. The job is RED (5/6); no merge. Fix narrow intrinsic grid sizing without suppressing overflow. A new source review found fallback NURSE_C missing from PROFILE_KEYS and a consultation request incorrectly counted as a created doctor order (UAT-54); add fixture and distinguish signed orders. Initial restore now checks unfinished onboarding. Expanded independent DB tests and CDP ceremonies are queued for a subsequent CI run; proof pending.

## Hosting cost references (no purchase)

- Two VPS Biznet GIO Indonesia: NEO Lite MM 8.4 Rp269,000/month + MS 4.2 Rp139,000/month = Rp408,000/month before tax, snapshots, provider changes or backup storage. Source https://www.biznetgio.com/pricelist. Confirm Indonesian application and database region, private network and TLS; self-managed database patching and recovery remain risks.
- Cloudflare Containers requires Workers Paid USD 5/month plus metered container CPU/memory/disk above included usage, Workers/Durable Objects and egress. Hyperdrive is included on Paid, external database is not; example IDCloudHost 2 CPU/4 GB/60 GB Rp720,000/month, private connectivity/region must be confirmed. Sources https://developers.cloudflare.com/containers/pricing/ , https://developers.cloudflare.com/hyperdrive/platform/pricing/ , https://idcloudhost.com/managed-postgreesql/ . Regional placement APAC is not Indonesia-only data residency (https://developers.cloudflare.com/containers/concepts/placement/); validate actual placement, processor agreements and origin/DB path; no clinical data approved. Option A remains preferable for explicit local hosting control. No paid resource created.
