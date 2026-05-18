-- ============================================================================
-- Migration 006 — Complementa schema forteplus.* com tabelas de:
--   • tokens                  — refresh tokens persistidos
--   • movimentos_saida_itens  — itens de cada NF/venda
--   • contas_receber          — fluxo de caixa entrante
--   • contas_pagar            — fluxo de caixa sainte
--
-- Idempotente: IF NOT EXISTS em tudo. Aplica em cima da 005-forteplus-schema.
--
-- ⚠️ Os endpoints /contas_receber/ e /contas_pagar/ da API Forteplus ainda
-- são "caminho a confirmar" (per descobertas-api-2026-05-12.md). Schemas
-- aqui são chutados a partir de campos esperados; quando o primeiro sync
-- rodar, ajustar colunas dedicadas conforme payload real (raw_json já cobre
-- enquanto isso).
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- tokens — persistência de refresh_token para renovar JWT sem re-login
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS forteplus.tokens (
  user_id        INTEGER PRIMARY KEY,
  email          VARCHAR(150),
  refresh_token  TEXT NOT NULL,
  access_token   TEXT,
  expires_at     TIMESTAMPTZ NOT NULL,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE forteplus.tokens IS 'Refresh tokens persistidos por usuário. Edge Function lê/atualiza para evitar re-login a cada execução.';

-- ----------------------------------------------------------------------------
-- movimentos_saida_itens — espelho dos itens de cada NF
-- ----------------------------------------------------------------------------
-- Endpoint provável: /movimentos_saida/{id}/itens/ ou /movimentos_saida_itens/
-- (a confirmar quando rodar o sync de vendas pela 1ª vez)
CREATE TABLE IF NOT EXISTS forteplus.movimentos_saida_itens (
  forteplus_id              INTEGER PRIMARY KEY,
  movimento_forteplus_id    INTEGER NOT NULL,    -- FK lógica → forteplus.movimentos_saida.forteplus_id
  produto_forteplus_id      INTEGER,             -- FK lógica → forteplus.produtos.forteplus_id
  produto_codigo            VARCHAR(50),
  produto_descricao         VARCHAR(255),
  quantidade                NUMERIC(14,3),
  valor_unitario            NUMERIC(14,4),
  valor_total               NUMERIC(14,2),
  valor_desconto            NUMERIC(12,2),
  raw_json                  JSONB NOT NULL,
  synced_at                 TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fp_movs_saida_itens_movimento
  ON forteplus.movimentos_saida_itens (movimento_forteplus_id);
CREATE INDEX IF NOT EXISTS idx_fp_movs_saida_itens_produto
  ON forteplus.movimentos_saida_itens (produto_forteplus_id);
CREATE INDEX IF NOT EXISTS idx_fp_movs_saida_itens_codigo
  ON forteplus.movimentos_saida_itens (produto_codigo);

COMMENT ON TABLE forteplus.movimentos_saida_itens IS 'Itens de NF emitida. JOIN com produtos para análise comercial (qtd vendida × produto).';
COMMENT ON COLUMN forteplus.movimentos_saida_itens.movimento_forteplus_id IS 'FK lógica para forteplus.movimentos_saida.forteplus_id (sem CONSTRAINT — sync independente).';

-- ----------------------------------------------------------------------------
-- contas_receber — fluxo de caixa entrante
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS forteplus.contas_receber (
  forteplus_id              INTEGER PRIMARY KEY,
  parceiro_forteplus_id     INTEGER,                       -- FK lógica → forteplus.parceiros
  movimento_forteplus_id    INTEGER,                       -- FK lógica → forteplus.movimentos_saida (se NF origem)
  numero_documento          VARCHAR(50),
  data_emissao              DATE,
  data_vencimento           DATE,
  data_pagamento            DATE,                          -- null se em aberto
  valor_titulo              NUMERIC(14,2),
  valor_pago                NUMERIC(14,2),
  valor_saldo               NUMERIC(14,2),                 -- = titulo - pago
  status                    VARCHAR(30),                   -- 'aberto', 'pago', 'parcial', 'cancelado'…
  observacao                TEXT,
  data_ultima_alteracao     DATE,
  hora_ultima_alteracao     TIME,
  raw_json                  JSONB NOT NULL,
  synced_at                 TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fp_cr_parceiro     ON forteplus.contas_receber (parceiro_forteplus_id);
CREATE INDEX IF NOT EXISTS idx_fp_cr_vencimento   ON forteplus.contas_receber (data_vencimento);
CREATE INDEX IF NOT EXISTS idx_fp_cr_status       ON forteplus.contas_receber (status);
CREATE INDEX IF NOT EXISTS idx_fp_cr_ult_alt      ON forteplus.contas_receber (data_ultima_alteracao DESC);

COMMENT ON TABLE forteplus.contas_receber IS 'Espelho de /api/v1/contas_receber/ — projeção de fluxo de caixa entrante.';

-- ----------------------------------------------------------------------------
-- contas_pagar — fluxo de caixa sainte
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS forteplus.contas_pagar (
  forteplus_id              INTEGER PRIMARY KEY,
  parceiro_forteplus_id     INTEGER,                       -- FK lógica → forteplus.parceiros (fornecedor)
  numero_documento          VARCHAR(50),
  data_emissao              DATE,
  data_vencimento           DATE,
  data_pagamento            DATE,
  valor_titulo              NUMERIC(14,2),
  valor_pago                NUMERIC(14,2),
  valor_saldo               NUMERIC(14,2),
  status                    VARCHAR(30),
  observacao                TEXT,
  data_ultima_alteracao     DATE,
  hora_ultima_alteracao     TIME,
  raw_json                  JSONB NOT NULL,
  synced_at                 TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fp_cp_parceiro     ON forteplus.contas_pagar (parceiro_forteplus_id);
CREATE INDEX IF NOT EXISTS idx_fp_cp_vencimento   ON forteplus.contas_pagar (data_vencimento);
CREATE INDEX IF NOT EXISTS idx_fp_cp_status       ON forteplus.contas_pagar (status);
CREATE INDEX IF NOT EXISTS idx_fp_cp_ult_alt      ON forteplus.contas_pagar (data_ultima_alteracao DESC);

COMMENT ON TABLE forteplus.contas_pagar IS 'Espelho de /api/v1/contas_pagar/ — projeção de fluxo de caixa sainte.';

-- ----------------------------------------------------------------------------
-- GRANTs para as novas tabelas (default privileges da 005 cobrem,
-- mas explicitar pra ficar idempotente em re-applies)
-- ----------------------------------------------------------------------------
GRANT SELECT ON forteplus.tokens                  TO anon, authenticated;
GRANT ALL    ON forteplus.tokens                  TO postgres, service_role;
GRANT SELECT ON forteplus.movimentos_saida_itens  TO anon, authenticated;
GRANT ALL    ON forteplus.movimentos_saida_itens  TO postgres, service_role;
GRANT SELECT ON forteplus.contas_receber          TO anon, authenticated;
GRANT ALL    ON forteplus.contas_receber          TO postgres, service_role;
GRANT SELECT ON forteplus.contas_pagar            TO anon, authenticated;
GRANT ALL    ON forteplus.contas_pagar            TO postgres, service_role;

COMMIT;

-- ============================================================================
-- Validação pós-aplicação:
-- SELECT tablename FROM pg_tables WHERE schemaname='forteplus' ORDER BY tablename;
-- → deve listar: contas_pagar, contas_receber, movimentos_saida,
--   movimentos_saida_itens, parceiros, produtos, sync_log, tokens (8 total)
-- ============================================================================
