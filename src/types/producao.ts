// src/types/producao.ts

export interface ProducaoMaq01 {
  id?: string;
  data: string;
  turno: 'Manhã' | 'Tarde' | 'Noite';
  produto: string;
  hora_inicio: string;
  hora_fim_mistura: string;
  hora_fim_maquina: string;
  hora_fim_limpeza: string;
  numero_tabuas: number;
  quantidade_cura: number;
  cimento_sacos: number;
  areia: number;
  po_brita: number;
  aditivo: number;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProducaoMaq02 {
  id?: string;
  data: string;
  turno: 'Manhã' | 'Tarde' | 'Noite';
  produto: string;
  hora_inicio: string;
  hora_fim: string;
  quantidade: number;
  unidade: 'M²';
  concreto_usinado: number;
  mpa_concreto: number;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProducaoMaq03 {
  id?: string;
  data: string;
  turno: 'Manhã' | 'Tarde' | 'Noite';
  produto: string;
  hora_inicio: string;
  hora_fim: string;
  quantidade: number;
  unidade: 'UN';
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export const PRODUTOS_MAQ01 = [
  'Bloco 14x19x39 Estrutural',
  'Bloco 14x19x39 Vedação',
  'Bloco 19x19x39 Estrutural',
  'Bloco 19x19x39 Vedação',
  '½ Bloco 14x19x19',
  '½ Bloco 19x19x19',
  'Canaleta 14x19x39',
  'Canaleta 19x19x39',
  'Piso Tijolinho VP 6cm'
];

export const PRODUTOS_MAQ02 = [
  'Tijolinho DM 2,5cm Natural',
  'Tijolinho DM 4cm Natural',
  'Tijolinho DM 6cm Natural',
  'Tijolinho DM 8cm Natural',
  'Tijolinho DM 4cm Colorido',
  'Tijolinho DM 6cm Colorido',
  '16 Faces',
  'Sextavado',
  'Ossinho'
];

export const PRODUTOS_MAQ03 = [
  'Guia Sarjeta 80x30x10',
  'Guia Sarjeta 80x30x08',
  'Guia Sarjeta 80x30x06',
  'Elemento Vazado Veneziana',
  'Elemento Vazado 16 Furos',
  'Concregrama DM 43x33x7',
  'Caixa Passagem'
];

export const TURNOS = ['Manhã', 'Tarde', 'Noite'] as const;
