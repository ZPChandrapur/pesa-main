
/*
  # Schedule Daily Aarakhada Sync via pg_cron

  Creates a daily cron job that runs pesa.sync_aarakhada_all() every night at 1:00 AM UTC.
  This keeps all 6 aarakhada aggregation tables in sync with the pesa.works source of truth.

  ## Cron Job
  - Name: sync-aarakhada-daily
  - Schedule: 0 1 * * * (every day at 01:00 UTC)
  - Command: SELECT pesa.sync_aarakhada_all()

  ## Notes
  - If a job with this name already exists, it is unscheduled first to avoid duplicates
  - pg_cron is already enabled on this project
*/

DO $$
BEGIN
  -- Remove existing job if present (idempotent)
  PERFORM cron.unschedule('sync-aarakhada-daily');
EXCEPTION WHEN others THEN
  NULL; -- Job didn't exist, that's fine
END $$;

SELECT cron.schedule(
  'sync-aarakhada-daily',
  '0 1 * * *',
  'SELECT pesa.sync_aarakhada_all()'
);
