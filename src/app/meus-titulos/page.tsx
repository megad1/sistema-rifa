// src/app/meus-titulos/page.tsx
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
    setIsLoading(true);
    setError(null);
    setCompras([]);
    setSearched(true);

    try {
      const response = await fetch('/api/titulos/lookup', { // <-- Rota ajustada
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: cpf.replace(/\D/g, '') }), // Envia CPF sem máscara
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erro ao buscar suas compras.');
      }

      setCompras(data.compras);

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocorreu um erro desconhecido.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#ebebeb] min-h-screen flex flex-col">
      <Header />
      {/* O container principal agora imita o da página inicial */}
      <main className="flex-grow container mx-auto max-w-lg px-4 mt-2 space-y-2">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h1 className="text-xl font-bold text-center text-gray-800 mb-2">Consulte seus Títulos</h1>
          <p className="text-center text-gray-600 mb-4 text-sm">
            Digite seu CPF para ver todas as suas compras e números da sorte.
          </p>
          
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-2 mb-6">
            <input
              type="text"
              value={cpf}
              onChange={handleCpfChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="000.000.000-00"
              maxLength={14}
              required
            />
            <button
              type="submit"
              disabled={isLoading || cpf.length < 14}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex-shrink-0"
            >
              {isLoading ? 'Buscando...' : 'Buscar'}
            </button>
          </form>

          {isLoading && (
            <div className="flex justify-center items-center p-4">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <span>Carregando...</span>
            </div>
          )}
          
          {error && <div className="bg-red-100 text-red-700 p-3 rounded-md text-center text-sm">{error}</div>}

          {!isLoading && searched && compras.length === 0 && !error && (
            <div className="bg-yellow-100 text-yellow-800 p-3 rounded-md text-center text-sm">
              Nenhuma compra paga foi encontrada para o CPF informado.
            </div>
          )}

          <div className="space-y-4">
            {compras.map((compra) => (
              <div key={compra.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="grid grid-cols-2 gap-2 mb-3 pb-2 border-b">
                  <div>
                    <p className="text-xs text-gray-500">
                      {new Date(compra.created_at).toLocaleString('pt-BR')}
                    </p>
                    <p className={`text-sm font-bold ${compra.status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {compra.status === 'paid' ? 'Confirmado' : 'Aguardando'}
                    </p>
                  </div>
                  <div className="text-right">
                     <p className="text-md font-semibold text-gray-800">
                        {compra.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                     </p>
                     <p className="text-xs text-gray-600">{compra.quantidade_bilhetes} títulos</p>
                  </div>
                </div>
                
                {compra.status === 'paid' && compra.bilhetes.length > 0 ? (
                  <div>
                    <div className="flex flex-wrap gap-1">
                      {compra.bilhetes.map((bilhete) => (
                        <span key={bilhete.numero} className="bg-blue-100 text-blue-800 font-mono font-semibold px-2 py-1 rounded-md text-xs">
                          {bilhete.numero}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 text-xs py-1">
                    Seus títulos serão exibidos aqui após a confirmação do pagamento.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MeusTitulosPage;

