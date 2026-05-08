// src/types/entregas.ts

export interface ClienteEntrega {
  cliente_nome: string;
  produto: string;
  quantidade_entregue: number;
  valor_faturado: number;
  pallets_utilizados: number;
}

export interface Entrega {
  id?: string;
  data: string;
  motorista: string;
  hora_saida: string;
  hora_retorno: string;
  km_rodado: number;
  tempo_parado_munck: string;
  clientes: ClienteEntrega[];
  total_faturado?: number;
  total_pallets?: number;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}
