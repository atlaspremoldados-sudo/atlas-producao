// src/components/Formularios/Maq01Form.tsx

import React, { useState } from 'react';
import { PRODUTOS_MAQ01, TURNOS } from '../../types/producao';
import { salvarProducaoMaq01 } from '../../utils/supabase';
import { format } from 'date-fns';

export default function Maq01Form() {
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const [formData, setFormData] = useState({
    data: format(new Date(), 'yyyy-MM-dd'),
    turno: 'Manhã',
    produto: PRODUTOS_MAQ01[0],
    hora_inicio: '',
    hora_fim_mistura: '',
    hora_fim_maquina: '',
    hora_fim_limpeza: '',
    numero_tabuas: '',
    quantidade_cura: '',
    cimento_sacos: '',
    areia: '',
    po_brita: '',
    aditivo: '',
    observacoes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setMensagem(null);

    try {
      const dadosFormatados = {
        ...formData,
        numero_tabuas: parseInt(formData.numero_tabuas) || 0,
        quantidade_cura: parseInt(formData.quantidade_cura) || 0,
        cimento_sacos: parseFloat(formData.cimento_sacos) || 0,
        areia: parseFloat(formData.areia) || 0,
        po_brita: parseFloat(formData.po_brita) || 0,
        aditivo: parseFloat(formData.aditivo) || 0,
      };

      await salvarProducaoMaq01(dadosFormatados);

      setMensagem({
        tipo: 'sucesso',
        texto: '✅ Produção Maq01 salva com sucesso!',
      });

      // Resetar formulário
      setFormData({
        data: format(new Date(), 'yyyy-MM-dd'),
        turno: 'Manhã',
        produto: PRODUTOS_MAQ01[0],
        hora_inicio: '',
        hora_fim_mistura: '',
        hora_fim_maquina: '',
        hora_fim_limpeza: '',
        numero_tabuas: '',
        quantidade_cura: '',
        cimento_sacos: '',
        areia: '',
        po_brita: '',
        aditivo: '',
        observacoes: '',
      });

      // Limpar mensagem após 3 segundos
      setTimeout(() => setMensagem(null), 3000);
    } catch (erro: any) {
      setMensagem({
        tipo: 'erro',
        texto: `❌ Erro: ${erro.message}`,
      });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 space-y-6">
      <div className="bg-blue-100 border-l-4 border-blue-600 p-4 rounded">
        <h2 className="text-2xl font-bold text-blue-900">📦 Máquina 01</h2>
        <p className="text-blue-700">Blocos e Canaletas (Massa Seca)</p>
      </div>

      {/* Mensagens */}
      {mensagem && (
        <div
          className={`p-4 rounded-lg font-medium ${
            mensagem.tipo === 'sucesso'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {mensagem.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Row 1: Data e Turno */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data *
            </label>
            <input
              type="date"
              name="data"
              value={formData.data}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Turno *
            </label>
            <select
              name="turno"
              value={formData.turno}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {TURNOS.map((turno) => (
                <option key={turno} value={turno}>
                  {turno}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Produto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Produto *
          </label>
          <select
            name="produto"
            value={formData.produto}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {PRODUTOS_MAQ01.map((produto) => (
              <option key={produto} value={produto}>
                {produto}
              </option>
            ))}
          </select>
        </div>

        {/* Row 3: Horários */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <h3 className="font-medium text-gray-900">Horários</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Hora Início *
              </label>
              <input
                type="time"
                name="hora_inicio"
                value={formData.hora_inicio}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Fim Mistura *
              </label>
              <input
                type="time"
                name="hora_fim_mistura"
                value={formData.hora_fim_mistura}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Fim Máquina *
              </label>
              <input
                type="time"
                name="hora_fim_maquina"
                value={formData.hora_fim_maquina}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Fim Limpeza *
              </label>
              <input
                type="time"
                name="hora_fim_limpeza"
                value={formData.hora_fim_limpeza}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Row 4: Produção */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <h3 className="font-medium text-gray-900">Resultado Produção</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Tábuas *
              </label>
              <input
                type="number"
                name="numero_tabuas"
                value={formData.numero_tabuas}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantidade para Cura (blocos) *
              </label>
              <input
                type="number"
                name="quantidade_cura"
                value={formData.quantidade_cura}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Row 5: Insumos */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <h3 className="font-medium text-gray-900">Insumos Utilizados</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Cimento (sacos)
              </label>
              <input
                type="number"
                step="0.1"
                name="cimento_sacos"
                value={formData.cimento_sacos}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Areia (ton)
              </label>
              <input
                type="number"
                step="0.1"
                name="areia"
                value={formData.areia}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Pó de Brita (ton)
              </label>
              <input
                type="number"
                step="0.1"
                name="po_brita"
                value={formData.po_brita}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Aditivo (kg)
              </label>
              <input
                type="number"
                step="0.01"
                name="aditivo"
                value={formData.aditivo}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Row 6: Observações */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observações (opcional)
          </label>
          <textarea
            name="observacoes"
            value={formData.observacoes}
            onChange={handleChange}
            placeholder="Adicione observações relevantes..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={carregando}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-all"
          >
            {carregando ? '⏳ Salvando...' : '✅ Salvar Produção'}
          </button>
        </div>
      </form>
    </div>
  );
}
