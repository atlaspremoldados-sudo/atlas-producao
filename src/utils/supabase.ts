// src/utils/supabase.ts

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Faltam variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper functions para operações comuns

export const salvarProducaoMaq01 = async (data: any) => {
  const { data: resultado, error } = await supabase
    .from('producao_maq01')
    .insert([data])
    .select();
  
  if (error) throw new Error(`Erro ao salvar produção Maq01: ${error.message}`);
  return resultado;
};

export const salvarProducaoMaq02 = async (data: any) => {
  const { data: resultado, error } = await supabase
    .from('producao_maq02')
    .insert([data])
    .select();
  
  if (error) throw new Error(`Erro ao salvar produção Maq02: ${error.message}`);
  return resultado;
};

export const salvarProducaoMaq03 = async (data: any) => {
  const { data: resultado, error } = await supabase
    .from('producao_maq03')
    .insert([data])
    .select();
  
  if (error) throw new Error(`Erro ao salvar produção Maq03: ${error.message}`);
  return resultado;
};

export const obterProducoesMaq02 = async (dataPara?: string) => {
  let query = supabase.from('producao_maq02').select('*');
  
  if (dataPara) {
    query = query.lte('data', dataPara);
  }
  
  const { data, error } = await query.order('data', { ascending: false });
  
  if (error) throw new Error(`Erro ao buscar produções Maq02: ${error.message}`);
  return data;
};

export const obterProducoesMaq01 = async (dataPara?: string) => {
  let query = supabase.from('producao_maq01').select('*');
  
  if (dataPara) {
    query = query.lte('data', dataPara);
  }
  
  const { data, error } = await query.order('data', { ascending: false });
  
  if (error) throw new Error(`Erro ao buscar produções Maq01: ${error.message}`);
  return data;
};

export const salvarDesformaPaletizacaoMaq02 = async (data: any) => {
  const { data: resultado, error } = await supabase
    .from('desforma_paletizacao_maq02')
    .insert([data])
    .select();
  
  if (error) throw new Error(`Erro ao salvar desforma: ${error.message}`);
  return resultado;
};

export const salvarPaletizacaoMaq01 = async (data: any) => {
  const { data: resultado, error } = await supabase
    .from('paletizacao_maq01')
    .insert([data])
    .select();
  
  if (error) throw new Error(`Erro ao salvar paletização: ${error.message}`);
  return resultado;
};

export const salvarEntrega = async (data: any) => {
  const { data: resultado, error } = await supabase
    .from('entregas')
    .insert([data])
    .select();
  
  if (error) throw new Error(`Erro ao salvar entrega: ${error.message}`);
  return resultado;
};

export const salvarRegistroFuncionarios = async (data: any) => {
  const { data: resultado, error } = await supabase
    .from('funcionarios_registro')
    .insert([data])
    .select();
  
  if (error) throw new Error(`Erro ao salvar registro de funcionários: ${error.message}`);
  return resultado;
};
