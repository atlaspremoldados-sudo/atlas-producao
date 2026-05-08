// src/App.tsx

import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Maq01Form from './components/Formularios/Maq01Form';
import Maq02Form from './components/Formularios/Maq02Form';
import Maq03Form from './components/Formularios/Maq03Form';
import DesformaPaletizacaoMaq02 from './components/Formularios/DesformaPaletizacaoMaq02';
import PaletizacaoMaq01 from './components/Formularios/PaletizacaoMaq01';
import EntregasForm from './components/Formularios/EntregasForm';
import FuncionariosForm from './components/Formularios/FuncionariosForm';

type FormAtiva = 'maq01' | 'maq02' | 'maq03' | 'desforma-maq02' | 'paletizacao-maq01' | 'entregas' | 'funcionarios';

export default function App() {
  const [formAtiva, setFormAtiva] = useState<FormAtiva>('maq01');
  const [menuAberto, setMenuAberto] = useState(false);

  const formularios = [
    { id: 'maq01' as FormAtiva, nome: '📦 Máq 01', cor: 'bg-blue-600' },
    { id: 'maq02' as FormAtiva, nome: '🟨 Máq 02', cor: 'bg-yellow-600' },
    { id: 'maq03' as FormAtiva, nome: '🔷 Máq 03', cor: 'bg-purple-600' },
    { id: 'desforma-maq02' as FormAtiva, nome: '📋 Desforma Maq02', cor: 'bg-green-600' },
    { id: 'paletizacao-maq01' as FormAtiva, nome: '📦 Paletização Maq01', cor: 'bg-indigo-600' },
    { id: 'entregas' as FormAtiva, nome: '🚛 Entregas', cor: 'bg-red-600' },
    { id: 'funcionarios' as FormAtiva, nome: '👥 Funcionários', cor: 'bg-gray-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 to-blue-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">ATLAS Produção</h1>
            <span className="text-sm text-blue-200">Sistema Web</span>
          </div>
          
          {/* Desktop Menu */}
          <nav className="hidden md:flex gap-2">
            {formularios.map((form) => (
              <button
                key={form.id}
                onClick={() => setFormAtiva(form.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  formAtiva === form.id
                    ? `${form.cor} text-white shadow-lg`
                    : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
              >
                {form.nome}
              </button>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuAberto(!menuAberto)}
            className="md:hidden p-2 hover:bg-blue-800 rounded"
          >
            {menuAberto ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuAberto && (
          <nav className="md:hidden bg-blue-800 px-4 py-3 space-y-2">
            {formularios.map((form) => (
              <button
                key={form.id}
                onClick={() => {
                  setFormAtiva(form.id);
                  setMenuAberto(false);
                }}
                className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-all ${
                  formAtiva === form.id
                    ? `${form.cor} text-white`
                    : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
              >
                {form.nome}
              </button>
            ))}
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Maq01 */}
        {formAtiva === 'maq01' && <Maq01Form />}

        {/* Maq02 */}
        {formAtiva === 'maq02' && <Maq02Form />}

        {/* Maq03 */}
        {formAtiva === 'maq03' && <Maq03Form />}

        {/* Desforma Maq02 */}
        {formAtiva === 'desforma-maq02' && <DesformaPaletizacaoMaq02 />}

        {/* Paletização Maq01 */}
        {formAtiva === 'paletizacao-maq01' && <PaletizacaoMaq01 />}

        {/* Entregas */}
        {formAtiva === 'entregas' && <EntregasForm />}

        {/* Funcionários */}
        {formAtiva === 'funcionarios' && <FuncionariosForm />}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white text-center py-4 mt-12">
        <p className="text-sm">
          ATLAS PRÉ-MOLDADOS © 2026 | Sistema Web de Gestão de Produção
        </p>
      </footer>
    </div>
  );
}
