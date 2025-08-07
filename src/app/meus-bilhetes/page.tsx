// src/app/meus-bilhetes/page.tsx
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

const MeusBilhetesPage = () => {
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
      const response = await fetch('/api/bilhetes/lookup', {
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
      <main className="flex-grow container mx-auto max-w-2xl p-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">Consulte seus Bilhetes</h1>
          <p className="text-center text-gray-600 mb-6">
            Digite seu CPF para ver todas as suas compras e números da sorte.
          </p>
          
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-2 mb-8">
            <input
              type="text"
              value={cpf}
              onChange={handleCpfChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="000.000.000-00"
              maxLength={14}
              required
            />
            <button
              type="submit"
              disabled={isLoading || cpf.length < 14}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Buscando...' : 'Buscar'}
            </button>
          </form>

          {isLoading && <div className="text-center">Carregando...</div>}
          
          {error && <div className="bg-red-100 text-red-700 p-3 rounded-md text-center">{error}</div>}

          {!isLoading && searched && compras.length === 0 && !error && (
            <div className="bg-yellow-100 text-yellow-800 p-3 rounded-md text-center">
              Nenhuma compra encontrada para o CPF informado.
            </div>
          )}

          <div className="space-y-6">
            {compras.map((compra) => (
              <div key={compra.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3 pb-2 border-b">
                  <div>
                    <p className="text-sm text-gray-500">
                      Compra realizada em: {new Date(compra.created_at).toLocaleString('pt-BR')}
                    </p>
                    <p className={`text-sm font-bold ${compra.status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                      Status: {compra.status === 'paid' ? 'Pagamento Confirmado' : 'Aguardando Pagamento'}
                    </p>
                  </div>
                  <div className="text-right">
                     <p className="text-lg font-semibold text-gray-800">
                        {compra.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                     </p>
                     <p className="text-sm text-gray-600">{compra.quantidade_bilhetes} bilhetes</p>
                  </div>
                </div>
                
                {compra.status === 'paid' && compra.bilhetes.length > 0 ? (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Seus números da sorte:</h3>
                    <div className="flex flex-wrap gap-2">
                      {compra.bilhetes.map((bilhete) => (
                        <span key={bilhete.numero} className="bg-blue-100 text-blue-800 font-mono font-semibold px-3 py-1 rounded-md text-sm">
                          {bilhete.numero}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 text-sm py-2">
                    Os bilhetes serão exibidos aqui assim que o pagamento for confirmado.
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

export default MeusBilhetesPage;

