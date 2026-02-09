'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// --- Interfaces ---
interface Bilhete {
  numero: string;
}

interface Compra {
  id: string;
  created_at: string;
  quantidade_bilhetes: number;
  valor_total: number;
  status: string;
  bilhetes: Bilhete[];
}

const MeusTitulosPage = () => {
  const [cpf, setCpf] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [searched, setSearched] = useState(false);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Máscara de CPF
    const maskedValue = value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    setCpf(maskedValue);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cpf.length < 14) return;

    setIsLoading(true);
    setError(null);
    setCompras([]);
    setSearched(true);

    try {
      const res = await fetch('/api/titulos/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: cpf.replace(/\D/g, '') }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Erro ao buscar suas compras.');
      }

      // Vamos garantir que 'bilhetes' seja sempre array
      const comprasFormatadas = (data.compras || []).map((c: Compra) => ({
        ...c,
        bilhetes: c.bilhetes || []
      }));

      setCompras(comprasFormatadas);

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocorreu um erro ao buscar. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#f5f5f5] min-h-screen flex flex-col font-sans" style={{ fontFamily: 'Ubuntu, ui-sans-serif, system-ui, sans-serif' }}>
      <Header />

      <main className="flex-grow container mx-auto max-w-lg px-4 py-6 pb-24">

        {/* Cartão de Busca */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600 shadow-sm">
              <i className="bi bi-search text-3xl"></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Consultar bilhetes</h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              Informe seu CPF abaixo para localizar suas compras e visualizar seus números da sorte.
            </p>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 ml-1">CPF do titular</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <i className="bi bi-person-vcard text-xl"></i>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={cpf}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-lg shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || cpf.length < 14}
              className="w-full bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 text-lg disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <span>Buscando...</span>
                </>
              ) : (
                <>
                  <span>Buscar meus títulos</span>
                  <i className="bi bi-arrow-right"></i>
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-center text-sm flex items-center justify-center gap-2">
              <i className="bi bi-exclamation-circle-fill"></i>
              {error}
            </div>
          )}
        </div>

        {/* Resultados */}
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {!isLoading && searched && compras.length === 0 && !error && (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
              <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-500">
                <i className="bi bi-emoji-frown text-3xl"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Nenhuma compra encontrada</h3>
              <p className="text-gray-500 text-sm">Verifique se o CPF digitado está correto ou se a compra já foi confirmada.</p>
            </div>
          )}

          {compras.map((compra) => (
            <div key={compra.id} className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 relative overflow-hidden group hover:shadow-lg transition-shadow">

              {/* Header do Card */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
                    Realizada em {new Date(compra.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    {compra.quantidade_bilhetes} {compra.quantidade_bilhetes === 1 ? 'Cota' : 'Cotas'}
                  </h3>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm flex items-center gap-1.5 ${compra.status === 'paid' ? 'bg-green-100 text-green-700' :
                  compra.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }`}>
                  <i className={`bi ${compra.status === 'paid' ? 'bi-check-circle-fill' :
                    compra.status === 'pending' ? 'bi-clock-fill' : 'bi-x-circle-fill'
                    }`}></i>
                  {compra.status === 'paid' ? 'Confirmado' :
                    compra.status === 'pending' ? 'Pendente' : 'Cancelado'}
                </div>
              </div>

              {/* Valor */}
              <div className="mb-4 bg-gray-50 rounded-xl p-3 flex justify-between items-center border border-gray-100">
                <span className="text-sm font-semibold text-gray-600">Valor total</span>
                <span className="text-lg font-bold text-gray-900">{compra.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>

              {/* Títulos */}
              <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100/50">
                <p className="text-xs font-bold text-blue-800 uppercase mb-3 flex items-center gap-1.5">
                  <i className="bi bi-ticket-perforated-fill"></i>
                  Seus números da sorte
                </p>

                {compra.status === 'paid' && compra.bilhetes.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {compra.bilhetes.map((bilhete) => (
                      <span key={bilhete.numero} className="bg-white border border-blue-100 text-blue-900 font-mono font-bold text-sm px-2.5 py-1.5 rounded-lg shadow-sm flex-grow-0">
                        {bilhete.numero}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-white/50 rounded-lg border border-dashed border-blue-200">
                    <p className="text-sm text-gray-500 font-medium">
                      {compra.status === 'pending'
                        ? 'Aguardando confirmação do pagamento...'
                        : 'Nenhum título disponível.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

      </main>
      <Footer />
    </div>
  );
};

export default MeusTitulosPage;
