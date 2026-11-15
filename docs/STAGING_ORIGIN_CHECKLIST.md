# Staging origin checklist

The Git-connected Cloudflare Worker named madising publishes apps/web/trial only. It is public and synthetic. Keep its current deployment unchanged while provisioning the account staging origin.

## Required environment

- A maintained Linux origin running Node.js 22 or newer, with Next.js and NestJS on loopback ports 3000 and 3001; separate disposable private PostgreSQL 16 instance.
- A dedicated staging hostname and Cloudflare Access enabled with explicit authorized tester identities; a Cloudflare Tunnel connector on the origin. Deny all other identities. No inbound public origin or database ports.
- Database credentials from a protected secret store; migrations under a separate migration identity. Runtime database identity limited to the synthetic schema. No production connection strings or data.
- Build from a reviewed commit, after locking and auditing dependency trees. Apply 001_sessions, 002_role_tokens and 003_accounts in order. Start the backend with MADISING_TRIAL_ENABLED=1, MADISING_ACCOUNT_TRIAL=1 and TRIAL_DATABASE_URL. Start the web origin with MADISING_ACCOUNT_TRIAL=1 and TRIAL_WEB_ORIGIN matching the HTTPS staging hostname. Do not set MADISING_FIXTURE_HARNESS on shared staging.
- Configure origin services to restart on failure, run as unprivileged users, restrict filesystem permissions and pass secrets outside the repository. Use Cloudflare Tunnel to route only the Next.js origin, not the database or NestJS.
- Before inviting testers: check unauthenticated denial at Access; ensure HTTPS HttpOnly Secure cookies; confirm root redirects to account login; verify readiness on loopback, role isolation and cross-device exercise with synthetic accounts. Check logs for secrets. Disable caching on account routes. Restrict request rates at the edge; no clinical use.

## Current blockers

The account Patah Pensil Simulasi supports the static Worker. Access API reports that Access is not enabled. The managed madising-staging tunnel was subsequently created and remains inactive without a connector or ingress route. The Containers API reports Workers Paid is required; no purchase made. A separate backend origin and database connection have not been provisioned. The public preview deployment does not satisfy this checklist. No production activation or RME/SATUSEHAT integration.


Procurement hold: VPS and database rental deferred by project direction. Retain option A architecture without provisioning infrastructure. Existing public static preview and disposable CI are the only authorized testing paths; shared account staging remains unavailable. See STAGING_VPS_RUNBOOK.md.
