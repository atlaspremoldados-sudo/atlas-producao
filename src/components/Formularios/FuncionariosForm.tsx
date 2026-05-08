// src/components/Formularios/FuncionariosForm.tsx
import React, { useState } from 'react';
import { salvarRegistroFuncionarios } from '../../utils/supabase';
import { format } from 'date-fns';

export default function FuncionariosForm() {
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const [formData, setFormData] = useState({
    data: format(new Date(), 'yyyy-MM-dd'),
    total_presente: '',
    observacoes_funcionarios: [{ nome: '', observacao: '' }],
    observacoes_gerais: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFuncChange = (index: number, field: string, value: string) => {
    const novoFunc = [...formData.observacoes_funcionarios];
    novoFunc[index] = { ...novoFunc[index], [field]: value };
    setFormData((prev) => ({ ...prev, observacoes_funcionarios: novoFunc }));
  };

  const addFuncionario = () => {
    setFormData((prev) => ({
      ...prev,
      observacoes_funcionarios: [...prev.observacoes_funcionarios, { nome: '', observacao: '' }],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    try {
      await salvarRegistroFuncionarios({
        ...formData,
        total_presente: parseInt(formData.total_presente) || 0,
        observacoes_funcionarios: formData.observacoes_funcionarios.filter((f) => f.nome.trim() !== ''),
      });
      setMensagem({ tipo: 'sucesso', texto: '✅ Registro de funcionários salvo!' });
      setTimeout(() => setMensagem(null), 3000);
    } catch (erro: any) {
      setMensagem({ tipo: 'erro', texto: `❌ Erro: ${erro.message}` });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 space-y-6">
      <div className="bg-gray-100 border-l-4 border-gray-600 p-4 rounded">
        <h2 className="text-2xl font-bold text-gray-900">👥 Funcionários</h2>
        <p className="text-gray-700">Registro de presença e observações</p>
      </div>

      {mensagem && (
        <div className={`p-4 rounded-lg font-medium ${mensagem.tipo === 'sucesso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {mensagem.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data *</label>
            <input type="date" name="data" value={formData.data} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Total Presente *</label>
            <input type="number" name="total_presente" value={formData.total_presente} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>

        <div className="border-t-2 pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900">Observações por Funcionário</h3>
            <button
              type="button"
              onClick={addFuncionario}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm"
            >
              + Adicionar
            </button>
          </div>

          {formData.observacoes_funcionarios.map((func, idx) => (
            <div key={idx} className="bg-gray-50 p-4 rounded-lg mb-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Nome do funcionário"
                  value={func.nome}
                  onChange={(e) => handleFuncChange(idx, 'nome', e.target.value)}
                  className="col-span-1 px-4 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <textarea
                  placeholder="Observação (falta, atraso, EPI, desempenho...)"
                  value={func.observacao}
                  onChange={(e) => handleFuncChange(idx, 'observacao', e.target.value)}
                  rows={2}
                  className="col-span-1 md:col-span-3 px-4 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Observações Gerais do Dia</label>
          <textarea
            name="observacoes_gerais"
            value={formData.observacoes_gerais}
            onChange={handleChange}
            placeholder="Anotações importantes do dia..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <button type="submit" disabled={carregando} className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg">
          {carregando ? '⏳ Salvando...' : '✅ Salvar Registro'}
        </button>
      </form>
    </div>
  );
}
