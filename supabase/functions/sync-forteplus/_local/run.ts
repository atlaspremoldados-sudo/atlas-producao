// supabase/functions/sync-forteplus/_local/run.ts
//
// Runner local — invoca um módulo de sync sem precisar do `supabase functions serve`
// (que exige Docker no Windows). Roda direto no Deno standalone.
//
// Uso:
//   deno run --allow-net --allow-env --allow-read \
//     --env-file=./supabase/.env.local \
//     supabase/functions/sync-forteplus/_local/run.ts <modulo>
//
// Módulos: produtos | vendas | parceiros

import { ForteplusClient } from '../../_shared/forteplus-client.ts';
import { getSupabaseAdmin } from '../../_shared/supabase-admin.ts';
import { syncProdutos } from '../modules/produtos.ts';
import { syncVendas } from '../modules/vendas.ts';
import { syncParceiros } from '../modules/parceiros.ts';

const modulo = Deno.args[0] ?? 'produtos';

const jwtOverride = Deno.env.get('FORTEPLUS_JWT_OVERRIDE');
const fp = new ForteplusClient({
  email: Deno.env.get('FORTEPLUS_EMAIL') ?? undefined,
  password: Deno.env.get('FORTEPLUS_PASSWORD') ?? undefined,
  subscriptionId: Number(Deno.env.get('FORTEPLUS_SUBSCRIPTION_ID')) || undefined,
  jwtOverride: jwtOverride || undefined,
});

const db = getSupabaseAdmin();

console.log(`[run] modulo=${modulo}  auth=${jwtOverride ? 'JWT_OVERRIDE' : 'login+assign'}`);

const inicio = Date.now();

try {
  let result;
  if (modulo === 'produtos') result = await syncProdutos(fp, db);
  else if (modulo === 'vendas') result = await syncVendas(fp, db);
  else if (modulo === 'parceiros') result = await syncParceiros(fp, db);
  else throw new Error(`Módulo desconhecido: ${modulo}. Use: produtos | vendas | parceiros`);

  const duracao = ((Date.now() - inicio) / 1000).toFixed(1);
  console.log(`[run] ok em ${duracao}s`);
  console.log(JSON.stringify(result, null, 2));
} catch (e) {
  const duracao = ((Date.now() - inicio) / 1000).toFixed(1);
  console.error(`[run] erro após ${duracao}s:`);
  console.error(e instanceof Error ? e.message : String(e));
  Deno.exit(1);
}
