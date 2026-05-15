// Teste isolado: Deno fetch consegue chamar a API do FP?
const JWT = Deno.env.get('FORTEPLUS_JWT_OVERRIDE')!;

const url = 'https://api.forteplus.com.br/api/v1/parceiros/?ps_categoria__icontains=CLI&page=1&limit=5';

console.log('[test] start', new Date().toISOString());
const t0 = Date.now();

try {
  const res = await fetch(url, {
    headers: {
      Authorization: JWT,
      Accept: 'application/json',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      Origin: 'https://app.forteplus.com.br',
      Referer: 'https://app.forteplus.com.br/',
    },
    signal: AbortSignal.timeout(15_000),
  });
  console.log(`[test] status=${res.status}  in ${Date.now() - t0}ms`);
  const body = await res.text();
  console.log(`[test] body length=${body.length}  preview="${body.slice(0, 200)}"`);
} catch (e) {
  console.error(`[test] error after ${Date.now() - t0}ms:`, e instanceof Error ? e.message : e);
  Deno.exit(1);
}
