# 🏭 ATLAS PRODUÇÃO - Web App

**Sistema Web de Gestão de Produção para ATLAS PRÉ-MOLDADOS**

Um aplicativo moderno, responsivo e otimizado para celular que permite registrar dados de produção em tempo real.

---

## 🚀 Quick Start

### 1. **Clonar o repositório**
```bash
git clone https://github.com/seu-usuario/atlas-producao.git
cd atlas-producao
```

### 2. **Instalar dependências**
```bash
npm install
```

### 3. **Configurar variáveis de ambiente**
```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais Supabase:
```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

### 4. **Rodar localmente**
```bash
npm run dev
```

Acesse: `http://localhost:5173`

### 5. **Deploy no Vercel**
```bash
npm run deploy
```

---

## 📋 Setup Supabase (Passo a Passo)

### **Criando Conta Supabase**

1. Acesse [supabase.com](https://supabase.com)
2. Clique em **"Start your project"**
3. Crie conta com **joaorissibr@gmail.com**
4. Crie novo projeto com nome: `atlas-producao`
5. Aguarde criação (2-3 minutos)

### **Pegando Credenciais**

1. No dashboard Supabase, clique em **Settings** → **API**
2. Copie **Project URL** e **anon public key**
3. Cole em `.env.local`

### **Criar Tabelas (SQL)**

No Supabase, vá para **SQL Editor** e execute o código abaixo:

```sql
-- Tabela Produção Máquina 01
CREATE TABLE producao_maq01 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  turno VARCHAR(20) NOT NULL,
  produto VARCHAR(100) NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim_mistura TIME NOT NULL,
  hora_fim_maquina TIME NOT NULL,
  hora_fim_limpeza TIME NOT NULL,
  numero_tabuas INTEGER NOT NULL DEFAULT 0,
  quantidade_cura INTEGER NOT NULL DEFAULT 0,
  cimento_sacos NUMERIC(10,2) NOT NULL DEFAULT 0,
  areia NUMERIC(10,2) NOT NULL DEFAULT 0,
  po_brita NUMERIC(10,2) NOT NULL DEFAULT 0,
  aditivo NUMERIC(10,2) NOT NULL DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela Produção Máquina 02
CREATE TABLE producao_maq02 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  turno VARCHAR(20) NOT NULL,
  produto VARCHAR(100) NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  quantidade NUMERIC(10,2) NOT NULL DEFAULT 0,
  unidade VARCHAR(10) DEFAULT 'M²',
  concreto_usinado NUMERIC(10,2) NOT NULL DEFAULT 0,
  mpa_concreto NUMERIC(5,1) NOT NULL DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela Produção Máquina 03
CREATE TABLE producao_maq03 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  turno VARCHAR(20) NOT NULL,
  produto VARCHAR(100) NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 0,
  unidade VARCHAR(10) DEFAULT 'UN',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela Desforma + Paletização Máquina 02
CREATE TABLE desforma_paletizacao_maq02 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  producao_id UUID REFERENCES producao_maq02(id),
  referencia_producao VARCHAR(100) NOT NULL,
  hora_inicio_desforma TIME NOT NULL,
  hora_fim_desforma TIME NOT NULL,
  hora_inicio_paletizacao TIME NOT NULL,
  hora_fim_paletizacao TIME NOT NULL,
  primeira_linha NUMERIC(10,2) NOT NULL DEFAULT 0,
  segunda_linha NUMERIC(10,2) NOT NULL DEFAULT 0,
  rejeicao NUMERIC(10,2) NOT NULL DEFAULT 0,
  quantidade_paletizada NUMERIC(10,2) NOT NULL DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela Paletização Máquina 01
CREATE TABLE paletizacao_maq01 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  producao_id UUID REFERENCES producao_maq01(id),
  referencia_producao VARCHAR(100) NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  primeira_linha INTEGER NOT NULL DEFAULT 0,
  segunda_linha INTEGER NOT NULL DEFAULT 0,
  rejeicao INTEGER NOT NULL DEFAULT 0,
  quantidade_paletizada INTEGER NOT NULL DEFAULT 0,
  numero_paletes INTEGER NOT NULL DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela Entregas (JSONB para clientes múltiplos)
CREATE TABLE entregas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  motorista VARCHAR(100) NOT NULL,
  hora_saida TIME NOT NULL,
  hora_retorno TIME NOT NULL,
  km_rodado INTEGER NOT NULL DEFAULT 0,
  tempo_parado_munck VARCHAR(10),
  clientes JSONB NOT NULL,
  total_faturado NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_pallets INTEGER NOT NULL DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela Funcionários
CREATE TABLE funcionarios_registro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  total_presente INTEGER NOT NULL DEFAULT 0,
  observacoes_funcionarios JSONB NOT NULL,
  observacoes_gerais TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para melhor performance
CREATE INDEX idx_producao_maq01_data ON producao_maq01(data);
CREATE INDEX idx_producao_maq02_data ON producao_maq02(data);
CREATE INDEX idx_producao_maq03_data ON producao_maq03(data);
CREATE INDEX idx_entregas_data ON entregas(data);
CREATE INDEX idx_funcionarios_data ON funcionarios_registro(data);

-- Habilitar Row Level Security (RLS) - opcional, para segurança
ALTER TABLE producao_maq01 ENABLE ROW LEVEL SECURITY;
ALTER TABLE producao_maq02 ENABLE ROW LEVEL SECURITY;
ALTER TABLE producao_maq03 ENABLE ROW LEVEL SECURITY;
ALTER TABLE desforma_paletizacao_maq02 ENABLE ROW LEVEL SECURITY;
ALTER TABLE paletizacao_maq01 ENABLE ROW LEVEL SECURITY;
ALTER TABLE entregas ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios_registro ENABLE ROW LEVEL SECURITY;
```

---

## 🔐 Configurar Autenticação (Opcional)

Se quiser proteger o app com login:

1. No Supabase, vá para **Authentication** → **Users**
2. Clique em **Invite User**
3. Use seu email (joaorissibr@gmail.com)
4. Confirme o convite

---

## 🌐 Deploy em Vercel

### **1. Conectar GitHub ao Vercel**
```bash
npm install -g vercel
vercel login
```

### **2. Deploy**
```bash
vercel
```

Siga as instruções na tela.

### **3. Adicionar variáveis de ambiente**

No dashboard Vercel:
1. Vá para **Settings** → **Environment Variables**
2. Adicione:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

---

## 📱 Como Usar o App

### **No Celular (no Pátio Fabril)**

1. **Abra o link** que você recebeu (ex: `atlas-producao.vercel.app`)
2. **Selecione o formulário** (Maq01, Maq02, etc.)
3. **Preencha os dados** (muito rápido, otimizado para mobile)
4. **Clique em "✅ Salvar"**
5. **Pronto!** Dados são salvos no banco automaticamente

### **No PC (análise)**

1. **Você me envia a credencial** do Supabase (ou compartilha arquivo)
2. **Você me pergunta**: *"Claude, análise de produção desta semana"*
3. **Eu leio os dados** do Supabase
4. **Respondo com relatório completo**

---

## 🔄 Fluxo de Dados

```
Você preenche formulário (celular)
        ↓
Supabase salva dados (banco de dados)
        ↓
Claude lê Supabase (quando você pergunta)
        ↓
Claude analisa e responde com insights
```

---

## 🛠️ Tecnologias Usadas

- **React 18** - UI Framework
- **TypeScript** - Type Safety
- **Vite** - Build Tool (rápido!)
- **Supabase** - Backend + Database
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **date-fns** - Date Handling

---

## 📞 Suporte & Próximas Etapas

### **Amanhã:**
- [ ] Integração com Forteplus (preços, clientes, estoque)
- [ ] Dashboard com gráficos
- [ ] Autenticação segura
- [ ] Notificações em tempo real

### **Precisa de ajuda?**
- Dúvidas sobre Supabase? → [docs.supabase.com](https://docs.supabase.com)
- Dúvidas sobre Vercel? → [vercel.com/docs](https://vercel.com/docs)
- Dúvidas sobre o app? → Pergunte ao Claude!

---

## 📄 Licença

Privado - ATLAS PRÉ-MOLDADOS © 2026

---

**Criado com ❤️ por Claude para João da ATLAS Produção**
