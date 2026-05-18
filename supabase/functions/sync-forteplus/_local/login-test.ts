// Teste isolado de login programático.
// Não expõe credenciais — só reporta status e shape da response.

const EMAIL = Deno.env.get('FORTEPLUS_EMAIL')!;
const PASSWORD = Deno.env.get('FORTEPLUS_PASSWORD')!;
const SUB_ID = Number(Deno.env.get('FORTEPLUS_SUBSCRIPTION_ID') ?? '181');

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Origin: 'https://app.forteplus.com.br',
  Referer: 'https://app.forteplus.com.br/',
};

// URLs candidatas para login (em ordem de probabilidade)
const LOGIN_CANDIDATES = [
  'https://accounts.forteplus.com.br/api/auth/login/',
  'https://accounts.forteplus.com.br/api/v1/login/',
  'https://accounts.forteplus.com.br/api/login/',
  'https://app.forteplus.com.br/api/auth/login/',
  'https://api.forteplus.com.br/api/auth/login/',
  'https://api.forteplus.com.br/api/v1/auth/login/',
  'https://api.forteplus.com.br/api/v1/login/',
  'https://assinaturas.forteplus.com.br/api/v1/jwt/login/',
  'https://assinaturas.forteplus.com.br/api/v1/jwt/create/',
];

console.log(`Testando ${LOGIN_CANDIDATES.length} candidatos de URL de login...`);
console.log(`Email: ${EMAIL.slice(0, 3)}***${EMAIL.slice(EMAIL.indexOf('@'))}`);
console.log();

let workingUrl: string | null = null;
let loginResponse: { access?: string; refresh?: string } | null = null;

for (const url of LOGIN_CANDIDATES) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...BROWSER_HEADERS },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
      signal: AbortSignal.timeout(10_000),
    });
    const ct = res.headers.get('content-type') ?? '';
    const isJson = ct.includes('application/json');
    let bodyKeys = '';
    if (isJson) {
      const j = await res.json().catch(() => null);
      if (j && typeof j === 'object') {
        bodyKeys = Object.keys(j as Record<string, unknown>).join(',');
        if ((j as Record<string, unknown>).access) {
          workingUrl = url;
          loginResponse = j as { access?: string; refresh?: string };
        }
      }
    } else {
      bodyKeys = `(html ${(await res.text()).length}b)`;
    }
    console.log(`  ${res.status}  keys=${bodyKeys}  ${url}`);
  } catch (e) {
    console.log(`  ERR  ${e instanceof Error ? e.message : e}  ${url}`);
  }
}

console.log();
if (workingUrl) {
  console.log(`✅ Login funcionou: ${workingUrl}`);
  console.log(`Keys retornadas: ${Object.keys(loginResponse!).join(', ')}`);
  console.log(`Access token: ${loginResponse!.access?.slice(0, 30)}...`);

  // Tenta também o /jwt/assign/
  console.log();
  console.log('Testando /jwt/assign/...');
  const assignRes = await fetch('https://assinaturas.forteplus.com.br/api/v1/jwt/assign/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: loginResponse!.access!, // SEM "Bearer "
      ...BROWSER_HEADERS,
    },
    body: JSON.stringify({ assinatura: SUB_ID }),
    signal: AbortSignal.timeout(10_000),
  });
  console.log(`Status: ${assignRes.status}`);
  if (assignRes.ok) {
    const j = (await assignRes.json()) as Record<string, unknown>;
    console.log(`✅ Assign retornou. Keys: ${Object.keys(j).join(', ')}`);
    for (const [k, v] of Object.entries(j)) {
      const preview = typeof v === 'string' ? v.slice(0, 50) + '...' : JSON.stringify(v).slice(0, 80);
      console.log(`  ${k}: ${preview}`);
    }
  } else {
    console.log(`❌ Assign falhou. Body: ${(await assignRes.text()).slice(0, 200)}`);
  }
} else {
  console.log('❌ Nenhum candidato de login funcionou.');
  console.log('Próximo passo: workaround via JWT_OVERRIDE (já temos esse fluxo funcionando).');
}
