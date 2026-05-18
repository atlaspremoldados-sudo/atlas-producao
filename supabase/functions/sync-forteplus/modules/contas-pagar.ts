// supabase/functions/sync-forteplus/modules/contas-pagar.ts
//
// Sincroniza /api/v1/financas_pagar/ → forteplus.contas_pagar
//
// ✅ Endpoint + field names confirmados em 18/05/2026 via fields-discovery.ts.
// Mesmo schema de campos que financas_receber (prefixo `fn_*` compartilhado).

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { ForteplusClient } from '../../_shared/forteplus-client.ts';
import { fkId } from '../../_shared/fk-helper.ts';
import type { SyncResult } from './produtos.ts';

const RECURSO = 'contas_pagar';
const WATERMARK_INICIAL = '2025-05-12';
const ENDPOINT = '/financas_pagar/';

interface FPFinanca {
  id: number;
  fn_pessoa?: number | { id: number };
  fn_natureza?: number | { id: number };
  fn_centro_custo?: number | { id: number };
  fn_doc_origem?: string | number;
  fn_tipo_doc_origem?: string;
  fn_documento?: string;
  fn_serie?: string;
  fn_modelo?: string;
  fn_dma_emissao?: string;
  fn_dma_vencimento?: string;
  fn_dma_ultimo_pagamento?: string;
  fn_valor?: number | string;
  fn_total_pago?: number | string;
  fn_total_pago_juros?: number | string;
  fn_saldo?: number | string;
  fn_situacao?: number | string;
  fn_tipo_financa?: string;
  fn_entidade?: string;
  fn_observacao?: string;
  fn_forma_pagamento?: string;
  data_ultima_alteracao?: string;
  hora_ultima_alteracao?: string;
  [k: string]: unknown;
}

function pickNum(...vs: (number | string | undefined | null)[]) {
  for (const v of vs) {
    if (v == null) continue;
    if (typeof v === 'number') return v;
    if (typeof v === 'string' && v !== '') {
      const n = Number(v);
      if (!Number.isNaN(n)) return n;
    }
  }
  return null;
}

export async function syncContasPagar(
  fp: ForteplusClient,
  db: SupabaseClient
): Promise<SyncResult> {
  const { data: ultimoLog } = await db
    .schema('forteplus')
    .from('sync_log')
    .select('watermark_novo')
    .eq('recurso', RECURSO)
    .eq('status', 'sucesso')
    .order('iniciado_em', { ascending: false })
    .limit(1)
    .maybeSingle();

  const watermarkAnterior = ultimoLog?.watermark_novo ?? WATERMARK_INICIAL;

  const { data: logRow, error: logErr } = await db
    .schema('forteplus')
    .from('sync_log')
    .insert({
      recurso: RECURSO,
      status: 'rodando',
      watermark_anterior: watermarkAnterior,
    })
    .select('id')
    .single();

  if (logErr || !logRow) throw new Error(`sync_log insert falhou: ${logErr?.message}`);
  const logId = logRow.id;

  try {
    const items = await fp.getAllPages<FPFinanca>(ENDPOINT, {
      data_ultima_alteracao__gte: watermarkAnterior,
    });

    let upsertados = 0;
    let watermarkNovo = watermarkAnterior;

    for (const c of items) {
      const { error: upErr } = await db
        .schema('forteplus')
        .from('contas_pagar')
        .upsert(
          {
            forteplus_id: c.id,
            parceiro_forteplus_id: fkId(c.fn_pessoa),
            numero_documento: c.fn_documento ?? null,
            data_emissao: c.fn_dma_emissao ?? null,
            data_vencimento: c.fn_dma_vencimento ?? null,
            data_pagamento: c.fn_dma_ultimo_pagamento ?? null,
            valor_titulo: pickNum(c.fn_valor),
            valor_pago: pickNum(c.fn_total_pago),
            valor_saldo: pickNum(c.fn_saldo),
            status: c.fn_situacao != null ? String(c.fn_situacao) : null,
            observacao: c.fn_observacao ?? null,
            data_ultima_alteracao: c.data_ultima_alteracao ?? null,
            hora_ultima_alteracao: c.hora_ultima_alteracao ?? null,
            raw_json: c,
            synced_at: new Date().toISOString(),
          },
          { onConflict: 'forteplus_id' }
        );

      if (upErr) {
        console.error(`[contas_pagar] upsert falhou id=${c.id}: ${upErr.message}`);
        continue;
      }
      upsertados++;
      if (c.data_ultima_alteracao && c.data_ultima_alteracao > watermarkNovo) {
        watermarkNovo = c.data_ultima_alteracao;
      }
    }

    await db
      .schema('forteplus')
      .from('sync_log')
      .update({
        status: 'sucesso',
        registros_lidos: items.length,
        registros_upsertados: upsertados,
        watermark_novo: watermarkNovo,
        concluido_em: new Date().toISOString(),
      })
      .eq('id', logId);

    return {
      lidos: items.length,
      upsertados,
      watermark_anterior: watermarkAnterior,
      watermark_novo: watermarkNovo,
    };
  } catch (err) {
    await db
      .schema('forteplus')
      .from('sync_log')
      .update({
        status: 'erro',
        erro: String(err),
        concluido_em: new Date().toISOString(),
      })
      .eq('id', logId);
    throw err;
  }
}
