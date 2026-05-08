// src/types/paletizacao.ts

export interface DesformaPaletizacaoMaq02 {
  id?: string;
  data: string;
  producao_id: string;
  referencia_producao: string;
  hora_inicio_desforma: string;
  hora_fim_desforma: string;
  hora_inicio_paletizacao: string;
  hora_fim_paletizacao: string;
  primeira_linha: number;
  segunda_linha: number;
  rejeicao: number;
  quantidade_paletizada: number;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaletizacaoMaq01 {
  id?: string;
  data: string;
  producao_id: string;
  referencia_producao: string;
  hora_inicio: string;
  hora_fim: string;
  primeira_linha: number;
  segunda_linha: number;
  rejeicao: number;
  quantidade_paletizada: number;
  numero_paletes: number;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}
