// supabase/functions/sync-forteplus/modules/parceiros.ts
//
// Sincroniza /api/v1/parceiros/?ps_categoria__icontains=CLI → forteplus.parceiros
// Filtra apenas Clientes (categoria "CLI"). Fornecedores/Vendedores ficam para depois.

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { ForteplusClient } from '../../_shared/forteplus-client.ts';
import type { SyncResult } from './produtos.ts';

const RECURSO = 'parceiros';
const WATERMARK_INICIAL = '2025-05-12';

interface FPParceiro {
  id: number;
  ps_razao_social?: string;
  ps_nome?: string;       // FP usa ps_nome em vez de ps_razao_social em alguns registros
  ps_nome_fantasia?: string;
  ps_categoria?: string;
  ps_cnpj_cpf?: string;
  ps_cpf_cnpj?: string;   // FP usa ps_cpf_cnpj
  ps_cidade?: string;
  ps_municipio?: string;  // FP usa ps_municipio
  ps_uf?: string;
  ps_vendedor?: number | { id: number } | null;  // pode vir nested
  ps_segmento?: string;
  data_ultima_alteracao?: string;
  hora_ultima_alteracao?: string;
  [k: string]: unknown;
}

/** Normaliza FK: aceita number | {id} | null. Retorna number ou null. */
function fkId(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return v;
  if (typeof v === 'object' && 'id' in (v as object)) {
    const id = (v as { id: unknown }).id;
    return typeof id === 'number' ? id : null;
  }
  return null;
}

export async function syncParceiros(
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
    console.log(`[parceiros] log id=${logId} watermark=${watermarkAnterior} — chamando FP`);
    const items = await fp.getAllPages<FPParceiro>('/parceiros/', {
      ps_categoria__icontains: 'CLI',
      data_ultima_alteracao__gte: watermarkAnterior,
    });
    console.log(`[parceiros] FP retornou ${items.length} itens, iniciando upsert`);

    let upsertados = 0;
    let watermarkNovo = watermarkAnterior;

    for (const p of items) {
      const { error: upErr } = await db
        .schema('forteplus')
        .from('parceiros')
        .upsert(
          {
            forteplus_id: p.id,
            ps_razao_social: p.ps_razao_social ?? p.ps_nome ?? null,
            ps_nome_fantasia: p.ps_nome_fantasia ?? null,
            ps_categoria: p.ps_categoria ?? null,
            ps_cnpj_cpf: p.ps_cnpj_cpf ?? p.ps_cpf_cnpj ?? null,
            ps_cidade: p.ps_cidade ?? p.ps_municipio ?? null,
            ps_uf: p.ps_uf ?? null,
            ps_vendedor: fkId(p.ps_vendedor),
            ps_segmento: p.ps_segmento ?? null,
            data_ultima_alteracao: p.data_ultima_alteracao ?? null,
            hora_ultima_alteracao: p.hora_ultima_alteracao ?? null,
            raw_json: p,
            synced_at: new Date().toISOString(),
          },
          { onConflict: 'forteplus_id' }
        );

      if (upErr) {
        console.error(`[parceiros] upsert falhou id=${p.id}: ${upErr.message}`);
        continue;
      }
      upsertados++;
      if (p.data_ultima_alteracao && p.data_ultima_alteracao > watermarkNovo) {
        watermarkNovo = p.data_ultima_alteracao;
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
