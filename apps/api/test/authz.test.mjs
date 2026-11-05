import test from 'node:test';
import assert from 'node:assert/strict';
import { allowedDashboards, hasRole, authorizeAction } from '../src/authz.mjs';
import { createAppServer } from '../src/server.mjs';

const make = (role, {
  id = 'actor-1',
  state = 'ACTIVE',
  kind = ({ PAT:'PATIENT', NRS:'CLINICIAN', DOC:'CLINICIAN', PHA:'PHARMACY',
    CUR:'COURIER', ADM:'INTERNAL', OWN:'INTERNAL', VEN:'VENDOR' })[role],
  contactVerified = true,
  bindingState = 'ACTIVE',
  credentialState = 'VERIFIED',
  credentialValidUntil = '2099-01-01T00:00:00Z',
  tenantId,
  mfa = true,
} = {}) => ({
  account: { id, state, kind, contactVerified },
  bindings: [{ role, state: bindingState, credentialState, credentialValidUntil, tenantId }],
  authn: { mfa },
});

test('only the six operational dashboards exist and vendor has none', () => {
  assert.deepEqual(allowedDashboards(make('PAT')), ['patient']);
  assert.deepEqual(allowedDashboards(make('NRS')), ['nurse']);
  assert.deepEqual(allowedDashboards(make('DOC')), ['doctor']);
  assert.deepEqual(allowedDashboards(make('PHA', { tenantId: 'a' })), ['pharmacy']);
  assert.deepEqual(allowedDashboards(make('CUR')), ['courier']);
  assert.deepEqual(allowedDashboards(make('ADM')), ['admin']);
  assert.deepEqual(allowedDashboards(make('OWN')), ['admin']);
  assert.deepEqual(allowedDashboards(make('VEN')), []);
});

test('pending courier sees onboarding shell but is not eligible for assignments', () => {
  const pending = make('CUR', { state: 'PENDING_REVIEW', bindingState: 'PENDING' });
  assert.deepEqual(allowedDashboards(pending), ['courier']);
  assert.equal(authorizeAction(pending, 'delivery.task.read', {
    assignedCourierAccountId: 'actor-1',
  }), false);
});

test('inactive accounts, expired credentials, and missing MFA lose privileges', () => {
  assert.deepEqual(allowedDashboards(make('PAT', { state: 'SUSPENDED' })), []);
  assert.deepEqual(allowedDashboards(make('DOC', { mfa: false })), []);
  assert.deepEqual(allowedDashboards(make('ADM', { mfa: false })), []);
  assert.deepEqual(allowedDashboards(make('VEN', { mfa: false })), []);
  assert.deepEqual(allowedDashboards(make('NRS', {
    credentialValidUntil: '2020-01-01T00:00:00Z',
  })), []);
  assert.deepEqual(allowedDashboards(make('PHA')), []);
  assert.equal(hasRole(make('DOC', { credentialState: 'PENDING' }), 'DOC'), false);
});

test('clinical data access and prescription authorship are restricted', () => {
  const patient = make('PAT');
  const nurse = make('NRS');
  const doctor = make('DOC');
  const owner = make('OWN');
  const vendor = make('VEN');
  const clinical = { assignedNurseAccountId: 'actor-1', authorizedDoctorAccountId: 'actor-1' };
  assert.equal(authorizeAction(patient, 'clinical.read', clinical), false);
  assert.equal(authorizeAction(nurse, 'clinical.read', clinical), true);
  assert.equal(authorizeAction(doctor, 'clinical.read', clinical), true);
  assert.equal(authorizeAction(owner, 'clinical.read', clinical), false);
  assert.equal(authorizeAction(vendor, 'clinical.read', clinical), false);
  assert.equal(authorizeAction(nurse, 'prescription.create', {
    ...clinical, encounterState: 'ACTIVE',
  }), false);
  assert.equal(authorizeAction(doctor, 'prescription.create', {
    ...clinical, encounterState: 'ACTIVE',
  }), true);
  assert.equal(authorizeAction(doctor, 'prescription.create', {
    authorizedDoctorAccountId: 'different', encounterState: 'ACTIVE',
  }), false);
});

test('patient ownership, partner isolation and courier assignment are enforced', () => {
  assert.equal(authorizeAction(make('PAT'), 'booking.create', {
    patientAccountId: 'different',
  }), false);
  assert.equal(authorizeAction(make('PAT'), 'booking.create', {
    patientAccountId: 'actor-1',
  }), true);
  assert.equal(authorizeAction(make('PHA', { tenantId: 'pharmacy-a' }), 'pharmacy.order.read', {
    tenantId: 'pharmacy-b',
  }), false);
  assert.equal(authorizeAction(make('PHA', { tenantId: 'pharmacy-a' }), 'pharmacy.order.read', {
    tenantId: 'pharmacy-a',
  }), true);
  assert.equal(authorizeAction(make('CUR'), 'delivery.task.read', {
    assignedCourierAccountId: 'different',
  }), false);
  assert.equal(authorizeAction(make('CUR'), 'delivery.task.read', {
    assignedCourierAccountId: 'actor-1',
  }), true);
});

test('admin/vendor separation, denied actions and data classes', () => {
  assert.equal(authorizeAction(make('ADM'), 'operations.read', { dataClass: 'OPERATIONS' }), true);
  assert.equal(authorizeAction(make('OWN'), 'operations.read', { dataClass: 'PHI' }), false);
  assert.equal(authorizeAction(make('VEN'), 'maintenance.status.read', {
    dataClass: 'TECHNICAL_REDACTED',
  }), true);
  assert.equal(authorizeAction(make('VEN'), 'maintenance.status.read', { dataClass: 'PHI' }), false);
  assert.equal(authorizeAction(make('ADM'), 'maintenance.status.read', {
    dataClass: 'TECHNICAL_REDACTED',
  }), false);
  assert.equal(authorizeAction(make('DOC'), 'unknown.action', {}), false);
  assert.equal(authorizeAction(make('DOC'), 'clinical.read', null), false);
});

async function withServer(dependencies, run) {
  const server = createAppServer(dependencies);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    await run('http://127.0.0.1:' + server.address().port);
  } finally {
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
}

test('HTTP refuses forged role and has no clinical endpoints', async () => {
  await withServer({}, async url => {
    for (const [path, opts, expected] of [
      ['/api/v1/session?role=doctor', { headers: { 'X-Role': 'DOC' } }, 401],
      ['/api/v1/dashboards/doctor', { headers: { Authorization: 'Bearer forged.jwt.value' } }, 401],
      ['/api/v1/patients', { headers: { Authorization: 'Bearer forged.jwt.value' } }, 404],
    ]) {
      const response = await fetch(url + path, opts);
      assert.equal(response.status, expected);
    }
  });
});

test('HTTP uses trusted server-side role bindings, never query or token roles', async () => {
  const account = make('PAT');
  const dependencies = {
    authenticateBearer: async token => token === 'valid-test-token'
      ? { issuer: 'https://issuer.example', subject: 'patient-sub', mfa: false, roles: ['DOC'] }
      : null,
    loadPrincipal: async (issuer, subject) =>
      issuer === 'https://issuer.example' && subject === 'patient-sub' ? account : null,
  };
  await withServer(dependencies, async url => {
    const headers = { Authorization: 'Bearer valid-test-token', 'X-Role': 'DOC' };
    const session = await fetch(url + '/api/v1/session?role=DOC', { headers });
    assert.equal(session.status, 200);
    assert.deepEqual(await session.json(), { accountState: 'ACTIVE', dashboards: ['patient'] });
    const patient = await fetch(url + '/api/v1/dashboards/patient', { headers });
    assert.equal(patient.status, 200);
    const doctor = await fetch(url + '/api/v1/dashboards/doctor', { headers });
    assert.equal(doctor.status, 403);
    const vendor = await fetch(url + '/api/v1/vendor/status', { headers });
    assert.equal(vendor.status, 403);
  });
});

test('HTTP blocks privileged dashboard without verified MFA', async () => {
  await withServer({
    authenticateBearer: async () => ({ issuer: 'https://issuer.example', subject: 'doctor', mfa: false }),
    loadPrincipal: async () => make('DOC', { mfa: true }),
  }, async url => {
    const res = await fetch(url + '/api/v1/dashboards/doctor', {
      headers: { Authorization: 'Bearer test-token' },
    });
    assert.equal(res.status, 403);
  });
});


test('role binding cannot cross account kind and unverified contact cannot book', () => {
  assert.deepEqual(allowedDashboards(make('DOC', { kind: 'PATIENT' })), []);
  assert.deepEqual(allowedDashboards(make('PAT', { contactVerified: false })), []);
  assert.deepEqual(allowedDashboards(make('CUR', { contactVerified: false })), []);
  assert.equal(authorizeAction(make('ADM'), 'booking.read', {
    patientAccountId: 'some-other-id', dataClass: 'PHI',
  }), false);
  assert.equal(authorizeAction(make('ADM'), 'booking.read', {
    dataClass: 'OPERATIONS',
  }), true);
  assert.deepEqual(allowedDashboards(make('DOC', { credentialValidUntil: null })), []);
});
