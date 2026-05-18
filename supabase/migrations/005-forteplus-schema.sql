-- ============================================================================
-- Migration 005 — Schema forteplus.* para espelhar dados da API Forteplus
-- ============================================================================
-- Aplicar manualmente via SQL Editor do Supabase (mesmo padrão das 001-004b).
-- Idempotente: usa IF NOT EXISTS em tudo.
--
-- Escopo: read-only mirror. Atlas NUNCA escreve de volta no Forteplus.
-- Os dados aqui vêm da Edge Function `sync-forteplus` (upsert por forteplus_id).
--
-- Por que schema separado: deixa explícito o que veio do FP vs o que veio
-- dos forms do app. Facilita policies RLS futuras (read-only para todos).
-- ============================================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS forteplus;
COMMENT ON SCHEMA forteplus IS 'Espelho read-only de dados da API Forteplus (sync via Edge Function)';

-- ----------------------------------------------------------------------------
-- sync_log — registro de cada execução da sync, por recurso
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS forteplus.sync_log (
  id                    BIGSERIAL PRIMARY KEY,
  recurso               VARCHAR(50) NOT NULL,
  iniciado_em           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  concluido_em          TIMESTAMPTZ,
  status                VARCHAR(20) NOT NULL DEFAULT 'rodando'
                          CHECK (status IN ('rodando','sucesso','erro')),
  registros_lidos       INTEGER DEFAULT 0,
  registros_upsertados  INTEGER DEFAULT 0,
  watermark_anterior    DATE,
  watermark_novo        DATE,
  erro                  TEXT
);

CREATE INDEX IF NOT EXISTS idx_sync_log_recurso_iniciado
  ON forteplus.sync_log (recurso, iniciado_em DESC);

COMMENT ON TABLE forteplus.sync_log IS 'Auditoria das execuções de sync. 1 linha por recurso por execução.';
COMMENT ON COLUMN forteplus.sync_log.watermark_novo IS 'Maior data_ultima_alteracao processada nesta execução. Vira watermark_anterior na próxima.';

-- ----------------------------------------------------------------------------
-- produtos — espelho de /api/v1/produtos/
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS forteplus.produtos (
  forteplus_id            INTEGER PRIMARY KEY,
  pr_codigo               VARCHAR(50),
  pr_descricao            VARCHAR(255),
  pr_tipo                 VARCHAR(10),
  pr_grupo                VARCHAR(100),
  pr_sub_grupo            VARCHAR(100),
  pr_fabricante           VARCHAR(100),
  pr_marca                VARCHAR(100),
  ativo                   BOOLEAN DEFAULT true,
  saldo_estoque           NUMERIC(14,3),
  data_ultima_alteracao   DATE,
  hora_ultima_alteracao   TIME,
  raw_json                JSONB NOT NULL,
  synced_at               TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fp_produtos_codigo ON forteplus.produtos (pr_codigo);
CREATE INDEX IF NOT EXISTS idx_fp_produtos_tipo   ON forteplus.produtos (pr_tipo);
CREATE INDEX IF NOT EXISTS idx_fp_produtos_ult_alt ON forteplus.produtos (data_ultima_alteracao DESC);

COMMENT ON TABLE forteplus.produtos IS 'Espelho de /api/v1/produtos/ — filtrado por pr_tipo IN (PA, MP).';
COMMENT ON COLUMN forteplus.produtos.raw_json IS 'Payload completo da API para análises futuras sem re-sync.';

-- ----------------------------------------------------------------------------
-- parceiros — espelho de /api/v1/parceiros/?ps_categoria__icontains=CLI
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS forteplus.parceiros (
  forteplus_id            INTEGER PRIMARY KEY,
  ps_razao_social         VARCHAR(255),
  ps_nome_fantasia        VARCHAR(255),
  ps_categoria            VARCHAR(50),
  ps_cnpj_cpf             VARCHAR(20),
  ps_cidade               VARCHAR(100),
  ps_uf                   VARCHAR(2),
  ps_vendedor             INTEGER,
  ps_segmento             VARCHAR(100),
  data_ultima_alteracao   DATE,
  hora_ultima_alteracao   TIME,
  raw_json                JSONB NOT NULL,
  synced_at               TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fp_parceiros_categoria ON forteplus.parceiros (ps_categoria);
CREATE INDEX IF NOT EXISTS idx_fp_parceiros_cnpj_cpf  ON forteplus.parceiros (ps_cnpj_cpf);
CREATE INDEX IF NOT EXISTS idx_fp_parceiros_ult_alt   ON forteplus.parceiros (data_ultima_alteracao DESC);

COMMENT ON TABLE forteplus.parceiros IS 'Espelho de /api/v1/parceiros/ — filtrado por ps_categoria__icontains=CLI.';

-- ----------------------------------------------------------------------------
-- movimentos_saida — espelho de /api/v1/movimentos_saida/ (Vendas)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS forteplus.movimentos_saida (
  forteplus_id            INTEGER PRIMARY KEY,
  mv_pessoa               INTEGER,    -- FK lógica para forteplus.parceiros.forteplus_id
  mv_documento            VARCHAR(50),
  mv_serie                VARCHAR(20),
  mv_modelo               VARCHAR(20),
  mv_dma_emissao          DATE,       -- data emissão (formato "dma" no Forteplus)
  mv_hora_emissao         TIME,
  mv_dma_entrada          DATE,
  mv_dma_entrega          DATE,
  mv_tipo_movimento       VARCHAR(50),
  mv_tipo_cliente         VARCHAR(50),
  pago                    BOOLEAN,
  data_ultima_alteracao   DATE,
  hora_ultima_alteracao   TIME,
  raw_json                JSONB NOT NULL,
  synced_at               TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fp_movs_saida_emissao   ON forteplus.movimentos_saida (mv_dma_emissao DESC);
CREATE INDEX IF NOT EXISTS idx_fp_movs_saida_pessoa    ON forteplus.movimentos_saida (mv_pessoa);
CREATE INDEX IF NOT EXISTS idx_fp_movs_saida_ult_alt   ON forteplus.movimentos_saida (data_ultima_alteracao DESC);

COMMENT ON TABLE forteplus.movimentos_saida IS 'Espelho de /api/v1/movimentos_saida/ — Vendas/NF emitidas.';
COMMENT ON COLUMN forteplus.movimentos_saida.mv_pessoa IS 'FK lógica (sem CONSTRAINT) para forteplus.parceiros.forteplus_id — sync independente.';

-- ----------------------------------------------------------------------------
-- GRANTs — Supabase não concede privilégios automaticamente em schemas custom
-- ----------------------------------------------------------------------------
-- service_role: Edge Functions/sync (write+read full)
-- authenticated + anon: leitura (Cowork analista usa anon key no front)
GRANT USAGE ON SCHEMA forteplus TO postgres, anon, authenticated, service_role;

GRANT SELECT ON ALL TABLES IN SCHEMA forteplus TO anon, authenticated;
GRANT ALL    ON ALL TABLES IN SCHEMA forteplus TO postgres, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA forteplus TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA forteplus TO postgres, service_role;

-- Default privileges para tabelas/sequences criadas futuramente nesse schema
ALTER DEFAULT PRIVILEGES IN SCHEMA forteplus
  GRANT SELECT ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA forteplus
  GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA forteplus
  GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA forteplus
  GRANT ALL ON SEQUENCES TO postgres, service_role;

COMMIT;

-- ============================================================================
-- Validação pós-aplicação (rodar manualmente para conferir)
-- ============================================================================
-- SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'forteplus';
-- → deve listar: sync_log, produtos, parceiros, movimentos_saida
