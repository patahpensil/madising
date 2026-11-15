# Deferred procurement verification

15 November 2026: VPS and private PostgreSQL rental deferred by project direction. Cloudflare static preview stays synthetic. The existing Tunnel object is retained inactive and is not a live origin.

Changes:
- The integration job creates a separate throwaway database with a non-login migration owner and a restricted runtime login. Migrations run as the owner; API, browser and concurrency checks use the runtime login. The smoke SQL checks actual login, schema/database privileges, owner membership and denial of CREATE/ALTER/TEMP. Only synthetic CI credentials are used. No real TLS, network or provider claim is made.
- The job retains candidate npm lockfiles for seven days. They require review, commit, dependency audit and npm ci verification before the release gate. Do not treat them as approved lockfiles.
- The existing static browser journey captures synthetic user interfaces for visual review. Images contain no real patient records or session credentials. The artifact is a visual reference, not accessibility or design certification.
- No new application endpoint, asynchronous worker, scheduler or public ingress is introduced. Existing regression, concurrency and browser suites are retained; new smoke checks are synchronous SQL. Actual deadlock stress, heap profiling, physical backup/restore, production identity and Access checks remain outstanding.

CI results must be verified against the committed revision. No external deployment or resource purchase is performed.
