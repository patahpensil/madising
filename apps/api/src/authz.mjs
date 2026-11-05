/**
 * MADISING authorization baseline.
 * NEVER supply actor or resource scopes from untrusted HTTP query/body.
 * Caller must load role bindings and object relationships from trusted database queries.
 */
export const DASHBOARD_ROLES = Object.freeze({
  patient: Object.freeze(['PAT']),
  nurse: Object.freeze(['NRS']),
  doctor: Object.freeze(['DOC']),
  pharmacy: Object.freeze(['PHA']),
  courier: Object.freeze(['CUR']),
  admin: Object.freeze(['ADM', 'OWN']),
});

const PRIVILEGED = new Set(['DOC', 'ADM', 'OWN', 'VEN']);
const CREDENTIALED = new Set(['NRS', 'DOC', 'PHA']);
const ROLE_ACCOUNT_KIND = Object.freeze({
  PAT: 'PATIENT', NRS: 'CLINICIAN', DOC: 'CLINICIAN', PHA: 'PHARMACY',
  CUR: 'COURIER', ADM: 'INTERNAL', OWN: 'INTERNAL', VEN: 'VENDOR',
});
const VALID_STATES = new Set(['ACTIVE']);
const COURIER_APPLICATION_STATES = new Set(['APPLIED', 'PENDING_REVIEW', 'NEEDS_CORRECTION']);

function accountAllowsRole(actor, role, permitPendingCourier) {
  if (!actor?.account || !actor?.authn || !Array.isArray(actor.bindings)) return false;
  if (actor.account.kind !== ROLE_ACCOUNT_KIND[role]) return false;
  if ((role === 'PAT' || role === 'CUR') && actor.account.state === 'ACTIVE' &&
      actor.account.contactVerified !== true) return false;
  if (actor.account.state === 'ACTIVE') return true;
  return role === 'CUR' && permitPendingCourier && COURIER_APPLICATION_STATES.has(actor.account.state);
}

export function hasRole(actor, role, options = {}) {
  const pendingCourier = options.pendingCourier === true;
  if (!accountAllowsRole(actor, role, pendingCourier)) return false;
  if (PRIVILEGED.has(role) && actor.authn.mfa !== true) return false;
  return actor.bindings.some((binding) => {
    if (binding.role !== role) return false;
    if (role === 'CUR' && pendingCourier && COURIER_APPLICATION_STATES.has(actor.account.state)) {
      return binding.state === 'PENDING';
    }
    if (binding.state !== 'ACTIVE' || actor.account.state !== 'ACTIVE') return false;
    if (CREDENTIALED.has(role) && binding.credentialState !== 'VERIFIED') return false;
    if (CREDENTIALED.has(role) && !binding.credentialValidUntil) return false;
    if (role === 'CUR' && binding.credentialState !== 'VERIFIED') return false;
    if (binding.credentialValidUntil) {
      const expiry = Date.parse(binding.credentialValidUntil);
      if (!Number.isFinite(expiry) || expiry <= Date.now()) return false;
    }
    if (role === 'PHA' && !binding.tenantId) return false;
    return true;
  });
}

export function allowedDashboards(actor) {
  return Object.entries(DASHBOARD_ROLES)
    .filter(([dashboard, roles]) => roles.some((role) => hasRole(actor, role, {
      pendingCourier: dashboard === 'courier',
    })))
    .map(([dashboard]) => dashboard);
}

export function canViewDashboard(actor, dashboard) {
  return typeof dashboard === 'string' && allowedDashboards(actor).includes(dashboard);
}

/**
 * All resource attributes here are TRUSTED server-side values, not caller claims.
 * These rules provide an initial executable permission matrix only; they must be
 * called after authenticated, scoped DB lookup and are not clinical endpoints.
 */
export function authorizeAction(actor, action, resource = null) {
  if (!actor?.account || actor.account.state !== 'ACTIVE' || !resource ||
      typeof resource !== 'object') return false;
  switch (action) {
    case 'booking.create':
      return hasRole(actor, 'PAT') &&
        Boolean(actor.account.id && resource.patientAccountId === actor.account.id);
    case 'booking.read':
      return (hasRole(actor, 'PAT') && resource.patientAccountId === actor.account.id) ||
        (hasRole(actor, 'NRS') && resource.assignedNurseAccountId === actor.account.id) ||
        (hasRole(actor, 'DOC') && resource.authorizedDoctorAccountId === actor.account.id) ||
        ((hasRole(actor, 'ADM') || hasRole(actor, 'OWN')) &&
          resource.dataClass === 'OPERATIONS');
    case 'clinical.read':
      return (hasRole(actor, 'NRS') && resource.assignedNurseAccountId === actor.account.id) ||
        (hasRole(actor, 'DOC') && resource.authorizedDoctorAccountId === actor.account.id);
    case 'prescription.create':
      return hasRole(actor, 'DOC') &&
        resource.authorizedDoctorAccountId === actor.account.id &&
        resource.encounterState === 'ACTIVE';
    case 'pharmacy.order.read':
      return hasRole(actor, 'PHA') &&
        actor.bindings.some((b) => b.role === 'PHA' && b.state === 'ACTIVE' &&
          b.credentialState === 'VERIFIED' && b.tenantId && b.tenantId === resource.tenantId);
    case 'delivery.task.read':
      return hasRole(actor, 'CUR') && resource.assignedCourierAccountId === actor.account.id;
    case 'operations.read':
      return (hasRole(actor, 'ADM') || hasRole(actor, 'OWN')) &&
        resource.dataClass === 'OPERATIONS';
    case 'maintenance.status.read':
      return hasRole(actor, 'VEN') && resource.dataClass === 'TECHNICAL_REDACTED';
    default:
      return false;
  }
}
