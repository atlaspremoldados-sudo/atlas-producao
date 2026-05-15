// supabase/functions/sync-forteplus/modules/produtos.ts
//
// Sincroniza /api/v1/produtos/ filtrado por pr_tipo IN ('PA','MP') → forteplus.produtos
// PA = Produto Acabado · MP = Matéria Prima
//
// Watermark: data_ultima_alteracao (campo confirmado em descobertas-api-2026-05-12).
// Carga inicial usa data fixa (12 meses atrás) se não há sync anterior bem-sucedida.

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { ForteplusClient } from '../../_shared/forteplus-client.ts';

const RECURSO = 'produtos';
const WATERMARK_INICIAL = '2025-05-12'; // 12 meses atrás de 2026-05-12

interface FPProduto {
  id: number;
  pr_codigo?: string;
  pr_descricao?: string;
  pr_tipo?: string;
  pr_grupo?: string;
  pr_sub_grupo?: string;
  pr_fabricante?: string;
  pr_marca?: string;
  ativo?: boolean;
  saldo_estoque?: number | string;
  data_ultima_alteracao?: string;
  hora_ultima_alteracao?: string;
  [k: string]: unknown;
}

export interface SyncResult {
  lidos: number;
  upsertados: number;
  watermark_anterior: string;
  watermark_novo: string;
}

export async function syncProdutos(
  fp: ForteplusClient,
  db: SupabaseClient
): Promise<SyncResult> {
  // 1. Lê watermark da última sync bem-sucedida
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

  // 2. Abre log "rodando"
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
    // 3. Puxa do Forteplus
    // pr_tipo__in=PA,MP é sintaxe django-filter padrão para __in
    const items = await fp.getAllPages<FPProduto>('/produtos/', {
      pr_tipo__in: 'PA,MP',
      data_ultima_alteracao__gte: watermarkAnterior,
    });

    // 4. Upsert em lote
    let upsertados = 0;
    let watermarkNovo = watermarkAnterior;

    for (const p of items) {
      const { error: upErr } = await db
        .schema('forteplus')
        .from('produtos')
        .upsert(
          {
            forteplus_id: p.id,
            pr_codigo: p.pr_codigo ?? null,
            pr_descricao: p.pr_descricao ?? null,
            pr_tipo: p.pr_tipo ?? null,
            pr_grupo: p.pr_grupo ?? null,
            pr_sub_grupo: p.pr_sub_grupo ?? null,
            pr_fabricante: p.pr_fabricante ?? null,
            pr_marca: p.pr_marca ?? null,
            ativo: p.ativo ?? true,
            saldo_estoque: p.saldo_estoque ?? null,
            data_ultima_alteracao: p.data_ultima_alteracao ?? null,
            hora_ultima_alteracao: p.hora_ultima_alteracao ?? null,
            raw_json: p,
            synced_at: new Date().toISOString(),
          },
          { onConflict: 'forteplus_id' }
        );

      if (upErr) {
        console.error(`[produtos] upsert falhou id=${p.id}: ${upErr.message}`);
        continue;
      }
      upsertados++;
      if (p.data_ultima_alteracao && p.data_ultima_alteracao > watermarkNovo) {
        watermarkNovo = p.data_ultima_alteracao;
      }
    }

    // 5. Fecha log "sucesso"
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
