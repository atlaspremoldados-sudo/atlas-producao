// Descoberta de field names — login programático + 1 request em cada endpoint novo.
// Não escreve no DB. Só inspeciona o shape do payload.

import { ForteplusClient } from '../../_shared/forteplus-client.ts';

const fp = new ForteplusClient({
  email: Deno.env.get('FORTEPLUS_EMAIL')!,
  password: Deno.env.get('FORTEPLUS_PASSWORD')!,
  subscriptionId: Number(Deno.env.get('FORTEPLUS_SUBSCRIPTION_ID')!),
  // intencionalmente NÃO uso JWT_OVERRIDE — quero validar login programático
});

const ENDPOINTS = [
  '/financas_receber/',
  '/financas_pagar/',
  '/movimentos_saida/',
  '/movimentos_saida_itens/',
];

for (const path of ENDPOINTS) {
  console.log(`\n=== ${path} ===`);
  try {
    const r = await fp.get<{ count: number; results: Record<string, unknown>[] }>(
      path,
      { limit: 1 }
    );
    console.log(`count: ${r.count}`);
    if (r.results?.length) {
      const first = r.results[0];
      const keys = Object.keys(first).sort();
      console.log(`fields (${keys.length}):`);
      // Agrupa por prefixo
      const byPrefix: Record<string, string[]> = {};
      for (const k of keys) {
        const prefix = k.includes('_') ? k.split('_')[0] : '(no-prefix)';
        byPrefix[prefix] = byPrefix[prefix] ?? [];
        byPrefix[prefix].push(k);
      }
      for (const [pfx, fields] of Object.entries(byPrefix)) {
        console.log(`  [${pfx}] ${fields.join(', ')}`);
      }
      // Sample de valores (só campos curtos)
      console.log('sample values (campos não-nulos, max 80 chars):');
      for (const [k, v] of Object.entries(first)) {
        if (v == null) continue;
        const s = typeof v === 'string' ? v : JSON.stringify(v);
        if (s.length < 80) console.log(`  ${k}: ${s}`);
      }
    } else {
      console.log('(sem registros)');
    }
  } catch (e) {
    console.error(`ERR: ${e instanceof Error ? e.message : e}`);
  }
}
