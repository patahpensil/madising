-- Synthetic-only PostgreSQL smoke test for identity/authz constraints.
-- This file is executed in an ephemeral CI database and rolled back.
BEGIN;

INSERT INTO madising.accounts (oidc_issuer,oidc_subject,kind,state,contact_verified)
VALUES ('https://issuer.example','ci-patient','PATIENT','ACTIVE',true);

DO $$
DECLARE
  aid uuid;
  auditid bigint;
  blocked boolean;
BEGIN
  SELECT id INTO STRICT aid FROM madising.accounts
   WHERE oidc_issuer = 'https://issuer.example' AND oidc_subject = 'ci-patient';

  INSERT INTO madising.role_bindings
    (account_id,role,state,credential_state)
  VALUES (aid,'PAT','ACTIVE','NOT_REQUIRED');

  blocked := false;
  BEGIN
    INSERT INTO madising.role_bindings
      (account_id,role,state,credential_state)
    VALUES (aid,'DOC','ACTIVE','PENDING');
  EXCEPTION WHEN check_violation THEN
    blocked := true;
  END;
  IF NOT blocked THEN
    RAISE EXCEPTION 'Active unverified doctor credential was accepted';
  END IF;

  blocked := false;
  BEGIN
    INSERT INTO madising.role_bindings
      (account_id,role,state,credential_state)
    VALUES (aid,'PHA','ACTIVE','VERIFIED');
  EXCEPTION WHEN check_violation THEN
    blocked := true;
  END;
  IF NOT blocked THEN
    RAISE EXCEPTION 'Pharmacy role without tenant was accepted';
  END IF;

  blocked := false;
  BEGIN
    INSERT INTO madising.role_bindings
      (account_id,role,state,credential_state)
    VALUES (aid,'PAT','ACTIVE','NOT_REQUIRED');
  EXCEPTION WHEN unique_violation THEN
    blocked := true;
  END;
  IF NOT blocked THEN
    RAISE EXCEPTION 'Duplicate tenantless role binding was accepted';
  END IF;

  INSERT INTO madising.access_audit
    (actor_id,role_context,action_code,target_kind,target_ref,outcome,correlation_id)
  VALUES (aid,'PAT','session.read','ACCOUNT',aid,'ALLOWED',gen_random_uuid())
  RETURNING id INTO auditid;

  blocked := false;
  BEGIN
    UPDATE madising.access_audit SET outcome='DENIED' WHERE id=auditid;
  EXCEPTION WHEN OTHERS THEN
    blocked := true;
  END;
  IF NOT blocked THEN
    RAISE EXCEPTION 'Audit event was modifiable';
  END IF;

  blocked := false;
  BEGIN
    DELETE FROM madising.access_audit WHERE id=auditid;
  EXCEPTION WHEN OTHERS THEN
    blocked := true;
  END;
  IF NOT blocked THEN
    RAISE EXCEPTION 'Audit event was deletable';
  END IF;
END;
$$;

ROLLBACK;
