// supabase/functions/sync-forteplus/index.ts
//
// Entry point da Edge Function. Orquestra os módulos de sync.
//
// Body opcional: {"modulos": ["produtos","vendas","parceiros"]}
//   Default: roda os 3.
//
// Env vars (Secrets):
//   FORTEPLUS_EMAIL              email do usuário Forteplus
//   FORTEPLUS_PASSWORD           senha
//   FORTEPLUS_SUBSCRIPTION_ID    181 (Atlas Pre-moldados, já descoberto)
//   FORTEPLUS_JWT_OVERRIDE       (opcional) JWT pronto — pula login+assign.
//                                Usado para validar pipeline antes do endpoint
//                                de login estar confirmado.
//   SUPABASE_URL                 auto-injetado pelo runtime
//   SUPABASE_SERVICE_ROLE_KEY    auto-injetado pelo runtime

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { ForteplusClient } from '../_shared/forteplus-client.ts';
import { getSupabaseAdmin } from '../_shared/supabase-admin.ts';
import { syncProdutos, type SyncResult } from './modules/produtos.ts';
import { syncVendas } from './modules/vendas.ts';
import { syncParceiros } from './modules/parceiros.ts';
import { syncContasReceber } from './modules/contas-receber.ts';
import { syncContasPagar } from './modules/contas-pagar.ts';

type Modulo = 'produtos' | 'vendas' | 'parceiros' | 'contas_receber' | 'contas_pagar';

const SYNCERS: Record<Modulo, typeof syncProdutos> = {
  produtos: syncProdutos,
  vendas: syncVendas,
  parceiros: syncParceiros,
  contas_receber: syncContasReceber,
  contas_pagar: syncContasPagar,
};

interface ModuloResultOk extends SyncResult {
  ok: true;
  duracao_s: number;
}
interface ModuloResultErr {
  ok: false;
  error: string;
  duracao_s: number;
}

serve(async (req) => {
  // Lê body (opcional)
  const body = (await req.json().catch(() => ({}))) as { modulos?: Modulo[] };
  const modulos: Modulo[] =
    body.modulos ?? ['produtos', 'vendas', 'parceiros', 'contas_receber', 'contas_pagar'];

  const jwtOverride = Deno.env.get('FORTEPLUS_JWT_OVERRIDE') ?? undefined;
  const fp = new ForteplusClient({
    email: Deno.env.get('FORTEPLUS_EMAIL') ?? undefined,
    password: Deno.env.get('FORTEPLUS_PASSWORD') ?? undefined,
    subscriptionId: Number(Deno.env.get('FORTEPLUS_SUBSCRIPTION_ID')) || undefined,
    jwtOverride,
  });

  const db = getSupabaseAdmin();
  const results: Record<string, ModuloResultOk | ModuloResultErr> = {};

  for (const modulo of modulos) {
    const inicio = Date.now();
    try {
      if (!SYNCERS[modulo]) {
        results[modulo] = {
          ok: false,
          error: `módulo desconhecido: ${modulo}`,
          duracao_s: 0,
        };
        continue;
      }
      const r = await SYNCERS[modulo](fp, db);
      results[modulo] = { ok: true, ...r, duracao_s: (Date.now() - inicio) / 1000 };
    } catch (e) {
      results[modulo] = {
        ok: false,
        error: e instanceof Error ? e.message : String(e),
        duracao_s: (Date.now() - inicio) / 1000,
      };
    }
  }

  const algumErro = Object.values(results).some((r) => !r.ok);
  return new Response(JSON.stringify({ results }, null, 2), {
    status: algumErro ? 207 : 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
