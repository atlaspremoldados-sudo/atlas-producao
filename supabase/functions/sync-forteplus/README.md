# `sync-forteplus` — Edge Function

Sincroniza dados read-only do Forteplus para o schema `forteplus.*` no Supabase.

**Módulos implementados:** `produtos` (pr_tipo PA+MP), `vendas` (movimentos_saida), `parceiros` (ps_categoria CLI), `contas_receber` (financas_receber), `contas_pagar` (financas_pagar).

## Status (18/05/2026)

| Camada | Status |
|---|---|
| Edge Function deployada em prod | ✅ |
| Auth programática (login + assign) | ✅ |
| Schema `forteplus.*` (8 tabelas) | ✅ migrations 005 + 006 |
| Carga inicial 12 meses | ✅ 2.547 records |
| pg_cron diário 06:00 BRT | ✅ migration 007, jobid=1 |

**Endpoint da Edge Function:** `https://whojujjnpaklidkfkpbj.supabase.co/functions/v1/sync-forteplus`

**Próxima execução automática:** todo dia às **09:00 UTC** (06:00 BRT).

**Trigger manual:**
```bash
curl -X POST 'https://whojujjnpaklidkfkpbj.supabase.co/functions/v1/sync-forteplus' \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"modulos":["parceiros"]}'   # ou {} para todos
```

---

## Pré-requisitos para validar localmente

1. **Supabase CLI** instalado: `winget install --id Supabase.cli` (ou `npm i -g supabase`)
2. **Migration 005 aplicada** no Supabase de produção (cola `supabase/migrations/005-forteplus-schema.sql` no SQL Editor)
3. **JWT do Forteplus em mãos** (modo OVERRIDE — recomendado para primeira validação)

---

## Modo OVERRIDE (recomendado para 1º teste)

O endpoint de login programático ainda é suposição. Para validar o pipeline inteiro (HTTP → DB upsert → log) sem depender disso:

1. **Login manual** em https://app.forteplus.com.br no navegador.
2. **F12** → aba *Application* → *Session Storage* → `app.forteplus.com.br`.
3. Copie o valor de **`__FPS_JWT__`** (vale 24h).
4. Cole no `supabase/.env.local`:

```bash
cp supabase/.env.local.example supabase/.env.local
# edite e descomente FORTEPLUS_JWT_OVERRIDE=<seu JWT>
# preencha também SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
```

5. **Servir a função:**

```powershell
supabase functions serve sync-forteplus --env-file ./supabase/.env.local --no-verify-jwt
```

6. **Disparar um módulo por vez** (recomendado para isolar erros):

```powershell
# Apenas produtos (mais barato — ~1.158 registros)
curl.exe -X POST http://localhost:54321/functions/v1/sync-forteplus `
  -H "Content-Type: application/json" `
  -d '{\"modulos\":[\"produtos\"]}'

# Apenas vendas (~591 registros)
curl.exe -X POST http://localhost:54321/functions/v1/sync-forteplus `
  -H "Content-Type: application/json" `
  -d '{\"modulos\":[\"vendas\"]}'

# Apenas parceiros (~226 registros)
curl.exe -X POST http://localhost:54321/functions/v1/sync-forteplus `
  -H "Content-Type: application/json" `
  -d '{\"modulos\":[\"parceiros\"]}'

# Todos juntos
curl.exe -X POST http://localhost:54321/functions/v1/sync-forteplus `
  -H "Content-Type: application/json" -d '{}'
```

7. **Esperado em sucesso:**

```json
{
  "results": {
    "produtos": {
      "ok": true,
      "lidos": 1158,
      "upsertados": 1158,
      "watermark_anterior": "2025-05-12",
      "watermark_novo": "2026-05-12",
      "duracao_s": 28.4
    }
  }
}
```

8. **Conferir no Supabase:**

```sql
SELECT COUNT(*), MIN(synced_at), MAX(synced_at) FROM forteplus.produtos;
SELECT * FROM forteplus.sync_log ORDER BY iniciado_em DESC LIMIT 5;
```

---

## Modo AUTOMÁTICO (quando login estiver confirmado)

Quando o endpoint correto de login for confirmado (pelo Davi ou por captura adicional):

1. Remova/comente `FORTEPLUS_JWT_OVERRIDE` do `.env.local`.
2. Preencha `FORTEPLUS_EMAIL`, `FORTEPLUS_PASSWORD`, `FORTEPLUS_SUBSCRIPTION_ID=181`.
3. Se a URL hardcoded em `forteplus-client.ts` (`accounts.forteplus.com.br/api/auth/login/`) estiver errada, ajuste lá.

---

## Erros comuns e diagnóstico

| Sintoma | Causa provável | Solução |
|---|---|---|
| `Forteplus 401` em qualquer chamada | JWT inválido/expirado | Refaça o passo OVERRIDE com JWT fresco |
| `Forteplus 404` no login | URL de login chutada está errada | Use OVERRIDE; investigue URL real |
| `relation "forteplus.produtos" does not exist` | Migration 005 não aplicada | Aplique no SQL Editor |
| `SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar definidas` | Faltam vars no `.env.local` | Preencha as 2 vars do Supabase |
| Apenas alguns registros chegam | Filtro de watermark sendo aplicado | Veja `watermark_anterior` no response — está usando sync anterior |
| Quero forçar carga total | Limpe o sync_log do recurso | `DELETE FROM forteplus.sync_log WHERE recurso='produtos';` |

---

## Deploy em produção (depois de validar)

```powershell
supabase functions deploy sync-forteplus
supabase secrets set FORTEPLUS_EMAIL=...
supabase secrets set FORTEPLUS_PASSWORD=...
supabase secrets set FORTEPLUS_SUBSCRIPTION_ID=181
```

Agendamento via pg_cron está documentado em [edge-function-template.md](../../../../../Documents/Claude/Projects/ATLAS%20PR%C3%89-MOLDADOS/05-INTEGRACAO-FORTEPLUS/edge-function-template.md#L437).

---

## Estrutura

```
supabase/
├── migrations/
│   └── 005-forteplus-schema.sql        ← aplicar primeiro
└── functions/
    ├── _shared/
    │   ├── forteplus-client.ts          ← HTTP client (login+assign+get+pagination)
    │   └── supabase-admin.ts            ← cliente Supabase service_role
    └── sync-forteplus/
        ├── index.ts                     ← entry point (serve)
        ├── README.md                    ← este arquivo
        └── modules/
            ├── produtos.ts              ← /produtos/?pr_tipo__in=PA,MP
            ├── vendas.ts                ← /movimentos_saida/
            └── parceiros.ts             ← /parceiros/?ps_categoria__icontains=CLI
```
