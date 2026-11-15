import { createHash, createHmac, randomBytes, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
import {
  generateAuthenticationOptions, generateRegistrationOptions,
  verifyAuthenticationResponse, verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { createTrialState } from './trial-model.mjs';
import { PROFILE_KEYS, professionalProfile } from './staff-profiles.mjs';

export const OTP_POLICY = Object.freeze({
  ttlSeconds: 300, maxAttempts: 5, resendSeconds: 60, maxSendsPerHour: 5,
});
const REVIEW_TAGS = new Set(['TEPAT_WAKTU', 'PENJELASAN_JELAS', 'RAMAH', 'TELITI']);
const SELF_SERVICE_ROLES = new Set(['PAT', 'CUR']);
const NURSE_VISIBLE = new Set(['ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'DOCUMENTATION_PENDING', 'COMPLETED']);
const MAX_PASSKEYS = 5;
const MAX_PENDING_AUTH_CHALLENGES = 500;
const digest = (value) => createHash('sha256').update(value).digest('hex');
const isUuid = (v) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v);
const isToken = (v) => typeof v === 'string' && /^[0-9a-f]{64}$/.test(v);

// Indonesian mobile numbers only: 08…, 628… or +628…, 10–13 national digits.
export function normalizeWhatsAppNumber(input) {
  if (typeof input !== 'string' || input.length > 24) return null;
  const compact = input.replace(/[\s-]/g, '');
  const match = /^(?:\+62|62|0)(8[1-9][0-9]{7,10})$/.exec(compact);
  return match ? `+62${match[1]}` : null;
}
export const validOtpCode = (code) => typeof code === 'string' && /^[0-9]{6}$/.test(code);

// Delivery is pluggable; only the isolated fixture harness may expose codes.
export function createOtpSender(env = process.env) {
  if (env.WHATSAPP_OTP_PROVIDER === 'fixture' && env.MADISING_FIXTURE_HARNESS === '1') {
    return { async send() { return { exposeCode: true }; } };
  }
  return null;
}

export class AccessStore {
  constructor(pool, { pepper = process.env.OTP_PEPPER, sender = createOtpSender(), rpID = process.env.WEBAUTHN_RP_ID, origin = process.env.TRIAL_WEB_ORIGIN, now = () => Date.now() } = {}) {
    if (typeof pepper !== 'string' || pepper.length < 32) throw new Error('OTP_PEPPER must contain at least 32 characters');
    this.pool = pool; this.pepper = pepper; this.sender = sender; this.rpID = rpID; this.origin = origin; this.now = now;
  }
  hmac(value) { return createHmac('sha256', this.pepper).update(value).digest('hex'); }

  async transaction(work) {
    const client = await this.pool.connect(); let discard = false;
    try {
      await client.query('BEGIN'); await client.query("SET LOCAL lock_timeout='2s'");
      const result = await work(client); await client.query('COMMIT'); return result;
    } catch (error) { try { await client.query('ROLLBACK'); } catch { discard = true; } throw error; }
    finally { client.release(discard); }
  }

  // Resolves an active session inside the caller's transaction and refreshes idle time.
  async identity(client, token) {
    if (!isToken(token)) return null;
    const found = await client.query(
      `SELECT a.id,a.role,a.exercise_id,a.username,a.phone_last4 FROM madising_trial.accounts a
       JOIN madising_trial.account_sessions s ON s.account_id=a.id
       WHERE s.token_hash=$1 AND a.state='ACTIVE' AND s.expires_at>clock_timestamp() AND s.idle_until>clock_timestamp() FOR UPDATE OF a`,
      [digest(token)]);
    if (found.rowCount !== 1) return null;
    const me = found.rows[0];
    if (!(await this.liveExercise(client, me.exercise_id))) return null;
    const live = await client.query("UPDATE madising_trial.account_sessions SET idle_until=LEAST(expires_at,clock_timestamp()+interval '30 minutes') WHERE token_hash=$1 AND account_id=$2 AND expires_at>clock_timestamp() AND idle_until>clock_timestamp()", [digest(token), me.id]);
    return live.rowCount === 1 ? me : null;
  }

  async issueSession(client, accountId) {
    const token = randomBytes(32).toString('hex');
    await client.query('DELETE FROM madising_trial.account_sessions WHERE account_id=$1', [accountId]);
    await client.query("INSERT INTO madising_trial.account_sessions(token_hash,account_id,expires_at,idle_until) VALUES($1,$2,transaction_timestamp()+interval '2 hours',transaction_timestamp()+interval '30 minutes')", [digest(token), accountId]);
    await client.query('INSERT INTO madising_trial.account_preferences(account_id) VALUES($1) ON CONFLICT DO NOTHING', [accountId]);
    return token;
  }

  async liveExercise(client, exerciseId) {
    if (!exerciseId) return false;
    const exercise = await client.query('SELECT id FROM madising_trial.sessions WHERE id=$1 AND expires_at>clock_timestamp() FOR SHARE', [exerciseId]);
    return exercise.rowCount === 1;
  }

  // Always answers 202 with the same shape so callers cannot learn whether a number is registered.
  async requestOtp(input) {
    const phone = normalizeWhatsAppNumber(input?.phone);
    const purpose = input?.purpose;
    if (!phone || !['REGISTER', 'LOGIN'].includes(purpose) || (purpose === 'REGISTER' && !SELF_SERVICE_ROLES.has(input.role))) return { code: 400 };
    if (!this.sender) return { code: 503 };
    const phoneHmac = this.hmac(phone);
    const accepted = { code: 202, resendAfterSeconds: OTP_POLICY.resendSeconds, expiresInSeconds: OTP_POLICY.ttlSeconds };
    return this.transaction(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [phoneHmac]);
      const recent = await client.query(
        `SELECT count(*)::int AS hour_total, max(created_at) AS latest FROM madising_trial.otp_challenges
         WHERE phone_hmac=$1 AND created_at>clock_timestamp()-interval '1 hour'`, [phoneHmac]);
      const { hour_total: hourTotal, latest } = recent.rows[0];
      if (latest && this.now() - new Date(latest).getTime() < OTP_POLICY.resendSeconds * 1000) {
        const wait = Math.ceil((OTP_POLICY.resendSeconds * 1000 - (this.now() - new Date(latest).getTime())) / 1000);
        return { code: 429, retryAfterSeconds: Math.max(1, wait) };
      }
      if (hourTotal >= OTP_POLICY.maxSendsPerHour) return { code: 429, retryAfterSeconds: 3600 };
      const existing = await client.query('SELECT state FROM madising_trial.accounts WHERE phone_hmac=$1', [phoneHmac]);
      const eligible = purpose === 'LOGIN' ? existing.rows[0]?.state === 'ACTIVE' : existing.rowCount === 0;
      // A non-delivered request still occupies the same rate-limit window.
      const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
      await client.query('UPDATE madising_trial.otp_challenges SET consumed_at=clock_timestamp() WHERE phone_hmac=$1 AND consumed_at IS NULL AND $2::boolean', [phoneHmac, eligible]);
      await client.query(
        `INSERT INTO madising_trial.otp_challenges(id,phone_hmac,purpose,role,code_hmac,expires_at,consumed_at)
         VALUES($1,$2,$3,$4,$5,clock_timestamp()+make_interval(secs=>$6),CASE WHEN $7::boolean THEN NULL ELSE clock_timestamp() END)`,
        [randomUUID(), phoneHmac, purpose, purpose === 'REGISTER' ? input.role : null, this.hmac(`${phoneHmac}:${code}`), OTP_POLICY.ttlSeconds, eligible]);
      if (!eligible) return accepted;
      // Sending inside the transaction: a failed delivery leaves no usable challenge.
      const delivery = await this.sender.send({ phone, code });
      return delivery?.exposeCode ? { ...accepted, fixtureCode: code } : accepted;
    });
  }

  async verifyOtp(input) {
    const phone = normalizeWhatsAppNumber(input?.phone);
    if (!phone || !validOtpCode(input?.code)) return { code: 400 };
    const phoneHmac = this.hmac(phone);
    return this.transaction(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [phoneHmac]);
      const found = await client.query(
        `SELECT * FROM madising_trial.otp_challenges WHERE phone_hmac=$1 AND consumed_at IS NULL AND expires_at>clock_timestamp()
         ORDER BY created_at DESC LIMIT 1 FOR UPDATE`, [phoneHmac]);
      const challenge = found.rows[0];
      if (!challenge) return { code: 401 };
      const expected = Buffer.from(challenge.code_hmac, 'hex');
      const actual = Buffer.from(this.hmac(`${phoneHmac}:${input.code}`), 'hex');
      if (!timingSafeEqual(expected, actual)) {
        const attempts = challenge.attempts + 1;
        await client.query(
          'UPDATE madising_trial.otp_challenges SET attempts=$2::int,consumed_at=CASE WHEN $2::int>=$3::int THEN clock_timestamp() ELSE NULL END WHERE id=$1',
          [challenge.id, attempts, OTP_POLICY.maxAttempts]);
        return { code: 401, attemptsRemaining: Math.max(0, OTP_POLICY.maxAttempts - attempts) };
      }
      await client.query('UPDATE madising_trial.otp_challenges SET consumed_at=clock_timestamp() WHERE id=$1', [challenge.id]);
      if (challenge.purpose === 'LOGIN') {
        const account = await client.query('SELECT id,role,state,exercise_id FROM madising_trial.accounts WHERE phone_hmac=$1 FOR UPDATE', [phoneHmac]);
        const a = account.rows[0];
        if (!a || a.state !== 'ACTIVE' || !(await this.liveExercise(client, a.exercise_id))) return { code: 403 };
        return { code: 200, token: await this.issueSession(client, a.id), role: a.role };
      }
      // Registration: patients activate after contact verification; couriers wait for Admin review.
      const id = randomUUID();
      let exerciseId = null;
      if (challenge.role === 'PAT') {
        exerciseId = randomUUID();
        await client.query(
          "INSERT INTO madising_trial.sessions(id,token_hash,state,version,expires_at) VALUES($1,$2,$3,0,clock_timestamp()+interval '2 hours')",
          [exerciseId, digest(randomBytes(32).toString('hex')), JSON.stringify(createTrialState())]);
      }
      const inserted = await client.query(
        `INSERT INTO madising_trial.accounts(id,role,state,phone_hmac,phone_last4,exercise_id)
         VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(phone_hmac) DO NOTHING`,
        [id, challenge.role, challenge.role === 'PAT' ? 'ACTIVE' : 'PENDING', phoneHmac, phone.slice(-4), exerciseId]);
      if (inserted.rowCount !== 1) return { code: 409 };
      if (challenge.role === 'CUR') return { code: 202, pending: true };
      return { code: 200, token: await this.issueSession(client, id), role: 'PAT' };
    });
  }

  async preferences(token, patch) {
    return this.transaction(async (client) => {
      const me = await this.identity(client, token);
      if (!me) return { code: 401 };
      await client.query('INSERT INTO madising_trial.account_preferences(account_id) VALUES($1) ON CONFLICT DO NOTHING', [me.id]);
      if (patch) {
        const updates = [];
        const values = [me.id];
        const set = (column, value) => { values.push(value); updates.push(`${column}=$${values.length}`); };
        if (patch.onboardingCompleted === true) updates.push('onboarding_completed_at=COALESCE(onboarding_completed_at,clock_timestamp())');
        if (patch.passkeyOfferDismissed === true) updates.push('passkey_offer_dismissed_at=clock_timestamp()');
        if (patch.language !== undefined) { if (!['id', 'en'].includes(patch.language)) return { code: 400 }; set('language', patch.language); }
        for (const [key, column] of [['notifyService', 'notify_service'], ['notifyReminder', 'notify_reminder']]) {
          if (patch[key] !== undefined) { if (typeof patch[key] !== 'boolean') return { code: 400 }; set(column, patch[key]); }
        }
        if (updates.length === 0) return { code: 400 };
        await client.query(`UPDATE madising_trial.account_preferences SET ${updates.join(',')} WHERE account_id=$1`, values);
      }
      const row = (await client.query('SELECT * FROM madising_trial.account_preferences WHERE account_id=$1', [me.id])).rows[0];
      const passkeys = await client.query('SELECT count(*)::int AS total FROM madising_trial.passkeys WHERE account_id=$1', [me.id]);
      return {
        code: 200, role: me.role,
        account: { label: me.phone_last4 ? `WhatsApp •••• ${me.phone_last4}` : me.username, method: me.phone_last4 ? 'WHATSAPP' : 'PASSWORD' },
        preferences: {
          onboardingCompleted: Boolean(row.onboarding_completed_at), passkeyOfferDismissed: Boolean(row.passkey_offer_dismissed_at),
          language: row.language, notifyService: row.notify_service, notifyReminder: row.notify_reminder,
        },
        passkeyCount: passkeys.rows[0].total,
      };
    });
  }

  ensureWebAuthn() { return typeof this.rpID === 'string' && this.rpID.length > 0 && typeof this.origin === 'string' && this.origin.length > 0; }

  async passkeyRegistrationOptions(token) {
    if (!this.ensureWebAuthn()) return { code: 503 };
    return this.transaction(async (client) => {
      const me = await this.identity(client, token);
      if (!me) return { code: 401 };
      const owned = await client.query('SELECT credential_id,transports FROM madising_trial.passkeys WHERE account_id=$1', [me.id]);
      if (owned.rowCount >= MAX_PASSKEYS) return { code: 409 };
      const options = await generateRegistrationOptions({
        rpName: 'MADISING', rpID: this.rpID,
        userName: me.phone_last4 ? `madising-${me.phone_last4}` : me.username,
        userID: Buffer.from(me.id.replace(/-/g, ''), 'hex'), attestationType: 'none',
        excludeCredentials: owned.rows.map((row) => ({ id: row.credential_id, transports: row.transports })),
        authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
      });
      const challengeId = randomUUID();
      await client.query('DELETE FROM madising_trial.webauthn_challenges WHERE account_id=$1 OR expires_at<=clock_timestamp()', [me.id]);
      await client.query("INSERT INTO madising_trial.webauthn_challenges(id,account_id,purpose,challenge,expires_at) VALUES($1,$2,'REGISTER',$3,clock_timestamp()+interval '5 minutes')", [challengeId, me.id, options.challenge]);
      return { code: 200, challengeId, options };
    });
  }

  async passkeyRegistrationVerify(token, input) {
    if (!this.ensureWebAuthn() || !isUuid(input?.challengeId) || typeof input?.response !== 'object') return { code: 400 };
    return this.transaction(async (client) => {
      const me = await this.identity(client, token);
      if (!me) return { code: 401 };
      const consumed = await client.query(
        "DELETE FROM madising_trial.webauthn_challenges WHERE id=$1 AND account_id=$2 AND purpose='REGISTER' AND expires_at>clock_timestamp() RETURNING challenge",
        [input.challengeId, me.id]);
      if (consumed.rowCount !== 1) return { code: 401 };
      let result;
      try {
        result = await verifyRegistrationResponse({
          response: input.response, expectedChallenge: consumed.rows[0].challenge,
          expectedOrigin: this.origin, expectedRPID: this.rpID, requireUserVerification: true,
        });
      } catch { return { code: 401 }; }
      if (!result.verified) return { code: 401 };
      const count = await client.query('SELECT count(*)::int AS total FROM madising_trial.passkeys WHERE account_id=$1', [me.id]);
      if (count.rows[0].total >= MAX_PASSKEYS) return { code: 409 };
      const { credential } = result.registrationInfo;
      const stored = await client.query(
        'INSERT INTO madising_trial.passkeys(credential_id,account_id,public_key,sign_count,transports) VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING',
        [credential.id, me.id, Buffer.from(credential.publicKey), credential.counter, credential.transports ?? []]);
      return stored.rowCount === 1 ? { code: 201 } : { code: 409 };
    });
  }

  async passkeyAuthenticationOptions() {
    if (!this.ensureWebAuthn()) return { code: 503 };
    return this.transaction(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock(61421023)');
      await client.query('DELETE FROM madising_trial.webauthn_challenges WHERE expires_at<=clock_timestamp()');
      const pending = await client.query("SELECT count(*)::int AS total FROM madising_trial.webauthn_challenges WHERE purpose='AUTHENTICATE'");
      if (pending.rows[0].total >= MAX_PENDING_AUTH_CHALLENGES) return { code: 429 };
      const options = await generateAuthenticationOptions({ rpID: this.rpID, userVerification: 'required', allowCredentials: [] });
      const challengeId = randomUUID();
      await client.query("INSERT INTO madising_trial.webauthn_challenges(id,purpose,challenge,expires_at) VALUES($1,'AUTHENTICATE',$2,clock_timestamp()+interval '2 minutes')", [challengeId, options.challenge]);
      return { code: 200, challengeId, options };
    });
  }

  async passkeyAuthenticationVerify(input) {
    const credentialId = input?.response?.id;
    if (!this.ensureWebAuthn() || !isUuid(input?.challengeId) || typeof credentialId !== 'string') return { code: 400 };
    return this.transaction(async (client) => {
      const consumed = await client.query(
        "DELETE FROM madising_trial.webauthn_challenges WHERE id=$1 AND purpose='AUTHENTICATE' AND expires_at>clock_timestamp() RETURNING challenge", [input.challengeId]);
      if (consumed.rowCount !== 1) return { code: 401 };
      const found = await client.query(
        `SELECT p.*,a.state,a.role,a.exercise_id FROM madising_trial.passkeys p JOIN madising_trial.accounts a ON a.id=p.account_id
         WHERE p.credential_id=$1 FOR UPDATE OF p,a`, [credentialId]);
      const key = found.rows[0];
      if (!key) return { code: 401 };
      let result;
      try {
        result = await verifyAuthenticationResponse({
          response: input.response, expectedChallenge: consumed.rows[0].challenge, expectedOrigin: this.origin, expectedRPID: this.rpID,
          credential: { id: key.credential_id, publicKey: new Uint8Array(key.public_key), counter: Number(key.sign_count), transports: key.transports },
          requireUserVerification: true,
        });
      } catch { return { code: 401 }; }
      if (!result.verified) return { code: 401 };
      // A non-increasing non-zero counter suggests a cloned authenticator.
      const next = result.authenticationInfo.newCounter;
      if ((next !== 0 || Number(key.sign_count) !== 0) && next <= Number(key.sign_count)) return { code: 401 };
      if (key.state !== 'ACTIVE' || !(await this.liveExercise(client, key.exercise_id))) return { code: 403 };
      await client.query('UPDATE madising_trial.passkeys SET sign_count=$2,last_used_at=clock_timestamp() WHERE credential_id=$1', [key.credential_id, next]);
      return { code: 200, token: await this.issueSession(client, key.account_id), role: key.role };
    });
  }

  async passkeys(token, removeId) {
    return this.transaction(async (client) => {
      const me = await this.identity(client, token);
      if (!me) return { code: 401 };
      if (removeId !== undefined) {
        if (typeof removeId !== 'string') return { code: 400 };
        const removed = await client.query('DELETE FROM madising_trial.passkeys WHERE credential_id=$1 AND account_id=$2', [removeId, me.id]);
        if (removed.rowCount !== 1) return { code: 404 };
      }
      const list = await client.query('SELECT credential_id,created_at,last_used_at FROM madising_trial.passkeys WHERE account_id=$1 ORDER BY created_at', [me.id]);
      return { code: 200, passkeys: list.rows.map((row) => ({ id: row.credential_id, createdAt: row.created_at, lastUsedAt: row.last_used_at })) };
    });
  }

  // Professionals are shown only once their involvement is established by server state.
  involved(state) {
    const keys = [];
    if (state.assigned && NURSE_VISIBLE.has(state.status)) keys.push(state.assigned);
    if (state.order && state.order !== 'NONE') keys.push('DOCTOR_A');
    return keys.filter((key) => PROFILE_KEYS.includes(key));
  }

  async careTeam(token) {
    return this.transaction(async (client) => {
      const me = await this.identity(client, token);
      if (!me) return { code: 401 };
      if (me.role !== 'PAT') return { code: 403 };
      const exercise = await client.query('SELECT state FROM madising_trial.sessions WHERE id=$1 AND expires_at>clock_timestamp()', [me.exercise_id]);
      if (exercise.rowCount !== 1) return { code: 401 };
      const state = exercise.rows[0].state;
      const keys = this.involved(state);
      const ratings = keys.length ? await client.query(
        `SELECT professional_key,count(*)::int AS total,round(avg(rating)::numeric,2)::float AS average,
          (SELECT array_agg(tag) FROM (SELECT unnest(tags) AS tag FROM madising_trial.care_reviews r2 WHERE r2.professional_key=r.professional_key) t) AS tags
         FROM madising_trial.care_reviews r WHERE professional_key=ANY($1) GROUP BY professional_key`, [keys]) : { rows: [] };
      const mine = await client.query('SELECT professional_key FROM madising_trial.care_reviews WHERE exercise_id=$1', [me.exercise_id]);
      const reviewed = new Set(mine.rows.map((row) => row.professional_key));
      return {
        code: 200,
        team: keys.map((key) => {
          const row = ratings.rows.find((r) => r.professional_key === key);
          const tagCounts = {};
          for (const tag of row?.tags ?? []) tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
          return {
            ...professionalProfile(key),
            rating: row ? { average: row.average, total: row.total, tags: tagCounts } : { average: null, total: 0, tags: {} },
            canReview: state.status === 'COMPLETED' && !reviewed.has(key),
          };
        }),
      };
    });
  }

  async review(token, input) {
    const rating = input?.rating;
    const tags = Array.isArray(input?.tags) ? [...new Set(input.tags)] : [];
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || tags.length > 4 || tags.some((tag) => !REVIEW_TAGS.has(tag))) return { code: 400 };
    return this.transaction(async (client) => {
      const me = await this.identity(client, token);
      if (!me) return { code: 401 };
      if (me.role !== 'PAT') return { code: 403 };
      const exercise = await client.query('SELECT state FROM madising_trial.sessions WHERE id=$1 AND expires_at>clock_timestamp() FOR SHARE', [me.exercise_id]);
      const state = exercise.rows[0]?.state;
      if (!state || state.status !== 'COMPLETED' || !this.involved(state).includes(input?.professionalKey)) return { code: 409 };
      const inserted = await client.query(
        'INSERT INTO madising_trial.care_reviews(id,exercise_id,professional_key,account_id,rating,tags) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING',
        [randomUUID(), me.exercise_id, input.professionalKey, me.id, rating, tags]);
      return inserted.rowCount === 1 ? { code: 201 } : { code: 409 };
    });
  }
}
