-- Run with an actual restricted login in a disposable CI database.
DO $$
BEGIN
 IF current_database() <> 'madising_trial' OR current_user <> 'madising_runtime' THEN
  RAISE EXCEPTION 'Wrong database or login';
 END IF;
 IF NOT has_schema_privilege(current_user,'madising_trial','USAGE') OR has_schema_privilege(current_user,'madising_trial','CREATE') THEN
  RAISE EXCEPTION 'Unexpected schema privileges';
 END IF;
 IF has_database_privilege(current_user,current_database(),'CREATE') OR has_database_privilege(current_user,current_database(),'TEMP') OR has_database_privilege(current_user,'trial_ci','CONNECT') THEN
  RAISE EXCEPTION 'Unexpected database privileges';
 END IF;
 IF pg_has_role(current_user,'madising_migrator','MEMBER') THEN
  RAISE EXCEPTION 'Runtime inherits migration owner';
 END IF;
 BEGIN
  EXECUTE 'CREATE TABLE madising_trial.forbidden_table (id int)';
  RAISE EXCEPTION 'Runtime unexpectedly created a table';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
 BEGIN
  EXECUTE 'ALTER TABLE madising_trial.sessions ADD COLUMN forbidden_column int';
  RAISE EXCEPTION 'Runtime unexpectedly altered a table';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
 BEGIN
  EXECUTE 'CREATE TEMP TABLE forbidden_temp (id int)';
  RAISE EXCEPTION 'Runtime unexpectedly created a temporary table';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $$;
SELECT count(*) FROM madising_trial.sessions;
SELECT count(*) FROM madising_trial.accounts;
SELECT count(*) FROM madising_trial.account_sessions;
