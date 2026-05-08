-- ATLAS PRODUÇÃO - SQL Schema para Supabase
-- Copie este arquivo completo e cole no SQL Editor do Supabase
-- Data: 08/05/2026

-- ===================================================================
-- TABELA: PRODUÇÃO MÁQUINA 01 (Blocos/Canaletas - Massa Seca)
-- ===================================================================

CREATE TABLE IF NOT EXISTS producao_maq01 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  turno VARCHAR(20) NOT NULL CHECK (turno IN ('Manhã', 'Tarde', 'Noite')),
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

CREATE INDEX IF NOT EXISTS idx_producao_maq01_data ON producao_maq01(data DESC);
CREATE INDEX IF NOT EXISTS idx_producao_maq01_data_turno ON producao_maq01(data DESC, turno);

-- ===================================================================
-- TABELA: PRODUÇÃO MÁQUINA 02 (Pisos Dormido - Massa Molhada)
-- ===================================================================

CREATE TABLE IF NOT EXISTS producao_maq02 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  turno VARCHAR(20) NOT NULL CHECK (turno IN ('Manhã', 'Tarde', 'Noite')),
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

CREATE INDEX IF NOT EXISTS idx_producao_maq02_data ON producao_maq02(data DESC);
CREATE INDEX IF NOT EXISTS idx_producao_maq02_data_turno ON producao_maq02(data DESC, turno);

-- ===================================================================
-- TABELA: PRODUÇÃO MÁQUINA 03 (Mesa Vibratória - Complementos)
-- ===================================================================

CREATE TABLE IF NOT EXISTS producao_maq03 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  turno VARCHAR(20) NOT NULL CHECK (turno IN ('Manhã', 'Tarde', 'Noite')),
  produto VARCHAR(100) NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 0,
  unidade VARCHAR(10) DEFAULT 'UN',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_producao_maq03_data ON producao_maq03(data DESC);
CREATE INDEX IF NOT EXISTS idx_producao_maq03_data_turno ON producao_maq03(data DESC, turno);

-- ===================================================================
-- TABELA: DESFORMA + PALETIZAÇÃO MÁQUINA 02
-- ===================================================================

CREATE TABLE IF NOT EXISTS desforma_paletizacao_maq02 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  producao_id UUID REFERENCES producao_maq02(id) ON DELETE SET NULL,
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

CREATE INDEX IF NOT EXISTS idx_desforma_maq02_data ON desforma_paletizacao_maq02(data DESC);
CREATE INDEX IF NOT EXISTS idx_desforma_maq02_producao_id ON desforma_paletizacao_maq02(producao_id);

-- ===================================================================
-- TABELA: PALETIZAÇÃO MÁQUINA 01
-- ===================================================================

CREATE TABLE IF NOT EXISTS paletizacao_maq01 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  producao_id UUID REFERENCES producao_maq01(id) ON DELETE SET NULL,
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

CREATE INDEX IF NOT EXISTS idx_paletizacao_maq01_data ON paletizacao_maq01(data DESC);
CREATE INDEX IF NOT EXISTS idx_paletizacao_maq01_producao_id ON paletizacao_maq01(producao_id);

-- ===================================================================
-- TABELA: ENTREGAS (Suporta múltiplos clientes com JSONB)
-- ===================================================================

CREATE TABLE IF NOT EXISTS entregas (
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

-- Índice GIN para buscar dentro do JSONB
CREATE INDEX IF NOT EXISTS idx_entregas_clientes ON entregas USING GIN(clientes);
CREATE INDEX IF NOT EXISTS idx_entregas_data ON entregas(data DESC);
CREATE INDEX IF NOT EXISTS idx_entregas_motorista ON entregas(motorista, data DESC);

-- ===================================================================
-- TABELA: FUNCIONÁRIOS (Suporta múltiplas observações com JSONB)
-- ===================================================================

CREATE TABLE IF NOT EXISTS funcionarios_registro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  total_presente INTEGER NOT NULL DEFAULT 0,
  observacoes_funcionarios JSONB NOT NULL,
  observacoes_gerais TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_funcionarios_data ON funcionarios_registro(data DESC);

-- ===================================================================
-- HABILITAR ROW LEVEL SECURITY (Opcional - para produção com login)
-- ===================================================================

-- ALTER TABLE producao_maq01 ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE producao_maq02 ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE producao_maq03 ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE desforma_paletizacao_maq02 ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE paletizacao_maq01 ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE entregas ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE funcionarios_registro ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- TABELA DE EXEMPLO DE DADOS (Descomente para testar)
-- ===================================================================

-- INSERT INTO producao_maq01 (
--   data, turno, produto, hora_inicio, hora_fim_mistura, 
--   hora_fim_maquina, hora_fim_limpeza, numero_tabuas, quantidade_cura,
--   cimento_sacos, areia, po_brita, aditivo, observacoes
-- ) VALUES (
--   CURRENT_DATE, 'Manhã', 'Bloco 19x19x39 Estrutural', 
--   '07:30', '11:10', '11:30', '12:00', 441, 1764,
--   41, 1.0, 1.0, 0.01, 'Produção normal'
-- );

-- ===================================================================
-- FIM DO SCRIPT
-- ===================================================================
-- Status: ✅ Pronto para Supabase
-- Data: 08/05/2026
-- Criado por: Claude para ATLAS PRÉ-MOLDADOS
