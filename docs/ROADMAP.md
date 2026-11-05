# MADISING — Implementation Order

- [x] Repository connection, private access and initial branch.
- [x] Foundation: web/static, API/health, Flutter skeleton, CI.
- [ ] Import reviewed master PRD V1.3.6 and existing interactive prototype without patient data.
- [ ] Design database schema, permissions matrix, audit-event schema and integration contracts.
- [ ] Establish test/staging environment, scoped credentials, backup/restore and environment ownership.
- [ ] Implement AuthN/AuthZ and six dashboard route guards using test accounts.
- [ ] Patient signup; courier signup/verification; Admin-created nurse/doctor/pharmacy users.
- [ ] Sidrap destination geofence + availability and qualified dispatch.
- [ ] Doctor consultation and nurse clinical documentation with consent and secure uploads.
- [ ] Existing RME integration, prescription/pharmacy verification and courier delivery.
- [ ] Billing, reporting, vendor maintenance console and emergency procedures.
- [ ] External security testing, clinical validation, load/recovery tests, privacy review.
- [ ] Store publication and manual go-live approval.

Each step requires explicit acceptance tests; never connect actual patient data to foundation placeholders.
