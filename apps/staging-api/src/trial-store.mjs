import { randomUUID, randomBytes, createHash } from 'node:crypto';
import { Pool } from 'pg';
import { createTrialState, applyTrialAction, projectTrialState } from './trial-model.mjs';
const hash = (token) => createHash('sha256').update(token).digest('hex');
const validId = (value) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value);
const validToken = (value) => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
const roles = new Set(['PAT','NRS','DOC','PHA','CUR','ADM']);
const actions = new Set(['INDEPENDENT','MANDATE','EMERGENCY','OUTSIDE','NO_CAPACITY','REQUEST','SCREEN','VERIFY_DESTINATION','CONSENT','DISPATCH','ACCEPT','DECLINE','EXPIRE','RESCHEDULE','CANCEL','DEPART','ARRIVE','ASSESS','PLAN','CONSULT','SIGN','ACKNOWLEDGE','REVOKE','PERFORM','PRESCRIBE','EVALUATE','RECONCILE','PHARMACY_ACCEPT','PHARMACY_REJECT','PHARMACY_READY','COURIER_ASSIGN','PICKUP','DELIVER','ISSUE_INVOICE','SETTLE_INVOICE','READ','LOCATION_STEP','MESSAGE_REQUEST','MESSAGE_REPLY','REQUEST_AUDIO','REQUEST_VIDEO','ACCEPT_CALL','END_CALL']);
export class TrialStore {
  constructor(connectionString) {
    if (!connectionString) throw new Error('TRIAL_DATABASE_URL is required');
    this.pool = new Pool({ connectionString, max:4, connectionTimeoutMillis:3000, idleTimeoutMillis:10000, statement_timeout:5000, query_timeout:7000 });
  }
  async close() { await this.pool.end(); }
  async ready() { await this.pool.query('SELECT 1 FROM madising_trial.sessions LIMIT 1'); }
  async create() {
    const client = await this.pool.connect();
    let discard = false;
    try {
      await client.query('BEGIN');
      await client.query("SET LOCAL lock_timeout = '2s'");
      await client.query('SELECT pg_advisory_xact_lock(61421021)');
      await client.query('DELETE FROM madising_trial.sessions WHERE expires_at <= clock_timestamp()');
      const count = await client.query('SELECT count(*)::int AS total FROM madising_trial.sessions');
      if (count.rows[0].total >= 100) { await client.query('ROLLBACK'); return { code:429 }; }
      const id=randomUUID(), state=createTrialState();
      const tokens=Object.fromEntries([...roles].map(role=>[role,randomBytes(32).toString('hex')]));
      const hashes=Object.fromEntries(Object.entries(tokens).map(([role,token])=>[role,hash(token)]));
      await client.query("INSERT INTO madising_trial.sessions(id,token_hash,state,version,expires_at,role_token_hashes) VALUES ($1,$2,$3,0,clock_timestamp()+interval '2 hours',$4)",[id,hashes.PAT,JSON.stringify(state),JSON.stringify(hashes)]);
      await client.query('COMMIT');
      return {code:201,id,tokens,state:projectTrialState(state,'PAT')};
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch { discard = true; }
      throw error;
    } finally { client.release(discard); }
  }
  async act(input) {
    if (!input || !validId(input.id) || !validToken(input.token) || !roles.has(input.role) ||
      !actions.has(input.action) || !Number.isSafeInteger(input.version) || input.version < 0 || input.version >= 1000) return {code:400};
    const client = await this.pool.connect();
    let discard = false;
    try {
      await client.query('BEGIN');
      await client.query("SET LOCAL lock_timeout = '2s'");
      const result = await client.query('SELECT state,version FROM madising_trial.sessions WHERE id=$1 AND role_token_hashes->>($3::text)=$2 AND expires_at > clock_timestamp() FOR UPDATE',[input.id,hash(input.token),input.role]);
      if (result.rowCount !== 1) { await client.query('ROLLBACK'); return {code:404}; }
      const row = result.rows[0];
      if(input.action==='READ'){await client.query('COMMIT');return {code:200,state:projectTrialState(row.state,input.role)};}
      const transition = applyTrialAction(row.state,input.role,input.action,input.version);
      if (row.version !== input.version || !transition.ok) { await client.query('ROLLBACK'); return {code:409, state:projectTrialState(row.state,input.role)}; }
      const updated = await client.query('UPDATE madising_trial.sessions SET state=$1,version=$2 WHERE id=$3 AND version=$4 AND expires_at > clock_timestamp()',[JSON.stringify(transition.state),transition.state.version,input.id,input.version]);
      if (updated.rowCount !== 1) { await client.query('ROLLBACK'); return {code:409}; }
      await client.query('COMMIT');
      return {code:200,state:projectTrialState(transition.state,input.role)};
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch { discard = true; }
      throw error;
    } finally { client.release(discard); }
  }
}
