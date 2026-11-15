# VPS staging origin — approved architecture

Project direction: VPS staging + Cloudflare Tunnel, retaining NestJS, Next.js and separate PostgreSQL. Public preview remains on its existing Worker. Scope is synthetic, restricted web UAT only; RME/SATUSEHAT remain deferred.

## Provider purchasing specification

Suggested pilot size, not a measured capacity target or quote: Linux LTS origin in Indonesia, 2 vCPU / 4 GB RAM / 40–60 GB SSD for serving the prebuilt trial; use 4 vCPU / 8 GB if building both Node applications on the same origin. Prefer a separate private managed PostgreSQL 16 instance (2 vCPU / 4 GB or equivalent starter plan, 20–40 GB storage) on the same region/private network. Monitoring, patching, backups and restore testing must be included. No purchase authorization, provider, contract or hostname has been supplied.

## Network and identities

Origin receives no public application ports. SSH administration via restricted trusted source or private management network, key authentication, disable password/root SSH after confirming alternate access. Application listeners remain 127.0.0.1:3000 and :3001. PostgreSQL private endpoint allows TLS connections only from the application origin and authorized migration path; no public 5432. Configure outbound Tunnel and necessary package, DNS, time and patch traffic. Use current Cloudflare documentation for actual connector installation and firewall requirements.

Create named staging database madising_trial, with separate migration owner and madising_runtime non-owner login. Database admin restricts CONNECT and TEMP privileges, schema creation and role memberships; runtime may not own database/schema/table or inherit privileged roles. Set TLS certificate trust through the OS/Node trusted CA bundle (NODE_EXTRA_CA_CERTS with a trusted CA if necessary), validate hostname. URL must use sslmode=verify-full. Confirm vendor CA support and test failure on hostname/CA mismatch before proceeding. No secrets in git, process arguments, logs or chat.

## Release and runtime

1. Merge reviewed source and pass CI; generate, review, commit and verify both npm lockfiles. Run the build script as a non-root release user on a clean checkout; it refuses unlocked dependencies or failed audit/build. No claim of reproducible build until lockfiles are present. Place built files in a root-owned release directory under /opt/madising/releases and atomically select /opt/madising/current. Create .next/cache owned by madising-web before launch. Keep previous release; do not assume rolling back code reverses database schema.
2. Create system service users madising-api and madising-web without interactive shell. Install Node 22 at /usr/bin/node. Create root-only /etc/madising/api.conf and web.conf, mode 0600. API file: TRIAL_DATABASE_URL with a unique staging secret. Web file: TRIAL_WEB_ORIGIN (exact https origin). Service units set mode flags explicitly. Do not put database URL in web environment.
3. As migration owner, apply infra/postgres/trial/001_sessions.sql, 002_role_tokens.sql, 003_accounts.sql and infra/staging/runtime-grants.sql on the dedicated database; verify runtime cannot create schema/table, alter tables or access other databases. Migrations must be reviewed for the exact release. Use protected environment/provider access rather than passing passwords on CLI.
4. Install service templates from infra/staging to /etc/systemd/system. Run systemd-analyze verify with actual users and paths, systemctl daemon-reload and start API then web. Check local /readyz (200 and mode synthetic-only), /account (200), root redirect and legacy /trial-api disabled. Inspect logs for sensitive values. Verify restart and resource limits. Do not enable external ingress yet.
5. Cloudflare managed tunnel madising-staging was created (inactive; no connector, hostname or DNS route). Enable Access in Cloudflare dashboard, choose staging hostname in a controlled zone, create self-hosted application with explicit allowlist of testers, default deny, and configure identity/MFA at edge. Install cloudflared on VPS with token transferred through protected channels, never committed or exposed. Route ONLY exact staging hostname to http://127.0.0.1:3000, catch-all 404, and enforce Access token validation at origin connector. Configure no cache for account/application responses. Do not route API or database. Existing public preview untouched. Follow https://developers.cloudflare.com/tunnel/get-started/ and https://developers.cloudflare.com/cloudflare-one/access-controls/.
6. Run outside-browser test without Access identity: must deny/redirect to Access login before reaching application. Test an approved identity, secure cookie, cross-role denial, separate browser sessions, logout and stale transaction rejection using synthetic accounts. Validate unauthorized hostname/path, cache, direct origin bypass, database access restrictions, rate limits, backups and restore. Record evidence before distributing staging URL.

## Current state

Tunnel object created but inactive; Cloudflare Access not enabled; dedicated origin, private database, hostname and tester access policy not yet available. Lockfiles, actual VPS install and physical network/TLS tests pending. The service files and preflight are templates, not verified on a real host. No billable resource ordered, no production deployment, no RME integration.


## Procurement hold — 15 November 2026

Option D selected: defer all VPS/database rental. The configuration above is retained for a future approved deployment. Continue synthetic CI and static preview only. Do not run installation steps against a public host or connect Tunnel while procurement is on hold. CI uses a disposable PostgreSQL instance and a restricted runtime role; it does not demonstrate private-network TLS, actual provider privileges, Access, physical server backup/restore or capacity. Candidate lockfiles are retained as CI artifacts for review, not approved release locks.
