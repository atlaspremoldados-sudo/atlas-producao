// src/hooks/useProdutos.ts
//
// Hook que carrega o catalogo de produtos do Supabase, filtrado por maquina.
// Substitui as listas hardcoded PRODUTOS_MAQ01/02/03 — agora a fonte da
// verdade e a tabela `produtos`, alinhada com o Forteplus.

import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

export type Maquina = 'Maq01' | 'Maq02' | 'Maq03';
export type UnidadeProduto = 'UN' | 'M²' | 'M³' | 'KG';

export interface Produto {
  id: string;
  codigo: string;
  nome: string;
  maquina: Maquina;
  unidade: UnidadeProduto;
  ativo: boolean;
  preco_referencia: number | null;
}

interface UseProdutosResult {
  produtos: Produto[];
  carregando: boolean;
  erro: string | null;
}

export function useProdutos(maquina: Maquina): UseProdutosResult {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro(null);

    supabase
      .from('produtos')
      .select('id, codigo, nome, maquina, unidade, ativo, preco_referencia')
      .eq('maquina', maquina)
      .eq('ativo', true)
      .order('nome', { ascending: true })
      .then(({ data, error }) => {
        if (cancelado) return;
        if (error) {
          setErro(error.message);
          setProdutos([]);
        } else {
          setProdutos((data ?? []) as Produto[]);
        }
        setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [maquina]);

  return { produtos, carregando, erro };
}
