# Security Baseline — MADISING

**Target:** independent validation against OWASP ASVS Level 3 (web/API) and an appropriate OWASP mobile standard. Current foundation has **not** been audited and must not be used with real patient data.

## Mandatory before patient-facing go-live

1. Server-side RBAC plus resource/assignment-aware ABAC; deny by default and audit all sensitive actions.
2. MFA for admins, doctors and privileged vendor accounts; phishing-resistant methods where feasible.
3. Secrets managed outside Git; short-lived credentials for CI/CD and vendor production access.
4. Database private network, separate encrypted backup, verified restore and documented RPO/RTO.
5. Private clinical uploads: allowlisted content types, size limits, malware processing, content inspection, signed URLs, consent and retention tracking.
6. No sensitive patient data in analytics, CI/CD logs, third-party crash reports, public storage or staging.
7. Independent security review and penetration testing (including IDOR/BOLA, uploads, geofence bypass, role isolation, abuse/rate-limits).
8. Incident runbooks, access revocation and software supply-chain monitoring.
9. Clinical safety acceptance: only qualified staff assigned; doctor decisions appropriately signed; prescriptions verified by pharmacist.
10. Owner-approved production deployment, executed by Vendor; Vendor cannot self-approve; Admin does not approve deployments. No automatic production push from arbitrary branch.

## Current limitations

The Node.js health endpoint is for development only, binds to localhost, and provides **no** clinical features. The Flutter screen and web page are nonfunctional placeholders. GitHub CI checks code health, **not** regulatory compliance or ASVS Level 3 certification. GitHub branch protection must be enabled separately in repository settings, if available on the account plan.
