import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { allowedDashboards, authorizeAction, canViewDashboard } from './authz.mjs';

function json(res, status, payload) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.writeHead(status);
  res.end(JSON.stringify(payload));
}

const disabledAuth = async () => null;
const disabledDirectory = async () => null;

async function trustedActor(req, authenticateBearer, loadPrincipal) {
  const authorization = req.headers.authorization;
  if (typeof authorization !== 'string' || !/^Bearer [A-Za-z0-9._~+/-]+$/.test(authorization)) {
    return null;
  }
  let identity;
  try {
    // authenticateBearer MUST verify OIDC access-token signature, issuer,
    // audience, expiry, token type and assurance using a mature identity SDK.
    identity = await authenticateBearer(authorization.slice(7));
  } catch {
    return null;
  }
  if (!identity || typeof identity.issuer !== 'string' ||
      typeof identity.subject !== 'string' || !identity.issuer || !identity.subject) {
    return null;
  }
  // Never trust roles, status, tenant IDs or assignment references from token.
  const principal = await loadPrincipal(identity.issuer, identity.subject);
  if (!principal?.account || !Array.isArray(principal.bindings)) return null;
  return { ...principal, authn: { mfa: identity.mfa === true } };
}

export async function requestHandler(req, res, dependencies = {}) {
  const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
  const authenticateBearer = dependencies.authenticateBearer ?? disabledAuth;
  const loadPrincipal = dependencies.loadPrincipal ?? disabledDirectory;

  if (req.method === 'GET' && pathname === '/healthz') {
    json(res, 200, { status: 'ok', service: 'madising-api-foundation' });
    return;
  }

  if (req.method !== 'GET' || !(
    pathname === '/api/v1/session' ||
    pathname === '/api/v1/vendor/status' ||
    /^\/api\/v1\/dashboards\/[a-z]+$/.test(pathname)
  )) {
    json(res, 404, { error: 'not_found' });
    return;
  }

  const actor = await trustedActor(req, authenticateBearer, loadPrincipal);
  if (!actor) {
    json(res, 401, { error: 'authentication_required' });
    return;
  }
  if (!['ACTIVE', 'APPLIED', 'PENDING_REVIEW', 'NEEDS_CORRECTION'].includes(actor.account.state)) {
    json(res, 403, { error: 'access_denied' });
    return;
  }

  if (pathname === '/api/v1/session') {
    json(res, 200, {
      accountState: actor.account.state,
      dashboards: allowedDashboards(actor),
    });
    return;
  }

  if (pathname === '/api/v1/vendor/status') {
    if (!authorizeAction(actor, 'maintenance.status.read', { dataClass: 'TECHNICAL_REDACTED' })) {
      json(res, 403, { error: 'access_denied' });
      return;
    }
    json(res, 200, { service: 'madising', console: 'technical', clinicalData: false });
    return;
  }

  const dashboard = pathname.slice('/api/v1/dashboards/'.length);
  if (!canViewDashboard(actor, dashboard)) {
    json(res, 403, { error: 'access_denied' });
    return;
  }
  json(res, 200, { dashboard, shellOnly: true, clinicalData: false });
}

export function createAppServer(dependencies = {}) {
  return createServer((req, res) => {
    requestHandler(req, res, dependencies).catch(() => {
      // Avoid returning raw errors, tokens, subject identifiers or PHI.
      if (!res.headersSent) json(res, 503, { error: 'service_unavailable' });
      else res.destroy();
    });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  // Deliberately deny all authenticated operations until a reviewed OIDC
  // verifier AND PostgreSQL directory adapter are wired into the runtime.
  // Never enable demo headers, static tokens or hard-coded clinical accounts.
  const port = Number.parseInt(process.env.PORT ?? '3001', 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid TCP port');
  }
  createAppServer().listen(port, '127.0.0.1', () => {
    console.log('MADISING safe foundation listening on localhost:' + port);
  });
}
