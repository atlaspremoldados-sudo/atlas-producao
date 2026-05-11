# CLAUDE.md — atlas-producao (repositório)

> Este arquivo é lido por Claude (Code, Cowork, IDE plugins) ao abrir o repositório.
> A documentação completa do projeto vive numa pasta separada — ver "Onde fica a doc completa" abaixo.

## Identidade

Web app de gestão de produção da **ATLAS PRÉ-MOLDADOS LTDA** (CNPJ 57.356.348/0001-33), fábrica de pré-moldados de concreto em Presidente Prudente/SP. Sócio: João Antonio Rissi Silva.

Em produção: https://atlas-producao.vercel.app/

## Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind + Lucide
- **Backend:** Supabase (PostgreSQL) — projeto `whojujjnpaklidkfkpbj` (dois `j` no meio — atenção ao typo histórico)
- **Hospedagem:** Vercel — deploy automático no push para `main`

## Onde fica a doc completa

A documentação extensa (schema, migrations, seeds, mapeamento Forteplus, decisões de produto, lista oficial de 47 SKUs, etc.) vive **fora deste repo**, em:

```
C:\Users\User\Documents\Claude\Projects\ATLAS PRÉ-MOLDADOS\
```

Estrutura nessa pasta:

- `CLAUDE.md` — memória persistente do projeto inteiro (super-set deste arquivo)
- `00-INSTRUCOES/` — checklist de tarefas, credenciais, guias
- `01-BANCO-DADOS/` — schema, migrations, views, triggers, queries
- `02-DOCUMENTACAO/` — dicionário de dados, produtos, fluxos
- `03-DADOS-TESTE/` — seed data
- `04-RELATORIOS/` — outputs gerados
- `05-INTEGRACAO-FORTEPLUS/` — análise da API + endpoints + plano de Edge Function
- `06-MELHORIAS/` — backlog
- `07-HISTORICO/` — contexto e timeline

**Antes de começar uma tarefa, leia o CLAUDE.md da pasta acima** — ele tem o contexto completo (regras, padrões SQL, ground truth dos códigos de SKU, roadmap).

## Comandos úteis

```bash
# Setup
npm install
cp .env.example .env.local         # depois edite com a URL e key real do Supabase

# Dev
npm run dev                         # localhost:5173

# Build/preview
npm run build
npm run preview
```

## Padrões deste repo

- **TypeScript** com `strict: true` (no tsconfig). Não suprima erros — corrija.
- **Tailwind** para estilos. Não use CSS-in-JS nem CSS files.
- **Português brasileiro** em strings de UI e nomes de variáveis quando fizer sentido (ex.: `formData.observacoes`, `setMensagem`).
- **Formulários:** padrão controlado com `useState({...})` + `handleChange` único genérico.
- **Cliente Supabase:** importar de `src/utils/supabase.ts` (já configurado com env vars).
- **Tipos:** definir em `src/types/<dominio>.ts`.
- **Hooks customizados:** em `src/hooks/<useNome>.ts`.
- **Componentes:** em `src/components/<Pasta>/<Nome>.tsx`.

## Lógica de codificação dos produtos (ground truth do João)

Padrão: `PA` (Produto Acabado) + `<máquina>` + `<variações>`. Sufixo de cor: `xxx0`=Natural, `xxx1`=Colorido, `xxx2`=Col. Especial.

| Família | Máquina | Categoria |
|---|---|---|
| `PA1xxx` | Maq01 | Blocos / Piso VP |
| `PA2xxx` | Maq02 | Pisos Dormido + Pisos Táteis + Antiderrapante |
| `PA3xxx` | Maq03 | Guias / Concregrama / Cobogó 16 furos |
| `PA4xxx` | Maq03 (legado) | Mourões + Veneziana |

Catálogo oficial: 47 SKUs. **Não inventar códigos novos sem confirmar com o João.**

## Como o app salva produção

Desde o PR #1, os 3 forms de produção (`Maq01Form`, `Maq02Form`, `Maq03Form`) usam o hook `useProdutos('Maq0X')` que lê a tabela `produtos` do Supabase. Ao salvar, INSERT vai com:

- `produto_id` (UUID, FK para `produtos`)
- `produto` (texto, nome do catálogo — mantido para compatibilidade)

As constantes `PRODUTOS_MAQ01/02/03` em `src/types/producao.ts` estão marcadas como `@deprecated` mas mantidas para não quebrar imports.

## O que NÃO fazer

- Não inventar SKUs ou códigos novos sem confirmar com o João.
- Não comitar `.env.local`, JWT do Forteplus, ou credenciais.
- Não habilitar RLS sem antes criar policies adequadas (atualmente RLS está desabilitado — ver `SUPABASE-AUTH-SETUP.md` na pasta de docs).
- Não mexer no Supabase via SQL Editor sem mostrar o SQL ao João antes (em ações destrutivas).

## Roadmap atual

1. ✅ Banco profissionalizado (migrations 001-004 + 004b)
2. ✅ 47 produtos no catálogo
3. ✅ Frontend usa `produto_id` (PR #1 mergeado)
4. ⏳ Supabase Auth + RLS com policies
5. ⏳ Dropdown de funcionários/clientes/motoristas nos demais forms
6. ⏳ Integração Forteplus (Edge Function — aguardando JWT)
7. ⏳ Views SQL e dashboard
