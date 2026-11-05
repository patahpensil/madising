-- MADISING identity / authorization baseline (PostgreSQL 15+).
-- Migration only: never run automatically against production in CI.
-- All columns are operational identifiers. No clinical notes, diagnosis or raw STR numbers.
BEGIN;

CREATE SCHEMA IF NOT EXISTS madising;

CREATE TABLE IF NOT EXISTS madising.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oidc_issuer text NOT NULL,
  oidc_subject text NOT NULL,
  kind text NOT NULL CHECK (kind IN
    ('PATIENT','COURIER','CLINICIAN','PHARMACY','INTERNAL','VENDOR')),
  state text NOT NULL CHECK (state IN
    ('UNVERIFIED','APPLIED','PENDING_REVIEW','NEEDS_CORRECTION',
     'CANDIDATE','DOC_CHECKED','CLINICAL_CHECKED','OWNER_APPROVED',
     'INVITED','PARTNER_DRAFT','LEGAL_CHECKED','APPROVED',
     'ACTIVE','SUSPENDED','REJECTED','REVOKED','CLOSED','TERMINATED')),
  contact_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (oidc_issuer, oidc_subject),
  CHECK (length(oidc_issuer) BETWEEN 8 AND 2048),
  CHECK (length(oidc_subject) BETWEEN 1 AND 255)
);

CREATE TABLE IF NOT EXISTS madising.role_bindings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES madising.accounts(id) ON DELETE RESTRICT,
  role text NOT NULL CHECK (role IN ('PAT','NRS','DOC','PHA','CUR','ADM','OWN','VEN')),
  state text NOT NULL CHECK (state IN ('PENDING','ACTIVE','SUSPENDED','REVOKED')),
  credential_state text NOT NULL CHECK
    (credential_state IN ('NOT_REQUIRED','PENDING','VERIFIED','EXPIRED','REVOKED')),
  credential_valid_until timestamptz,
  tenant_id uuid,
  approved_by uuid REFERENCES madising.accounts(id) ON DELETE RESTRICT,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, role, tenant_id),
  CHECK (role <> 'PHA' OR tenant_id IS NOT NULL),
  CHECK (
    NOT (state = 'ACTIVE' AND role IN ('NRS','DOC','PHA','CUR')) OR
    credential_state = 'VERIFIED'
  ),
  CHECK (state <> 'ACTIVE' OR role IN ('PAT','CUR') OR approved_by IS NOT NULL)
);
-- Note: A Postgres UNIQUE permits multiple NULL tenant_id values.
-- Explicit unique index prevents duplicate tenantless role bindings.
CREATE UNIQUE INDEX IF NOT EXISTS role_bindings_no_tenant_unique
  ON madising.role_bindings(account_id, role) WHERE tenant_id IS NULL;
CREATE INDEX IF NOT EXISTS role_bindings_account_state_idx
  ON madising.role_bindings(account_id, state);

CREATE TABLE IF NOT EXISTS madising.access_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid REFERENCES madising.accounts(id) ON DELETE RESTRICT,
  role_context text NOT NULL CHECK
    (role_context IN ('PAT','NRS','DOC','PHA','CUR','ADM','OWN','VEN','SYSTEM')),
  action_code text NOT NULL,
  target_kind text NOT NULL,
  -- Target references should use opaque IDs, not clinical text or URLs.
  target_ref uuid,
  outcome text NOT NULL CHECK (outcome IN ('ALLOWED','DENIED','ERROR')),
  correlation_id uuid NOT NULL,
  reason_code text,
  CHECK (length(action_code) BETWEEN 1 AND 80),
  CHECK (length(target_kind) BETWEEN 1 AND 80)
);
CREATE INDEX IF NOT EXISTS access_audit_occurred_idx
  ON madising.access_audit(occurred_at DESC);

CREATE OR REPLACE FUNCTION madising.reject_audit_modification()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Audit events are append-only';
END;
$$;
DROP TRIGGER IF EXISTS access_audit_immutable ON madising.access_audit;
CREATE TRIGGER access_audit_immutable BEFORE UPDATE OR DELETE
  ON madising.access_audit FOR EACH ROW
  EXECUTE FUNCTION madising.reject_audit_modification();

-- Production DB roles, GRANTs, PITR, encryption, DPA, immutable external
-- audit export, backup/restore and tenant enforcement require deployment review.
COMMIT;
