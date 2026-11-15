import test from 'node:test';
import assert from 'node:assert/strict';
import { createPrincipalDirectory } from '../src/directory.mjs';

test('directory binds issuer and subject in parameterized SQL and maps trusted roles', async () => {
  const calls = [];
  const db = {
    async query(sql, params) {
      calls.push({ sql, params });
      if (calls.length === 1) {
        return { rows: [{
          id: 'account-001', kind: 'CLINICIAN', state: 'ACTIVE',
          contact_verified: true,
        }] };
      }
      return { rows: [{
        role: 'DOC', state: 'ACTIVE', credential_state: 'VERIFIED',
        credential_valid_until: '2099-01-01T00:00:00Z', tenant_id: null,
      }] };
    },
  };
  const load = createPrincipalDirectory(db);
  const injectedSubject = "abc' OR 1=1 --";
  const principal = await load('https://issuer.example', injectedSubject);
  assert.deepEqual(calls[0].params, ['https://issuer.example', injectedSubject]);
  assert.equal(calls[0].sql.includes(injectedSubject), false);
  assert.deepEqual(calls[1].params, ['account-001']);
  assert.equal(principal.account.kind, 'CLINICIAN');
  assert.deepEqual(principal.bindings.map(x => x.role), ['DOC']);
});

test('missing identity is rejected without role lookup', async () => {
  let calls = 0;
  const load = createPrincipalDirectory({
    async query() { calls++; return { rows: [] }; },
  });
  assert.equal(await load('https://issuer.example', 'not-found'), null);
  assert.equal(calls, 1);
});

test('invalid subjects never hit the database', async () => {
  const load = createPrincipalDirectory({
    async query() { throw new Error('must not query'); },
  });
  assert.equal(await load('bad', 'user'), null);
  assert.equal(await load('https://issuer.example', ''), null);
  assert.throws(() => createPrincipalDirectory(null), /required/);
});
