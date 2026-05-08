// src/components/Formularios/Maq02Form.tsx

import React, { useState } from 'react';
import { PRODUTOS_MAQ02, TURNOS } from '../../types/producao';
import { salvarProducaoMaq02 } from '../../utils/supabase';
import { format } from 'date-fns';

export default function Maq02Form() {
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const [formData, setFormData] = useState({
    data: format(new Date(), 'yyyy-MM-dd'),
    turno: 'Manhã',
    produto: PRODUTOS_MAQ02[0],
    hora_inicio: '',
    hora_fim: '',
    quantidade: '',
    concreto_usinado: '',
    mpa_concreto: '',
    observacoes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setMensagem(null);

    try {
      const dadosFormatados = {
        ...formData,
        quantidade: parseFloat(formData.quantidade) || 0,
        concreto_usinado: parseFloat(formData.concreto_usinado) || 0,
        mpa_concreto: parseFloat(formData.mpa_concreto) || 0,
      };

      await salvarProducaoMaq02(dadosFormatados);

      setMensagem({
        tipo: 'sucesso',
        texto: '✅ Produção Maq02 salva com sucesso!',
      });

      setFormData({
        data: format(new Date(), 'yyyy-MM-dd'),
        turno: 'Manhã',
        produto: PRODUTOS_MAQ02[0],
        hora_inicio: '',
        hora_fim: '',
        quantidade: '',
        concreto_usinado: '',
        mpa_concreto: '',
        observacoes: '',
      });

      setTimeout(() => setMensagem(null), 3000);
    } catch (erro: any) {
      setMensagem({ tipo: 'erro', texto: `❌ Erro: ${erro.message}` });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 space-y-6">
      <div className="bg-yellow-100 border-l-4 border-yellow-600 p-4 rounded">
        <h2 className="text-2xl font-bold text-yellow-900">🟨 Máquina 02</h2>
        <p className="text-yellow-700">Pisos Dormido (Massa Molhada)</p>
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
            <input type="date" name="data" value={formData.data} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Turno *</label>
            <select name="turno" value={formData.turno} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500">
              {TURNOS.map((turno) => <option key={turno} value={turno}>{turno}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Produto *</label>
          <select name="produto" value={formData.produto} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500">
            {PRODUTOS_MAQ02.map((produto) => <option key={produto} value={produto}>{produto}</option>)}
          </select>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <h3 className="font-medium text-gray-900">Horários</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Hora Início *</label>
              <input type="time" name="hora_inicio" value={formData.hora_inicio} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Hora Fim *</label>
              <input type="time" name="hora_fim" value={formData.hora_fim} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500" />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <h3 className="font-medium text-gray-900">Dados de Produção</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Quantidade (m²) *</label>
              <input type="number" step="0.1" name="quantidade" value={formData.quantidade} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Concreto Usinado (m³)</label>
              <input type="number" step="0.1" name="concreto_usinado" value={formData.concreto_usinado} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">MPA Concreto</label>
              <input type="number" step="0.1" name="mpa_concreto" value={formData.mpa_concreto} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Observações (opcional)</label>
          <textarea name="observacoes" value={formData.observacoes} onChange={handleChange} placeholder="Adicione observações relevantes..." rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500" />
        </div>

        <button type="submit" disabled={carregando} className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-all">
          {carregando ? '⏳ Salvando...' : '✅ Salvar Produção'}
        </button>
      </form>
    </div>
  );
}
