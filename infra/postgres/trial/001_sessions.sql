-- Synthetic-only staging schema. Do not apply to production.
CREATE SCHEMA IF NOT EXISTS madising_trial;
CREATE TABLE IF NOT EXISTS madising_trial.sessions (
  id uuid PRIMARY KEY,
  token_hash text NOT NULL CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  state jsonb NOT NULL CHECK (jsonb_typeof(state)='object'),
  version integer NOT NULL CHECK (version >= 0 AND version <= 1000),
  expires_at timestamptz NOT NULL,
  CHECK (state ? 'version' AND state->>'version'=version::text)
);
CREATE INDEX IF NOT EXISTS sessions_expiry ON madising_trial.sessions(expires_at);
