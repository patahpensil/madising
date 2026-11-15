-- Execute as the dedicated migration owner on the isolated madising_trial database.
-- The database administrator must create madising_runtime as a non-owner login without elevated attributes.
DO $$
BEGIN
 IF current_database() <> 'madising_trial' THEN RAISE EXCEPTION 'Wrong database'; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='madising_runtime' AND rolcanlogin AND NOT rolsuper AND NOT rolcreatedb AND NOT rolcreaterole AND NOT rolreplication AND NOT rolbypassrls) THEN RAISE EXCEPTION 'Restricted runtime role required'; END IF;
 IF pg_has_role('madising_runtime', current_user, 'MEMBER') THEN RAISE EXCEPTION 'Runtime must not inherit migration-owner privileges'; END IF;
END $$;
REVOKE ALL ON SCHEMA madising_trial FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA madising_trial FROM PUBLIC;
GRANT USAGE ON SCHEMA madising_trial TO madising_runtime;
GRANT SELECT,INSERT,UPDATE,DELETE ON madising_trial.sessions,madising_trial.accounts,madising_trial.account_sessions TO madising_runtime;
