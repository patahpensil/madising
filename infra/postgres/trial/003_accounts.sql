-- Synthetic staging accounts only; no production identity or patient data.
CREATE TABLE IF NOT EXISTS madising_trial.accounts (
 id uuid PRIMARY KEY,
 username text UNIQUE NOT NULL CHECK(username ~ '^uji-[a-z0-9][a-z0-9-]{2,39}$'),
 role text NOT NULL CHECK(role IN ('PAT','NRS','DOC','PHA','CUR','ADM')),
 state text NOT NULL CHECK(state IN ('PENDING','ACTIVE','REVOKED')),
 salt text NOT NULL CHECK(salt ~ '^[0-9a-f]{32}$'),
 password_hash text NOT NULL CHECK(password_hash ~ '^[0-9a-f]{128}$'),
 exercise_id uuid REFERENCES madising_trial.sessions(id) ON DELETE CASCADE,
 failed_attempts integer NOT NULL DEFAULT 0 CHECK(failed_attempts BETWEEN 0 AND 5),
 locked_until timestamptz,
 CHECK(state <> 'ACTIVE' OR exercise_id IS NOT NULL)
);
CREATE TABLE IF NOT EXISTS madising_trial.account_sessions (
 token_hash text PRIMARY KEY CHECK(token_hash ~ '^[0-9a-f]{64}$'),
 account_id uuid NOT NULL REFERENCES madising_trial.accounts(id) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL,
 idle_until timestamptz NOT NULL CHECK(idle_until <= expires_at)
);
CREATE INDEX IF NOT EXISTS account_sessions_account ON madising_trial.account_sessions(account_id);
