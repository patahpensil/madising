import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomInt } from 'node:crypto';
import { TrialStore } from '../src/trial-store.mjs';
import { AccountStore } from '../src/account-store.mjs';
import { AccessStore, normalizeWhatsAppNumber, OTP_POLICY } from '../src/access-store.mjs';

const pepper = randomBytes(32).toString('hex');
const fixture = { async send() { return { exposeCode: true }; } };
// Synthetic numbers in a reserved-looking range; never real subscribers.
const phone = () => `0899${String(randomInt(0, 10 ** 8)).padStart(8, '0')}`;
const setup = (t, options = {}) => {
  const trial = new TrialStore(process.env.TRIAL_DATABASE_URL);
  t.after(() => trial.close());
  return { trial, access: new AccessStore(trial.pool, { pepper, sender: fixture, rpID: 'localhost', origin: 'http://localhost:3000', ...options }) };
};
const pastCooldown = (access, number) => access.pool.query(
  "UPDATE madising_trial.otp_challenges SET created_at=created_at-interval '61 seconds' WHERE phone_hmac=$1",
  [access.hmac(normalizeWhatsAppNumber(number))]);
const wrong = (code) => String((Number(code) + 1) % 1_000_000).padStart(6, '0');
async function registerPatient(access) {
  const number = phone();
  const sent = await access.requestOtp({ phone: number, purpose: 'REGISTER', role: 'PAT' });
  const verified = await access.verifyOtp({ phone: number, code: sent.fixtureCode });
  assert.equal(verified.code, 200);
  return { number, token: verified.token };
}

test('WhatsApp number normalization accepts Indonesian mobile formats only', () => {
  assert.equal(normalizeWhatsAppNumber('0812 3456 789'), '+628123456789');
  assert.equal(normalizeWhatsAppNumber('+62-812-3456-7890'), '+6281234567890');
  assert.equal(normalizeWhatsAppNumber('6281234567890123'), null, 'too long');
  assert.equal(normalizeWhatsAppNumber('08123456'), null, 'too short');
  assert.equal(normalizeWhatsAppNumber('0812345678'), '+62812345678', 'shortest accepted');
  assert.equal(normalizeWhatsAppNumber('081234567'), null, 'one digit short');
  assert.equal(normalizeWhatsAppNumber('0212345678'), null, 'landline');
  assert.equal(normalizeWhatsAppNumber('+12025550123'), null, 'foreign');
  assert.equal(normalizeWhatsAppNumber(12345), null);
  assert.equal(normalizeWhatsAppNumber('08x2345678'), null);
});

test('OTP is unavailable without a configured sender and requires a strong pepper', (t) => {
  const trial = new TrialStore(process.env.TRIAL_DATABASE_URL);
  t.after(() => trial.close());
  assert.throws(() => new AccessStore(trial.pool, { pepper: 'short', sender: fixture }));
  return new AccessStore(trial.pool, { pepper, sender: null }).requestOtp({ phone: phone(), purpose: 'LOGIN' })
    .then((result) => assert.equal(result.code, 503));
});

test('self-registration is limited to patients and couriers; courier remains pending', async (t) => {
  const { access } = setup(t);
  for (const role of ['DOC', 'NRS', 'PHA', 'ADM', undefined]) {
    assert.equal((await access.requestOtp({ phone: phone(), purpose: 'REGISTER', role })).code, 400, String(role));
  }
  const courier = phone();
  const sent = await access.requestOtp({ phone: courier, purpose: 'REGISTER', role: 'CUR' });
  assert.equal(sent.code, 202);
  assert.deepEqual(await access.verifyOtp({ phone: courier, code: sent.fixtureCode }), { code: 202, pending: true });
  await pastCooldown(access, courier);
  const login = await access.requestOtp({ phone: courier, purpose: 'LOGIN' });
  assert.equal(login.code, 202);
  assert.equal(login.fixtureCode, undefined, 'pending courier receives no login code');
});

test('responses do not reveal whether a number is registered', async (t) => {
  const { access } = setup(t);
  const { number } = await registerPatient(access);
  await pastCooldown(access, number);
  const unknown = await access.requestOtp({ phone: phone(), purpose: 'LOGIN' });
  const duplicate = await access.requestOtp({ phone: number, purpose: 'REGISTER', role: 'PAT' });
  for (const result of [unknown, duplicate]) {
    assert.deepEqual(Object.keys(result).sort(), ['code', 'expiresInSeconds', 'resendAfterSeconds']);
  }
});

test('wrong codes are counted, the fifth failure burns the code and resend is throttled', async (t) => {
  const { access } = setup(t);
  const number = phone();
  const sent = await access.requestOtp({ phone: number, purpose: 'REGISTER', role: 'PAT' });
  assert.equal((await access.requestOtp({ phone: number, purpose: 'REGISTER', role: 'PAT' })).code, 429);
  for (let remaining = OTP_POLICY.maxAttempts - 1; remaining >= 0; remaining -= 1) {
    const result = await access.verifyOtp({ phone: number, code: wrong(sent.fixtureCode) });
    assert.deepEqual(result, { code: 401, attemptsRemaining: remaining });
  }
  assert.equal((await access.verifyOtp({ phone: number, code: sent.fixtureCode })).code, 401);
  assert.equal((await access.verifyOtp({ phone: number, code: '12345' })).code, 400);
  assert.equal((await access.verifyOtp({ phone: number, code: '1234567' })).code, 400);
});

test('expired codes are rejected and hourly sends are capped', async (t) => {
  const { trial, access } = setup(t);
  const number = phone();
  const sent = await access.requestOtp({ phone: number, purpose: 'REGISTER', role: 'PAT' });
  const hmac = access.hmac(normalizeWhatsAppNumber(number));
  await trial.pool.query("UPDATE madising_trial.otp_challenges SET expires_at=created_at+interval '1 millisecond' WHERE phone_hmac=$1", [hmac]);
  assert.equal((await access.verifyOtp({ phone: number, code: sent.fixtureCode })).code, 401);
  for (let i = 1; i < OTP_POLICY.maxSendsPerHour; i += 1) {
    await trial.pool.query("UPDATE madising_trial.otp_challenges SET created_at=created_at-interval '61 seconds',expires_at=expires_at-interval '61 seconds' WHERE phone_hmac=$1", [hmac]);
    assert.equal((await access.requestOtp({ phone: number, purpose: 'REGISTER', role: 'PAT' })).code, 202, `send ${i + 1}`);
  }
  await trial.pool.query("UPDATE madising_trial.otp_challenges SET created_at=created_at-interval '61 seconds',expires_at=expires_at-interval '61 seconds' WHERE phone_hmac=$1", [hmac]);
  assert.deepEqual(await access.requestOtp({ phone: number, purpose: 'REGISTER', role: 'PAT' }), { code: 429, retryAfterSeconds: 3600 });
});

test('a code can be consumed only once under concurrent verification', async (t) => {
  const { access } = setup(t);
  const number = phone();
  const sent = await access.requestOtp({ phone: number, purpose: 'REGISTER', role: 'PAT' });
  const results = await Promise.all([1, 2, 3].map(() => access.verifyOtp({ phone: number, code: sent.fixtureCode })));
  assert.deepEqual(results.map((r) => r.code).sort(), [200, 401, 401]);
});

test('patient login issues a session usable by the bound exercise only', async (t) => {
  const { trial, access } = setup(t);
  const { number } = await registerPatient(access);
  await pastCooldown(access, number);
  const sent = await access.requestOtp({ phone: number, purpose: 'LOGIN' });
  const login = await access.verifyOtp({ phone: number, code: sent.fixtureCode });
  assert.equal(login.role, 'PAT');
  const read = await trial.act({ token: login.token, action: 'READ', version: 0, role: 'ADM' }, true);
  assert.equal(read.code, 200);
  assert.equal(read.role, 'PAT', 'role comes from the server record');
});

test('preferences persist onboarding and validate input', async (t) => {
  const { access } = setup(t);
  const { token } = await registerPatient(access);
  const initial = await access.preferences(token);
  assert.equal(initial.preferences.onboardingCompleted, false);
  assert.match(initial.account.label, /^WhatsApp •••• \d{4}$/);
  assert.equal((await access.preferences(token, { onboardingCompleted: true })).preferences.onboardingCompleted, true);
  assert.equal((await access.preferences(token, { language: 'fr' })).code, 400);
  assert.equal((await access.preferences(token, { notifyService: 'yes' })).code, 400);
  assert.equal((await access.preferences(token, {})).code, 400);
  assert.equal((await access.preferences(token, { notifyReminder: false })).preferences.notifyReminder, false);
  assert.equal((await access.preferences('0'.repeat(64))).code, 401);
});

test('passkey ceremonies fail closed on configuration, forged responses and replay', async (t) => {
  const { access } = setup(t);
  const { token } = await registerPatient(access);
  const unconfigured = setup(t, { rpID: '' }).access;
  assert.equal((await unconfigured.passkeyRegistrationOptions(token)).code, 503);
  const options = await access.passkeyRegistrationOptions(token);
  assert.equal(options.code, 200);
  assert.equal(options.options.authenticatorSelection.userVerification, 'required');
  const forged = { id: 'AAAAAAAAAAAAAAAAAAAAAA', rawId: 'AAAAAAAAAAAAAAAAAAAAAA', type: 'public-key', response: { clientDataJSON: 'e30', attestationObject: 'oA' }, clientExtensionResults: {} };
  assert.equal((await access.passkeyRegistrationVerify(token, { challengeId: options.challengeId, response: forged })).code, 401);
  assert.equal((await access.passkeyRegistrationVerify(token, { challengeId: options.challengeId, response: forged })).code, 401, 'challenge is single use');
  const auth = await access.passkeyAuthenticationOptions();
  assert.equal(auth.code, 200);
  assert.equal((await access.passkeyAuthenticationVerify({ challengeId: auth.challengeId, response: { ...forged, response: { clientDataJSON: 'e30', authenticatorData: 'AA', signature: 'AA' } } })).code, 401);
  assert.equal((await access.passkeys(token)).passkeys.length, 0);
  assert.equal((await access.passkeys(token, 'missing')).code, 404);
});

test('care team appears only after assignment and reviews require a completed visit', async (t) => {
  const { trial, access } = setup(t);
  const patient = await registerPatient(access);
  const exercise = (await trial.pool.query(
    "SELECT a.exercise_id FROM madising_trial.accounts a WHERE a.phone_hmac=$1", [access.hmac(normalizeWhatsAppNumber(patient.number))])).rows[0].exercise_id;
  const nurse = { username: `uji-${randomBytes(6).toString('hex')}`, password: randomBytes(24).toString('hex'), role: 'NRS' };
  await new AccountStore(trial.pool).provision({ ...nurse, exerciseId: exercise });
  const nurseSession = await new AccountStore(trial.pool).login(nurse);
  assert.deepEqual((await access.careTeam(patient.token)).team, []);
  assert.equal((await access.careTeam(nurseSession.token)).code, 403, 'only patients view their care team');
  let version = 0;
  const step = async (token, action) => {
    const result = await trial.act({ token, action, version }, true);
    assert.equal(result.code, 200, action);
    version = result.state.version;
  };
  for (const action of ['REQUEST', 'SCREEN', 'VERIFY_DESTINATION', 'CONSENT']) await step(patient.token, action);
  await step(nurseSession.token, 'ACCEPT');
  const assigned = await access.careTeam(patient.token);
  assert.equal(assigned.team.length, 1);
  assert.equal(assigned.team[0].profession, 'NURSE');
  assert.equal(assigned.team[0].synthetic, true);
  assert.equal(assigned.team[0].registrationNumber, null);
  const prior = (await trial.pool.query('SELECT count(*)::int AS total FROM madising_trial.care_reviews WHERE professional_key=$1', [assigned.team[0].key])).rows[0].total;
  assert.equal(assigned.team[0].rating.total, prior, 'ratings come only from stored completed-visit reviews');
  if (prior === 0) assert.deepEqual(assigned.team[0].rating, { average: null, total: 0, tags: {} });
  assert.equal(assigned.team[0].canReview, false);
  const key = assigned.team[0].key;
  assert.equal((await access.review(patient.token, { professionalKey: key, rating: 5 })).code, 409, 'not completed');
  for (const action of ['DEPART', 'ARRIVE', 'ASSESS', 'PLAN', 'PERFORM', 'EVALUATE', 'RECONCILE']) await step(nurseSession.token, action);
  assert.equal((await access.review(patient.token, { professionalKey: key, rating: 6 })).code, 400);
  assert.equal((await access.review(patient.token, { professionalKey: key, rating: 4, tags: ['BEBAS'] })).code, 400);
  assert.equal((await access.review(patient.token, { professionalKey: 'DOCTOR_A', rating: 5 })).code, 409, 'doctor not involved');
  const reviews = await Promise.all([1, 2].map(() => access.review(patient.token, { professionalKey: key, rating: 4, tags: ['RAMAH', 'RAMAH'] })));
  assert.deepEqual(reviews.map((r) => r.code).sort(), [201, 409]);
  const done = (await access.careTeam(patient.token)).team[0];
  assert.equal(done.canReview, false);
  assert.equal(done.rating.total, prior + 1);
  assert.ok(done.rating.tags.RAMAH >= 1);
});
