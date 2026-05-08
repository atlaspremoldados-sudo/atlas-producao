// src/components/Formularios/Maq03Form.tsx
import React, { useState } from 'react';
import { PRODUTOS_MAQ03, TURNOS } from '../../types/producao';
import { salvarProducaoMaq03 } from '../../utils/supabase';
import { format } from 'date-fns';

export default function Maq03Form() {
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const [formData, setFormData] = useState({
    data: format(new Date(), 'yyyy-MM-dd'),
    turno: 'Manhã',
    produto: PRODUTOS_MAQ03[0],
    hora_inicio: '',
    hora_fim: '',
    quantidade: '',
    observacoes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    try {
      await salvarProducaoMaq03({ ...formData, quantidade: parseInt(formData.quantidade) || 0 });
      setMensagem({ tipo: 'sucesso', texto: '✅ Produção Maq03 salva!' });
      setFormData({
        data: format(new Date(), 'yyyy-MM-dd'),
        turno: 'Manhã',
        produto: PRODUTOS_MAQ03[0],
        hora_inicio: '',
        hora_fim: '',
        quantidade: '',
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
      <div className="bg-purple-100 border-l-4 border-purple-600 p-4 rounded">
        <h2 className="text-2xl font-bold text-purple-900">🔷 Máquina 03</h2>
        <p className="text-purple-700">Mesa Vibratória - Complementos</p>
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
            <input type="date" name="data" value={formData.data} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Turno *</label>
            <select name="turno" value={formData.turno} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              {TURNOS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Produto *</label>
          <select name="produto" value={formData.produto} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
            {PRODUTOS_MAQ03.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade (UN) *</label>
          <input type="number" name="quantidade" value={formData.quantidade} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
          <textarea name="observacoes" value={formData.observacoes} onChange={handleChange} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
        </div>

        <button type="submit" disabled={carregando} className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg">
          {carregando ? '⏳ Salvando...' : '✅ Salvar Produção'}
        </button>
      </form>
    </div>
  );
}
