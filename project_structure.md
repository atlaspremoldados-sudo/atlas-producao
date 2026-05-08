# ATLAS PRODUÇÃO - WEB APP

## 📂 Estrutura do Projeto

```
atlas-producao/
├── src/
│   ├── components/
│   │   ├── Formularios/
│   │   │   ├── Maq01Form.tsx
│   │   │   ├── Maq02Form.tsx
│   │   │   ├── Maq03Form.tsx
│   │   │   ├── DesformaPaletizacaoMaq02.tsx
│   │   │   ├── PaletizacaoMaq01.tsx
│   │   │   ├── EntregasForm.tsx
│   │   │   └── FuncionariosForm.tsx
│   │   ├── Layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Navbar.tsx
│   │   │   └── Footer.tsx
│   │   └── Common/
│   │       ├── LoadingSpinner.tsx
│   │       ├── SuccessMessage.tsx
│   │       └── ErrorMessage.tsx
│   │
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Historico.tsx
│   │   └── Configuracoes.tsx
│   │
│   ├── types/
│   │   ├── producao.ts
│   │   ├── paletizacao.ts
│   │   ├── entregas.ts
│   │   └── funcionarios.ts
│   │
│   ├── utils/
│   │   ├── supabase.ts
│   │   ├── api.ts
│   │   ├── formatters.ts
│   │   └── validators.ts
│   │
│   ├── styles/
│   │   ├── globals.css
│   │   ├── responsive.css
│   │   └── components.css
│   │
│   ├── App.tsx
│   └── index.tsx
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🗄️ Tabelas Supabase

1. **producao_maq01** - Produção Máquina 01
2. **producao_maq02** - Produção Máquina 02
3. **producao_maq03** - Produção Máquina 03
4. **desforma_paletizacao_maq02** - Desforma/Paletização Máq02
5. **paletizacao_maq01** - Paletização Máq01
6. **entregas** - Registro de entregas
7. **funcionarios_registro** - Registro de funcionários

