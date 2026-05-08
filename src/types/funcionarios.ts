// src/types/funcionarios.ts

export interface ObservacaoFuncionario {
  nome: string;
  observacao: string;
}

export interface RegistroFuncionarios {
  id?: string;
  data: string;
  total_presente: number;
  observacoes_funcionarios: ObservacaoFuncionario[];
  observacoes_gerais?: string;
  created_at?: string;
  updated_at?: string;
}
