// supabase/functions/sync-forteplus/modules/vendas.ts
//
// Sincroniza /api/v1/movimentos_saida/ → forteplus.movimentos_saida
// Esses são os "movimentos de saída" no Forteplus = NF emitidas / Vendas.

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { ForteplusClient } from '../../_shared/forteplus-client.ts';
import { fkId } from '../../_shared/fk-helper.ts';
import type { SyncResult } from './produtos.ts';

/** FP retorna `pago` como 'S'/'N' (string). Schema espera BOOLEAN. */
function siNToBool(v: unknown): boolean | null {
  if (v == null) return null;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') {
    if (v === 'S' || v === 's' || v === '1' || v.toLowerCase() === 'true') return true;
    if (v === 'N' || v === 'n' || v === '0' || v.toLowerCase() === 'false') return false;
  }
  return null;
}

const RECURSO = 'movimentos_saida';
const WATERMARK_INICIAL = '2025-05-12'; // 12 meses atrás de 2026-05-12

interface FPMovimentoSaida {
  id: number;
  mv_pessoa?: number | { id: number } | null;       // pode vir nested (full parceiro)
  mv_documento?: string;
  mv_serie?: string;
  mv_modelo?: string;
  mv_dma_emissao?: string;
  mv_hora_emissao?: string;
  mv_dma_entrada?: string;
  mv_dma_entrega?: string;
  mv_tipo_movimento?: string;
  mv_tipo_cliente?: string;
  pago?: boolean | string;                           // FP retorna 'S'/'N'
  data_ultima_alteracao?: string;
  hora_ultima_alteracao?: string;
  [k: string]: unknown;
}

export async function syncVendas(
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
    const items = await fp.getAllPages<FPMovimentoSaida>('/movimentos_saida/', {
      data_ultima_alteracao__gte: watermarkAnterior,
    });

    let upsertados = 0;
    let watermarkNovo = watermarkAnterior;

    for (const m of items) {
      const { error: upErr } = await db
        .schema('forteplus')
        .from('movimentos_saida')
        .upsert(
          {
            forteplus_id: m.id,
            mv_pessoa: fkId(m.mv_pessoa),
            mv_documento: m.mv_documento ?? null,
            mv_serie: m.mv_serie ?? null,
            mv_modelo: m.mv_modelo ?? null,
            mv_dma_emissao: m.mv_dma_emissao ?? null,
            mv_hora_emissao: m.mv_hora_emissao ?? null,
            mv_dma_entrada: m.mv_dma_entrada ?? null,
            mv_dma_entrega: m.mv_dma_entrega ?? null,
            mv_tipo_movimento: m.mv_tipo_movimento ?? null,
            mv_tipo_cliente: m.mv_tipo_cliente ?? null,
            pago: siNToBool(m.pago),
            data_ultima_alteracao: m.data_ultima_alteracao ?? null,
            hora_ultima_alteracao: m.hora_ultima_alteracao ?? null,
            raw_json: m,
            synced_at: new Date().toISOString(),
          },
          { onConflict: 'forteplus_id' }
        );

      if (upErr) {
        console.error(`[vendas] upsert falhou id=${m.id}: ${upErr.message}`);
        continue;
      }
      upsertados++;
      if (m.data_ultima_alteracao && m.data_ultima_alteracao > watermarkNovo) {
        watermarkNovo = m.data_ultima_alteracao;
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
