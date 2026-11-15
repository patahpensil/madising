-- Synthetic staging access: WhatsApp OTP, passkeys, preferences and service reviews.
-- No raw phone numbers, OTP codes or biometric data are stored.
ALTER TABLE madising_trial.accounts ALTER COLUMN salt DROP NOT NULL;
ALTER TABLE madising_trial.accounts ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE madising_trial.accounts ALTER COLUMN username DROP NOT NULL;
ALTER TABLE madising_trial.accounts ADD COLUMN IF NOT EXISTS phone_hmac text UNIQUE CHECK(phone_hmac ~ '^[0-9a-f]{64}$');
ALTER TABLE madising_trial.accounts ADD COLUMN IF NOT EXISTS phone_last4 text CHECK(phone_last4 ~ '^[0-9]{4}$');
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='accounts_identity_present') THEN
  ALTER TABLE madising_trial.accounts ADD CONSTRAINT accounts_identity_present CHECK(phone_hmac IS NOT NULL OR (username IS NOT NULL AND salt IS NOT NULL AND password_hash IS NOT NULL));
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='accounts_phone_self_service_roles') THEN
  ALTER TABLE madising_trial.accounts ADD CONSTRAINT accounts_phone_self_service_roles CHECK(phone_hmac IS NULL OR role IN ('PAT','CUR'));
 END IF;
END $$;

CREATE TABLE IF NOT EXISTS madising_trial.otp_challenges (
 id uuid PRIMARY KEY,
 phone_hmac text NOT NULL CHECK(phone_hmac ~ '^[0-9a-f]{64}$'),
 purpose text NOT NULL CHECK(purpose IN ('REGISTER','LOGIN')),
 role text CHECK(role IN ('PAT','CUR')),
 code_hmac text NOT NULL CHECK(code_hmac ~ '^[0-9a-f]{64}$'),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 expires_at timestamptz NOT NULL,
 attempts integer NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 5),
 consumed_at timestamptz,
 CHECK((purpose='REGISTER')=(role IS NOT NULL)),
 CHECK(expires_at > created_at)
);
CREATE INDEX IF NOT EXISTS otp_challenges_phone ON madising_trial.otp_challenges(phone_hmac,created_at DESC);

CREATE TABLE IF NOT EXISTS madising_trial.passkeys (
 credential_id text PRIMARY KEY CHECK(credential_id ~ '^[A-Za-z0-9_-]+$' AND length(credential_id) BETWEEN 16 AND 1024),
 account_id uuid NOT NULL REFERENCES madising_trial.accounts(id) ON DELETE CASCADE,
 public_key bytea NOT NULL CHECK(octet_length(public_key) BETWEEN 32 AND 2048),
 sign_count bigint NOT NULL DEFAULT 0 CHECK(sign_count >= 0),
 transports text[] NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 last_used_at timestamptz
);
CREATE INDEX IF NOT EXISTS passkeys_account ON madising_trial.passkeys(account_id);

CREATE TABLE IF NOT EXISTS madising_trial.webauthn_challenges (
 id uuid PRIMARY KEY,
 account_id uuid REFERENCES madising_trial.accounts(id) ON DELETE CASCADE,
 purpose text NOT NULL CHECK(purpose IN ('REGISTER','AUTHENTICATE')),
 challenge text NOT NULL CHECK(challenge ~ '^[A-Za-z0-9_-]{32,128}$'),
 expires_at timestamptz NOT NULL,
 CHECK((purpose='REGISTER')=(account_id IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS madising_trial.account_preferences (
 account_id uuid PRIMARY KEY REFERENCES madising_trial.accounts(id) ON DELETE CASCADE,
 onboarding_completed_at timestamptz,
 passkey_offer_dismissed_at timestamptz,
 language text NOT NULL DEFAULT 'id' CHECK(language IN ('id','en')),
 notify_service boolean NOT NULL DEFAULT true,
 notify_reminder boolean NOT NULL DEFAULT true
);

-- One review per completed synthetic exercise and professional; never seeded.
CREATE TABLE IF NOT EXISTS madising_trial.care_reviews (
 id uuid PRIMARY KEY,
 exercise_id uuid NOT NULL REFERENCES madising_trial.sessions(id) ON DELETE CASCADE,
 professional_key text NOT NULL CHECK(professional_key ~ '^(NURSE|DOCTOR)_[A-Z]$'),
 account_id uuid NOT NULL REFERENCES madising_trial.accounts(id) ON DELETE CASCADE,
 rating smallint NOT NULL CHECK(rating BETWEEN 1 AND 5),
 -- Fixed tags instead of free text so public reviews cannot carry health details.
 tags text[] NOT NULL DEFAULT '{}' CHECK(tags <@ ARRAY['TEPAT_WAKTU','PENJELASAN_JELAS','RAMAH','TELITI']::text[] AND cardinality(tags) <= 4),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(exercise_id,professional_key)
);
CREATE INDEX IF NOT EXISTS care_reviews_professional ON madising_trial.care_reviews(professional_key);
