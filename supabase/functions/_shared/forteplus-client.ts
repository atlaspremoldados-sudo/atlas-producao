// supabase/functions/_shared/forteplus-client.ts
//
// Cliente HTTP do Forteplus.
//
// Fluxo de auth (capturado via DevTools em 12/05/2026):
//   1. POST accounts.forteplus.com.br/api/auth/login/      {email,password} → {access}   ⚠️ URL SUPOSTA
//   2. POST assinaturas.forteplus.com.br/api/v1/jwt/assign/ {assinatura}    → {access}   ✅ confirmado
//   3. GET  api.forteplus.com.br/api/v1/<recurso>/  Authorization: <jwt>                  ✅ confirmado
//
// Pontos críticos:
// - Header Authorization é o JWT PURO, SEM prefixo "Bearer ".
// - JWT vive 1 dia. Renovamos automaticamente quando faltam < 5 min.
// - Para validar o pipeline antes do endpoint de login estar confirmado,
//   defina FORTEPLUS_JWT_OVERRIDE com um JWT copiado manualmente do
//   sessionStorage (__FPS_JWT__) — o cliente pula login+assign.

const ACCOUNTS_URL = 'https://accounts.forteplus.com.br/api/auth';
const ASSINATURAS_URL = 'https://assinaturas.forteplus.com.br/api/v1';
const API_BASE = 'https://api.forteplus.com.br/api/v1';

// Headers que fazem o Cloudflare aceitar a request como sendo de browser.
// Sem User-Agent + Origin + Referer, retorna 403 com JS challenge.
const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Origin: 'https://app.forteplus.com.br',
  Referer: 'https://app.forteplus.com.br/',
};

interface LoginResponse { access: string }
interface AssignResponse { access: string }

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ForteplusClientOptions {
  email?: string;
  password?: string;
  subscriptionId?: number;
  /** JWT pré-existente (ex: copiado do sessionStorage). Quando definido, pula login+assign. */
  jwtOverride?: string;
}

export class ForteplusClient {
  private jwt: string | null = null;
  private jwtExpiresAt = 0;
  private readonly email?: string;
  private readonly password?: string;
  private readonly subscriptionId?: number;
  private readonly jwtOverride?: string;

  constructor(opts: ForteplusClientOptions) {
    this.email = opts.email;
    this.password = opts.password;
    this.subscriptionId = opts.subscriptionId;
    this.jwtOverride = opts.jwtOverride;

    if (!this.jwtOverride && (!this.email || !this.password || !this.subscriptionId)) {
      throw new Error(
        'ForteplusClient: forneça email+password+subscriptionId OU jwtOverride.'
      );
    }
  }

  /** Login → seleção de assinatura → JWT pronto. Idempotente: ok chamar de novo. */
  async authenticate(): Promise<void> {
    if (this.jwtOverride) {
      this.jwt = this.jwtOverride;
      this.jwtExpiresAt = this.parseExp(this.jwtOverride);
      console.log('[forteplus] usando JWT_OVERRIDE (sem login+assign)');
      return;
    }

    // Etapa 1: login
    const loginRes = await fetch(`${ACCOUNTS_URL}/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...BROWSER_HEADERS },
      body: JSON.stringify({ email: this.email, password: this.password }),
    });
    if (!loginRes.ok) {
      throw new Error(
        `Forteplus login falhou ${loginRes.status} em ${ACCOUNTS_URL}/login/: ${await loginRes.text()}`
      );
    }
    const { access: jwtInicial } = (await loginRes.json()) as LoginResponse;

    // Etapa 2: selecionar assinatura
    const assignRes = await fetch(`${ASSINATURAS_URL}/jwt/assign/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: jwtInicial, // SEM "Bearer "
        ...BROWSER_HEADERS,
      },
      body: JSON.stringify({ assinatura: this.subscriptionId }),
    });
    if (!assignRes.ok) {
      throw new Error(
        `Forteplus assign falhou ${assignRes.status}: ${await assignRes.text()}`
      );
    }
    const { access: jwtFinal } = (await assignRes.json()) as AssignResponse;

    this.jwt = jwtFinal;
    this.jwtExpiresAt = this.parseExp(jwtFinal);
  }

  private parseExp(jwt: string): number {
    try {
      const payload = JSON.parse(atob(jwt.split('.')[1]));
      if (typeof payload.exp === 'number') return payload.exp * 1000;
    } catch {
      // ignora — fallback abaixo
    }
    return Date.now() + 23 * 3600 * 1000; // fallback: 23h
  }

  private async ensureAuth(): Promise<void> {
    const skewMs = 5 * 60 * 1000;
    if (!this.jwt || Date.now() > this.jwtExpiresAt - skewMs) {
      await this.authenticate();
    }
  }

  /**
   * GET autenticado em api.forteplus.com.br/api/v1/<path>.
   *
   * Resiliência:
   * - Timeout de 30s por request (via AbortSignal) — fail fast em vez de hangar
   * - 401 → reautentica + retry 1x (só se NÃO estamos em jwtOverride)
   * - 5xx do Cloudflare → 1 retry após backoff
   */
  async get<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
    await this.ensureAuth();

    const qs = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ).toString();
    const url = `${API_BASE}${path}${qs ? '?' + qs : ''}`;

    const doFetch = () =>
      fetch(url, {
        headers: {
          Authorization: this.jwt!,
          Accept: 'application/json',
          ...BROWSER_HEADERS,
        },
        signal: AbortSignal.timeout(30_000), // 30s por request
      });

    let res: Response;
    try {
      res = await doFetch();
    } catch (e) {
      if (e instanceof Error && e.name === 'TimeoutError') {
        throw new Error(`Forteplus timeout (30s) em ${path}`);
      }
      throw e;
    }

    // 401 → reautentica e tenta 1x mais (não aplica em jwtOverride)
    if (res.status === 401 && !this.jwtOverride) {
      this.jwt = null;
      await this.authenticate();
      try {
        res = await doFetch();
      } catch (e) {
        if (e instanceof Error && e.name === 'TimeoutError') {
          throw new Error(`Forteplus timeout (30s) em ${path} (após reauth)`);
        }
        throw e;
      }
    }

    // 5xx (origem do FP overloaded) → 1 retry após 5s
    if (res.status >= 500 && res.status < 600) {
      console.warn(`[forteplus] ${res.status} em ${path} — retry em 5s...`);
      await new Promise((r) => setTimeout(r, 5_000));
      try {
        res = await doFetch();
      } catch (e) {
        if (e instanceof Error && e.name === 'TimeoutError') {
          throw new Error(`Forteplus timeout (30s) em ${path} (após retry de ${res.status})`);
        }
        throw e;
      }
    }

    if (!res.ok) {
      throw new Error(`Forteplus ${res.status} em ${path}: ${await res.text()}`);
    }
    return (await res.json()) as T;
  }

  /**
   * Pagina automaticamente via limit/offset. Respeita rate limit (300/min).
   *
   * Nota: o DRF do Forteplus **ignora** o parâmetro `?page=N` (page=1 e page=20
   * retornam os mesmos IDs). A paginação real é via `?limit=&offset=`.
   * O `next` URL na resposta também usa limit/offset.
   */
  async getAllPages<T>(
    path: string,
    extraParams: Record<string, string | number> = {}
  ): Promise<T[]> {
    const all: T[] = [];
    const limit = 100;            // máximo prático — reduz # requests
    const throttleMs = 250;       // 4 req/s = 240/min < limite 300/min
    let offset = 0;
    let total = Infinity;

    while (offset < total) {
      const t0 = Date.now();
      const data = await this.get<PaginatedResponse<T>>(path, {
        ...extraParams,
        limit,
        offset,
      });
      total = data.count;
      console.log(
        `[forteplus] ${path} offset=${offset}/${total} → +${data.results.length} in ${Date.now() - t0}ms`
      );
      all.push(...data.results);

      // Defesa contra loop infinito: se a API retornar 0 ou next=null antes do total
      if (data.results.length === 0 || !data.next) break;
      offset += data.results.length;
      await new Promise((r) => setTimeout(r, throttleMs));
    }
    return all;
  }
}
