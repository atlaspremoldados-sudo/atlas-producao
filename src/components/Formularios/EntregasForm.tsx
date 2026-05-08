// src/components/Formularios/EntregasForm.tsx
import React, { useState } from 'react';
import { salvarEntrega } from '../../utils/supabase';
import { format } from 'date-fns';

export default function EntregasForm() {
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const [numClientes, setNumClientes] = useState(1);
  const [formData, setFormData] = useState({
    data: format(new Date(), 'yyyy-MM-dd'),
    motorista: '',
    hora_saida: '',
    hora_retorno: '',
    km_rodado: '',
    tempo_parado_munck: '',
    clientes: [{ cliente_nome: '', produto: '', quantidade_entregue: '', valor_faturado: '', pallets_utilizados: '' }],
    observacoes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleClienteChange = (index: number, field: string, value: string) => {
    const novoClientes = [...formData.clientes];
    novoClientes[index] = { ...novoClientes[index], [field]: value };
    setFormData((prev) => ({ ...prev, clientes: novoClientes }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    try {
      const dadosFormatados = {
        ...formData,
        km_rodado: parseInt(formData.km_rodado) || 0,
        clientes: formData.clientes.map((c) => ({
          cliente_nome: c.cliente_nome,
          produto: c.produto,
          quantidade_entregue: parseInt(c.quantidade_entregue) || 0,
          valor_faturado: parseFloat(c.valor_faturado) || 0,
          pallets_utilizados: parseInt(c.pallets_utilizados) || 0,
        })),
        total_faturado: formData.clientes.reduce((sum, c) => sum + (parseFloat(c.valor_faturado) || 0), 0),
        total_pallets: formData.clientes.reduce((sum, c) => sum + (parseInt(c.pallets_utilizados) || 0), 0),
      };
      await salvarEntrega(dadosFormatados);
      setMensagem({ tipo: 'sucesso', texto: '✅ Entrega salva!' });
      setTimeout(() => setMensagem(null), 3000);
    } catch (erro: any) {
      setMensagem({ tipo: 'erro', texto: `❌ Erro: ${erro.message}` });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 space-y-6">
      <div className="bg-red-100 border-l-4 border-red-600 p-4 rounded">
        <h2 className="text-2xl font-bold text-red-900">🚛 Entregas</h2>
        <p className="text-red-700">Registro de saídas e faturamento</p>
      </div>

      {mensagem && (
        <div className={`p-4 rounded-lg font-medium ${mensagem.tipo === 'sucesso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {mensagem.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data *</label>
            <input type="date" name="data" value={formData.data} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Motorista *</label>
            <input type="text" name="motorista" value={formData.motorista} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">KM Rodado *</label>
            <input type="number" name="km_rodado" value={formData.km_rodado} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hora Saída *</label>
            <input type="time" name="hora_saida" value={formData.hora_saida} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hora Retorno *</label>
            <input type="time" name="hora_retorno" value={formData.hora_retorno} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tempo Parado Munck</label>
            <input type="text" name="tempo_parado_munck" value={formData.tempo_parado_munck} onChange={handleChange} placeholder="HH:MM" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>

        <div className="border-t-2 pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900">Clientes Entregue</h3>
            <select value={numClientes} onChange={(e) => setNumClientes(parseInt(e.target.value))} className="px-3 py-1 border border-gray-300 rounded-lg">
              {[1, 2, 3].map((n) => <option key={n} value={n}>{n} Cliente(s)</option>)}
            </select>
          </div>

          {formData.clientes.slice(0, numClientes).map((cliente, idx) => (
            <div key={idx} className="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium mb-3">Cliente {idx + 1}</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <input
                  type="text"
                  placeholder="Cliente"
                  value={cliente.cliente_nome}
                  onChange={(e) => handleClienteChange(idx, 'cliente_nome', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded text-sm"
                />
                <input
                  type="text"
                  placeholder="Produto"
                  value={cliente.produto}
                  onChange={(e) => handleClienteChange(idx, 'produto', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded text-sm"
                />
                <input
                  type="number"
                  placeholder="Qtd"
                  value={cliente.quantidade_entregue}
                  onChange={(e) => handleClienteChange(idx, 'quantidade_entregue', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded text-sm"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Valor"
                  value={cliente.valor_faturado}
                  onChange={(e) => handleClienteChange(idx, 'valor_faturado', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded text-sm"
                />
                <input
                  type="number"
                  placeholder="Pallets"
                  value={cliente.pallets_utilizados}
                  onChange={(e) => handleClienteChange(idx, 'pallets_utilizados', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
          <textarea name="observacoes" value={formData.observacoes} onChange={handleChange} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
        </div>

        <button type="submit" disabled={carregando} className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg">
          {carregando ? '⏳ Salvando...' : '✅ Salvar Entrega'}
        </button>
      </form>
    </div>
  );
}
