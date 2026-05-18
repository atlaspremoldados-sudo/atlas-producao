-- ============================================================================
-- Migration 007 — pg_cron schedule para sync-forteplus diário
-- ============================================================================
-- Agenda a Edge Function `sync-forteplus` para rodar todo dia às 06:00 BRT
-- (09:00 UTC). Volume típico (~5-50 records/dia) cabe no timeout de 50s do
-- plano Free.
--
-- ⚠️ APLICAÇÃO MANUAL: substitua o placeholder <SERVICE_ROLE_KEY_HERE> pela
-- key real (Settings → API Keys → Legacy → service_role → Reveal) e rode no
-- SQL Editor. A migration não é idempotente para `vault.create_secret`, mas
-- guarda check `IF NOT EXISTS` para evitar duplicação ao re-aplicar.
--
-- Status em prod: ✅ aplicada em 18/05/2026 — `jobid=1` ativo.
-- ============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 1. Guarda service_role no Vault (criptografado em repouso)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'sync_forteplus_auth') THEN
    PERFORM vault.create_secret(
      '<SERVICE_ROLE_KEY_HERE>',  -- ← substituir antes de rodar
      'sync_forteplus_auth',
      'Bearer auth para o cron job sync-forteplus'
    );
  END IF;
END $$;

-- 2. Remove agendamento anterior (se houver) para idempotência
SELECT cron.unschedule('sync-forteplus-diario')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync-forteplus-diario');

-- 3. Agenda o cron
SELECT cron.schedule(
  'sync-forteplus-diario',
  '0 9 * * *',  -- 09:00 UTC = 06:00 BRT (Brasil é UTC-3)
  $cron$
    SELECT net.http_post(
      url := 'https://whojujjnpaklidkfkpbj.supabase.co/functions/v1/sync-forteplus',
      headers := jsonb_build_object(
        'Authorization',
          'Bearer ' || (
            SELECT decrypted_secret
            FROM vault.decrypted_secrets
            WHERE name = 'sync_forteplus_auth'
            LIMIT 1
          ),
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 55000
    );
  $cron$
);

COMMIT;

-- ============================================================================
-- Validação:
-- SELECT jobid, schedule, jobname FROM cron.job WHERE jobname = 'sync-forteplus-diario';
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;
-- ============================================================================
