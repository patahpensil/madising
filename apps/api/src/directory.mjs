/**
 * Adapter for mapping VERIFIED OIDC (issuer, subject) to account + role bindings.
 * Pass a PostgreSQL pool/client implementing query(sql, params).
 * The authentication verifier is separate and MUST verify token cryptographically.
 * Never trust a role or tenant supplied by a token, URL or HTTP body.
 */
export function createPrincipalDirectory(db) {
  if (!db || typeof db.query !== 'function') {
    throw new TypeError('A PostgreSQL-compatible query adapter is required');
  }
  return async function loadPrincipal(issuer, subject) {
    if (typeof issuer !== 'string' || typeof subject !== 'string' ||
        issuer.length < 8 || issuer.length > 2048 ||
        subject.length < 1 || subject.length > 255) {
      return null;
    }

    const accountResult = await db.query(
      'SELECT id, kind, state, contact_verified FROM madising.accounts ' +
      'WHERE oidc_issuer = $1 AND oidc_subject = $2',
      [issuer, subject],
    );
    if (accountResult.rows.length !== 1) return null;

    const row = accountResult.rows[0];
    const bindingResult = await db.query(
      'SELECT role, state, credential_state, credential_valid_until, tenant_id ' +
      'FROM madising.role_bindings WHERE account_id = $1',
      [row.id],
    );

    return {
      account: {
        id: row.id,
        kind: row.kind,
        state: row.state,
        contactVerified: row.contact_verified === true,
      },
      bindings: bindingResult.rows.map(binding => ({
        role: binding.role,
        state: binding.state,
        credentialState: binding.credential_state,
        credentialValidUntil: binding.credential_valid_until,
        tenantId: binding.tenant_id,
      })),
    };
  };
}
