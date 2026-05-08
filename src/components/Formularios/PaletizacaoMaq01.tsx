// src/components/Formularios/PaletizacaoMaq01.tsx
import React, { useState } from 'react';
import { salvarPaletizacaoMaq01 } from '../../utils/supabase';
import { format } from 'date-fns';

export default function PaletizacaoMaq01() {
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const [formData, setFormData] = useState({
    data: format(new Date(), 'yyyy-MM-dd'),
    referencia_producao: '',
    hora_inicio: '',
    hora_fim: '',
    primeira_linha: '',
    segunda_linha: '',
    rejeicao: '',
    quantidade_paletizada: '',
    numero_paletes: '',
    observacoes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    try {
      await salvarPaletizacaoMaq01({
        ...formData,
        primeira_linha: parseInt(formData.primeira_linha) || 0,
        segunda_linha: parseInt(formData.segunda_linha) || 0,
        rejeicao: parseInt(formData.rejeicao) || 0,
        quantidade_paletizada: parseInt(formData.quantidade_paletizada) || 0,
        numero_paletes: parseInt(formData.numero_paletes) || 0,
      });
      setMensagem({ tipo: 'sucesso', texto: '✅ Paletização salva!' });
      setTimeout(() => setMensagem(null), 3000);
    } catch (erro: any) {
      setMensagem({ tipo: 'erro', texto: `❌ Erro: ${erro.message}` });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 space-y-6">
      <div className="bg-indigo-100 border-l-4 border-indigo-600 p-4 rounded">
        <h2 className="text-2xl font-bold text-indigo-900">📦 Paletização Maq01</h2>
        <p className="text-indigo-700">Blocos e Canaletas</p>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Referência Produção *</label>
            <input type="text" name="referencia_producao" value={formData.referencia_producao} onChange={handleChange} required placeholder="Ex: 29/04 Manhã - Bloco 19" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hora Início *</label>
            <input type="time" name="hora_inicio" value={formData.hora_inicio} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hora Fim *</label>
            <input type="time" name="hora_fim" value={formData.hora_fim} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-4">Quantidades (UN)</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">1ª Linha *</label>
              <input type="number" name="primeira_linha" value={formData.primeira_linha} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">2ª Linha *</label>
              <input type="number" name="segunda_linha" value={formData.segunda_linha} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Rejeição *</label>
              <input type="number" name="rejeicao" value={formData.rejeicao} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Paletizada *</label>
              <input type="number" name="quantidade_paletizada" value={formData.quantidade_paletizada} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Paletes *</label>
              <input type="number" name="numero_paletes" value={formData.numero_paletes} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
          <textarea name="observacoes" value={formData.observacoes} onChange={handleChange} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
        </div>

        <button type="submit" disabled={carregando} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg">
          {carregando ? '⏳ Salvando...' : '✅ Salvar'}
        </button>
      </form>
    </div>
  );
}
