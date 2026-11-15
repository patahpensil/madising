# Account access, onboarding, passkeys, settings and professional profiles

Scope: restricted synthetic staging only (Next.js `/account` → NestJS `/account/*` → PostgreSQL `madising_trial`). No production activation, real patient data, RME/SATUSEHAT, payment or messaging provider is enabled. Requirements: [PRD V1.4.3 addendum](PRD_V1.4.3.md#addendum-v143--akses-akun-panduan-passkey-pengaturan-dan-profil-profesional-16-november-2026).

## Components

| Layer | File | Responsibility |
|---|---|---|
| Schema | `infra/postgres/trial/004_access.sql` | Phone HMAC on accounts, OTP challenges, passkeys, WebAuthn challenges, preferences, care reviews. Idempotent; CI applies it twice. |
| API | `apps/staging-api/src/access-store.mjs` | OTP issue/verify, sessions, preferences, WebAuthn ceremonies, care team, reviews. Every write rechecks identity and state inside one transaction. |
| API | `apps/staging-api/src/staff-profiles.mjs` | Synthetic professional fixtures (no photo, no STR, `SYNTHETIC_UNVERIFIED`). |
| API | `apps/staging-api/src/main.ts` | `POST /account/otp/request`, `/otp/verify`, `/preferences`, `/passkeys/register/{options,verify}`, `/passkeys/authenticate/{options,verify}`, `/passkeys`, `/care-team`, `/reviews`. |
| Web | `apps/staging-web/app/account-api/route.js` | Same-origin JSON proxy, 8 KiB limit, session token only in HttpOnly SameSite=Strict cookie. |
| Web | `apps/staging-web/app/account/access.jsx`, `page.jsx` | WhatsApp/OTP screens, passkey offer, spotlight guide, settings, care team and review form. |

## Configuration

| Variable | Where | Notes |
|---|---|---|
| `OTP_PEPPER` | API | ≥32 characters, protected environment only. The API refuses to start account mode without it. Rotating it invalidates phone lookups. |
| `WHATSAPP_OTP_PROVIDER` | API | Only `fixture` exists and works only with `MADISING_FIXTURE_HARNESS=1` (isolated CI/local). Any other value means no sender: OTP requests return 503. A real provider requires OPEN-21. |
| `WEBAUTHN_RP_ID`, `TRIAL_WEB_ORIGIN` | API (+ web for origin) | RP ID must be the registrable domain of the exact HTTPS origin. IP addresses are not valid RP IDs. |

## Security decisions

- **Phone numbers:** normalized to E.164 (Indonesian mobile, 10–13 digits with leading 0), stored as HMAC-SHA256 with the pepper plus last four digits for display. Only `PAT`/`CUR` rows may hold a phone (database constraint).
- **OTP:** `crypto.randomInt`, HMAC bound to the phone, 300 s TTL, 5 attempts then burnt, 60 s resend cooldown, 5 sends per number per hour (advisory lock per number), previous codes invalidated on reissue. Verification locks the challenge row, so concurrent correct submissions consume it once. Worst case per number: 25 guesses per hour against 10⁶ codes.
- **Enumeration:** request responses have identical shape for registered and unknown numbers. Fixture codes are returned only by the isolated harness.
- **Abuse limits not covered here:** per-IP and distributed rate limits, CAPTCHA/risk scoring and provider-side fraud controls belong to the gateway and provider (OPEN-21). The single-process cap is not distributed protection.
- **Passkeys:** `@simplewebauthn/server` 13.3.3 / `@simplewebauthn/browser` 13.3.0; resident key and user verification required; attestation `none`; challenges stored server-side, single use (deleted before verification), 5 min (registration) / 2 min (authentication); at most 500 outstanding authentication challenges; counter regression rejected; only credential ID, public key, counter and transports stored. Account state and exercise validity are rechecked before a session is issued.
- **Sessions:** unchanged from restricted account staging — 256-bit opaque token hashed at rest, 30 min idle, 2 h maximum, one session per account.
- **Reviews:** patient-only, completed visit only, involved professional only, one per professional per visit (unique constraint), fixed tags instead of free text so public reviews cannot carry health details. No seeded ratings.
- **Profile visibility:** nurse after assignment (`ASSIGNED` onward), doctor once an order exists; computed from locked server state, never from the browser.

## Traceability

| Requirement | Implementation | Verification |
|---|---|---|
| ACC-WA-01 | `normalizeWhatsAppNumber`, `phone_hmac`, `accounts_phone_self_service_roles` | `access.test.mjs` normalization; browser invalid-number check |
| ACC-WA-02 | `requestOtp`, `verifyOtp`, `OTP_POLICY` | wrong/expired/burnt code, cooldown, hourly cap, concurrent consumption tests; browser wrong-code and countdown |
| ACC-WA-03 | uniform 202, `createOtpSender` | enumeration-shape test; 503 without sender |
| ACC-WA-04 | `SELF_SERVICE_ROLES`, PENDING courier | role restriction and pending courier tests |
| ACC-ONB-01 | `Tour`, `account_preferences.onboarding_completed_at` | browser: four steps, last step only Selesai, no repeat after reload, replay from settings, Escape closes |
| ACC-PK-01 | passkey methods in `AccessStore` | forged response, challenge replay, unconfigured RP tests; browser virtual authenticator enrol + login |
| ACC-PK-02 | `PasskeyOffer`, settings passkey list/remove | browser offer and list |
| ACC-SET-01 | `Settings` | browser: all items present, notification preference persists |
| ACC-PRO-01/03 | `careTeam`, `staff-profiles.mjs` | empty before assignment, nurse after, non-patient denied, no STR/photo |
| ACC-PRO-02 | `review`, `care_reviews` | not-completed, out-of-range, unknown tag, uninvolved doctor, concurrent duplicate tests |

## Outstanding

OPEN-21 (WhatsApp provider), OPEN-22 (profile publication consent, photos, STR display), OPEN-23 (English UI). Penetration testing, gateway rate limiting, dependency lockfiles and device testing on physical Android/iOS authenticators remain open. The public static preview on Cloudflare is not part of this flow.
