-- Disposable synthetic sessions only. Old sessions without per-role tokens fail closed.
ALTER TABLE madising_trial.sessions ADD COLUMN IF NOT EXISTS role_token_hashes jsonb NOT NULL DEFAULT '{}'::jsonb;
