// src/components/CheckoutModal.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Inter } from "next/font/google";

// --- Interfaces ---
interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  quantity: number;
}
interface CompradorData {
    nome: string;
    cpf: string;
    telefone: string;
}
interface PixData {
    token: string;
    qrCodeUrl: string;
    pixCopiaECola: string;
    valor: number;
    comprador: CompradorData;
}

// --- Constantes e Funções de Utilitário ---
const USE_WEBHOOK_ONLY = false; // Reativa polling automático junto com SSE e fallback manual
const inter = Inter({ subsets: ["latin"] });
const DEBUG_CHECKOUT = process.env.NEXT_PUBLIC_DEBUG_CHECKOUT === 'true';

const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.***-**');
};
const formatPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 4) return phone;
    const ddd = digits.slice(0, 2);
    const last4 = digits.slice(-4);
    // 11+ dígitos (celular com nono dígito): (DD) *****-**1234
    if (digits.length >= 11) {
      return `(${ddd}) *****-**${last4}`;
    }
    // 10 dígitos (fixo): (DD) ****-**1234
    if (digits.length === 10) {
      return `(${ddd}) ****-**${last4}`;
    }
    // Outros comprimentos (fallback): mascarar de forma conservadora
    return `(${ddd}) ****-**${last4}`;
};

const CheckoutModal = ({ isOpen, onClose, quantity }: CheckoutModalProps) => {
  // --- Estados do Componente ---
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nome: '', email: '', cpf: '', telefone: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [isClientFound, setIsClientFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'expired' | null>('pending');
  const [isVerifying, setIsVerifying] = useState(false);
  const [paidAt, setPaidAt] = useState<string | null>(null);
  const [titles, setTitles] = useState<string[]>([]);
  const [debugEnabled, setDebugEnabled] = useState(false);
  
  // --- Refs para lógica de polling ---
  const checkStatusCallbackRef = useRef<((isSilent: boolean) => Promise<void>) | null>(null);

  
  // --- Funções de Manipulação de Eventos (com useCallback) ---
  const handleCheckPaymentStatus = useCallback(async (isSilent = false) => {
    if (USE_WEBHOOK_ONLY) return; // Modo teste: somente webhook
    if (!pixData?.token) return;

    if (!isSilent) {
        setIsVerifying(true);
        setError(null);
    }
    
    try {
        const response = await fetch('/api/payment/status', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: pixData.token }),
            cache: 'no-store' 
        });
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            if (!isSilent) throw new Error(data.message || 'Não foi possível verificar o pagamento.');
            return; // Sai silenciosamente em caso de erro na verificação automática
        }

        // A lógica principal de atualização de estado acontece aqui, para AMBOS os casos
        setPaymentStatus(data.status);

        if (data.status === 'paid') {
            setError(null); // Limpa qualquer erro anterior de 'pendente'
            if (data.titles && data.titles.length > 0) {
                setTitles(data.titles);
            }
            if (data.data?.paidAt) {
                const formattedDate = new Date(data.data.paidAt).toLocaleString('pt-BR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', second: '2-digit',
                });
                setPaidAt(formattedDate);
            }
            try {
              const w = window as unknown as { fbq?: (event: string, name: string, params?: Record<string, unknown>) => void };
              if ((data.fb?.enabled && data.fb?.sendPurchase && data.fb?.pixelId) && w.fbq) {
                w.fbq('track', 'Purchase', { value: pixData?.valor ?? 0, currency: 'BRL' });
              }
            } catch {}
        } else {
            // Mostra o erro de 'pendente' apenas se não for uma verificação silenciosa
            if (!isSilent) {
                setError("O pagamento ainda está pendente. Tente novamente em alguns instantes.");
            }
        }
    } catch (err: unknown) {
        if (!isSilent) {
            if (err instanceof Error) setError(err.message);
            else setError('Ocorreu um erro desconhecido ao verificar o pagamento.');
        }
        // Em caso de erro na verificação automática, não fazemos nada (evita spam de erros no console)
    } finally {
        if (!isSilent) {
            setIsVerifying(false);
        }
    }
  }, [pixData?.token]);

  // Atualiza a ref com a última versão da função
  useEffect(() => {
    checkStatusCallbackRef.current = handleCheckPaymentStatus;
  });

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const { name, value } = e.target;
    let maskedValue = value;
    if (name === 'cpf') {
      maskedValue = value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else if (name === 'telefone') {
      maskedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1');
    }
    setFormData(prev => ({ ...prev, [name]: maskedValue }));
  }, []);

  const handlePhoneSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneDigits = formData.telefone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
        setError('Telefone inválido. Por favor, insira um número com 10 ou 11 dígitos, incluindo o DDD.');
        return;
    }
    setError(null);
    setIsCheckingPhone(true);
    setIsClientFound(false);

    try {
      const response = await fetch('/api/clients/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone: formData.telefone }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Não foi possível verificar o telefone.');
      }

      if (data.found) {
        const maskedCpf = data.cliente.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        setFormData(prev => ({
          ...prev,
          nome: data.cliente.nome,
          email: data.cliente.email || '', // Email é opcional no bd, garantir que não seja null
          cpf: maskedCpf,
        }));
        setIsClientFound(true);
      } else {
        setIsClientFound(false);
      }
      setStep(2);

    } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
        else setError('Ocorreu um erro desconhecido ao buscar cliente.');
    } finally {
        setIsCheckingPhone(false);
    }
  }, [formData.telefone]);

  const handlePayment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const nameParts = formData.nome.trim().split(/\s+/);
    if (nameParts.length < 2) {
      setError('Por favor, insira seu nome completo (nome e sobrenome).');
      return;
    }
    setIsLoading(true);
    setError(null);
    setPixData(null);
    try {
      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          quantity: quantity,
          ...formData
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Erro ao processar o pagamento.');
      setPixData(data);
      setStep(3);
      setShowQr(window.innerWidth >= 768);
      try {
        const w = window as unknown as { fbq?: (event: string, name: string, params?: Record<string, unknown>) => void };
        if ((data.fb?.enabled && data.fb?.pixelId) && w.fbq) {
          w.fbq('track', 'InitiateCheckout', { value: data.valor, currency: 'BRL' });
        }
      } catch {}
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Ocorreu um erro desconhecido.');
    } finally {
      setIsLoading(false);
    }
  }, [formData, quantity]);
  
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    alert('Código PIX copiado para a área de transferência!');
  }, []);

  // --- Efeitos (useEffect) ---
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      setStep(1);
      setFormData({ nome: '', email: '', cpf: '', telefone: '' });
      setPixData(null);
      setTimeLeft(600);
      setShowQr(false);
      setError(null);
      setPaymentStatus('pending');
      setIsVerifying(false);
      setPaidAt(null);
      setTitles([]);
      setIsClientFound(false);
      setIsCheckingPhone(false);
      // habilita debug por env ou query ?debug=1
      try {
        const isQueryDebug = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1';
        setDebugEnabled(Boolean(DEBUG_CHECKOUT || isQueryDebug));
      } catch {
        setDebugEnabled(Boolean(DEBUG_CHECKOUT));
      }
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => { document.body.classList.remove('modal-open'); };
  }, [isOpen]);

  useEffect(() => {
    if (pixData && timeLeft > 0 && paymentStatus !== 'paid') {
      const timer = setInterval(() => setTimeLeft((prevTime) => prevTime - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [pixData, timeLeft, paymentStatus]);

  // Polling para verificação de pagamento automático
  useEffect(() => {
    if (USE_WEBHOOK_ONLY) return; // Sem polling no modo webhook-only
    if (pixData && paymentStatus === 'pending' && timeLeft > 0) {
      const interval = setInterval(() => {
        checkStatusCallbackRef.current?.(true);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [pixData, paymentStatus, timeLeft]);

  // SSE: escuta confirmação push do servidor para esta transação
  useEffect(() => {
    if (!pixData?.token || paymentStatus === 'paid') return;
    const es = new EventSource(`/api/payment/stream?id=${encodeURIComponent(pixData.token)}`);
    es.addEventListener('paid', (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data);
        setPaymentStatus('paid');
        if (payload?.titles?.length) setTitles(payload.titles);
        if (payload?.paidAt) {
          const formattedDate = new Date(payload.paidAt).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
          });
          setPaidAt(formattedDate);
        }
      } catch {}
      es.close();
    });
    es.addEventListener('timeout', () => es.close());
    es.addEventListener('error', () => es.close());
    return () => es.close();
  }, [pixData?.token, paymentStatus]);


  // --- Lógica de Renderização ---
  if (!isOpen) {
    return null;
  }
  
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <form className="space-y-2" onSubmit={handlePhoneSubmit}>
              <div>
                  <label htmlFor="telefone" className="block text-sm font-semibold text-gray-800 mb-1">Informe seu telefone</label>
                  <input type="tel" id="telefone" name="telefone" value={formData.telefone} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-base" placeholder="(00) 00000-0000" inputMode="numeric" maxLength={15} />
                  {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
              </div>
              <button type="submit" className="w-full bg-[#1db954] hover:bg-[#1aa34a] text-white font-bold py-2 px-4 rounded-lg flex justify-center items-center space-x-2 transition-colors disabled:bg-gray-400 text-sm" disabled={!formData.telefone || isCheckingPhone}>
                  {isCheckingPhone ? (
                      <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Verificando...</span></>
                  ) : (
                      <><span>Continuar</span><i className="bi bi-arrow-right"></i></>
                  )}
              </button>
          </form>
        );
      case 2:
        return (
            <form className="space-y-2" onSubmit={handlePayment}>
                {isClientFound && (
                    <div className="bg-blue-100 border-l-4 border-blue-400 text-blue-800 p-2 text-sm rounded-r-md mb-2">
                        <i className="bi bi-person-check-fill mr-2"></i>
                        Olá de volta! Por favor, confirme seus dados.
                    </div>
                )}
                <div>
                    <label htmlFor="nome" className="block text-sm font-semibold text-gray-800 mb-1">Nome Completo</label>
                    <input type="text" id="nome" name="nome" value={formData.nome} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-base" placeholder="Seu nome completo" />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-1">E-mail</label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-base" placeholder="seu@email.com" />
                </div>
                <div>
                    <label htmlFor="cpf" className="block text-sm font-semibold text-gray-800 mb-1">CPF</label>
                    <input type="text" id="cpf" name="cpf" value={formData.cpf} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-base" placeholder="000.000.000-00" inputMode="numeric" maxLength={14} />
                </div>
                {error && <div className="bg-red-100 border-l-4 border-red-400 text-red-800 p-2 text-sm rounded-r-md"><i className="bi bi-x-circle-fill mr-2"></i>{error}</div>}
                <button type="submit" className="w-full bg-[#1db954] hover:bg-[#1aa34a] text-white font-bold py-2 px-4 rounded-lg flex justify-center items-center space-x-2 transition-colors disabled:bg-gray-400 text-sm" disabled={isLoading || !formData.nome || !formData.email || !formData.cpf}>
                    {isLoading ? (
                        <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Gerando Pagamento...</span></>
                    ) : (
                        <><span>Finalizar e Pagar</span><i className="bi bi-arrow-right"></i></>
                    )}
                </button>
            </form>
        );
      case 3:
        return (
            <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                {paymentStatus === 'paid' ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex flex-col items-center text-center space-y-2">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <i className="bi bi-check-lg text-green-600 text-2xl"></i>
                        </div>
                        <h3 className="text-base font-bold text-gray-800">Pagamento confirmado</h3>
                        <p className="text-xs text-gray-600">Seu pagamento foi aprovado. Os títulos aparecem abaixo nos detalhes.</p>
                        {/* Removido "Confirmado em" conforme solicitação */}
                    </div>
                ) : (
                    <>
                        <div className="text-center p-2">
                            <p className="text-sm text-gray-600">Você tem <b className="text-red-500">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</b> para pagar</p>
                        </div>
                        {debugEnabled && (
                          <div className="text-center">
                            <button
                              onClick={() => {
                                setPaymentStatus('paid');
                                const gen = Array.from({ length: Math.max(1, quantity) }, () => (
                                  Math.floor(100000 + Math.random() * 900000).toString()
                                ));
                                setTitles(gen);
                                const now = new Date();
                                setPaidAt(now.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
                              }}
                              className="inline-flex items-center text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                            >
                              <i className="bi bi-bug-fill mr-1"></i>
                              Simular pagamento (debug)
                            </button>
                          </div>
                        )}
                        <div className="text-center">
                            <button onClick={() => setShowQr(!showQr)} className="text-sm text-gray-600 font-semibold hover:text-black">
                                <i className={`bi ${showQr ? 'bi-eye-slash' : 'bi-qr-code'}`}></i>
                                {showQr ? ' Ocultar QR Code' : ' Exibir QR Code'}
                            </button>
                        </div>
                        {showQr && (
                        <div className="flex justify-center">
                            <Image src={pixData!.qrCodeUrl} alt="QR Code PIX" width={200} height={200} className="border-4 border-green-400 rounded-lg"/>
                        </div>
                        )}
                        <div className="bg-white p-3 rounded-md shadow-sm border border-gray-200 space-y-3 text-sm">
                            <div className="flex items-center space-x-2">
                                <span className="flex items-center justify-center w-5 h-5 bg-gray-200 text-gray-700 rounded-full font-bold text-xs shrink-0">1</span>
                                <p className="font-semibold text-gray-700">Copie o código PIX abaixo.</p>
                            </div>
                            <div className="bg-gray-100 p-2 rounded-md flex items-center justify-between">
                                <span className="text-xs font-mono text-green-700 truncate mr-2">{pixData!.pixCopiaECola}</span>
                                <button onClick={() => copyToClipboard(pixData!.pixCopiaECola)} className="bg-gray-200 text-gray-700 px-2 py-1 rounded-md text-xs font-semibold hover:bg-gray-300 transition-colors flex items-center space-x-1 shrink-0">
                                <i className="bi bi-clipboard-check"></i>
                                <span>Copiar</span>
                                </button>
                            </div>
                        </div>
                        <div className="bg-white p-3 rounded-md shadow-sm border border-gray-200 space-y-2 text-xs text-gray-600">
                            <div className="flex items-start space-x-2"><span className="flex items-center justify-center w-5 h-5 bg-gray-200 text-gray-700 rounded-full font-bold text-xs mt-1 shrink-0">2</span><p>Abra o app do seu banco e escolha a opção PIX.</p></div>
                            <div className="flex items-start space-x-2"><span className="flex items-center justify-center w-5 h-5 bg-gray-200 text-gray-700 rounded-full font-bold text-xs mt-1 shrink-0">3</span><p>Selecione PIX cópia e cola, cole a chave e confirme.</p></div>
                        </div>
                        {paymentStatus === 'pending' && timeLeft === 0 && (
                             <div className="bg-red-100 border-l-4 border-red-400 text-red-800 p-2 text-xs rounded-r-md">
                                O tempo para pagamento expirou. Por favor, gere um novo pedido.
                             </div>
                        )}
                        {error && !USE_WEBHOOK_ONLY && <div className="bg-red-100 border-l-4 border-red-400 text-red-800 p-2 text-sm rounded-r-md mb-2"><i className="bi bi-x-circle-fill mr-2"></i>{error}</div>}

                        {USE_WEBHOOK_ONLY ? (
                          <div className="text-center text-xs text-gray-600 mt-2">
                            Aguardando confirmação automática do pagamento. Você também verá seus títulos em &quot;Meus títulos&quot; assim que for aprovado.
                          </div>
                        ) : (
                          timeLeft > 0 && (
                            <button onClick={() => handleCheckPaymentStatus(false)} disabled={isVerifying} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-lg flex items-center justify-center space-x-2 text-sm transition-colors disabled:bg-green-800">
                                {isVerifying ? (
                                    <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Verificando...</span></>
                                ) : (
                                    <><i className="bi bi-check-circle-fill"></i><span>Já fiz o pagamento</span></>
                                )}
                            </button>
                          )
                        )}
                    </>
                )}
                <div className="bg-white p-3 rounded-md shadow-sm border border-gray-200 space-y-1 text-sm">
                    <h4 className="font-bold text-gray-800 border-b pb-1 mb-2">Detalhes da sua compra</h4>
                    <p className="text-xs text-gray-500 break-words"><b>ID:</b> {pixData!.token}</p>
                    <p className="text-xs text-gray-700"><b>Comprador:</b> {pixData!.comprador.nome}</p>
                    <p className="text-xs text-gray-700"><b>CPF:</b> {formatCPF(pixData!.comprador.cpf)}</p>
                    <p className="text-xs text-gray-700"><b>Telefone:</b> {formatPhone(pixData!.comprador.telefone)}</p>
                    <p className="text-xs text-gray-700"><b>Situação:</b> 
                        {paymentStatus === 'pending' && <span className="font-semibold text-yellow-600"> Aguardando pagamento</span>}
                        {paymentStatus === 'paid' && <span className="font-semibold text-green-600"> Pagamento confirmado</span>}
                        {paymentStatus === 'expired' && <span className="font-semibold text-red-600"> Expirado</span>}
                    </p>
                    {paidAt && <p className="text-xs text-gray-700"><b>Data do Pagamento:</b> {paidAt}</p>}
                    <p className="text-xs text-gray-700"><b>Quantidade:</b> {quantity}</p>
                    <p className="text-xs font-bold text-gray-800"><b>Total:</b> {pixData!.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    <div className="text-xs text-gray-700">
                        <b>Títulos:</b>
                        {titles.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mt-1">
                                {titles.map((title, index) => (
                                    <span key={index} className="bg-blue-100 text-blue-800 font-semibold px-2 py-1 rounded-md text-xs">
                                        {title}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <span className="text-gray-500"> Os títulos serão adicionados após o pagamento</span>
                        )}
                    </div>
                </div>
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`fixed inset-0 bg-black/80 z-50 flex justify-center items-center p-4 overflow-y-auto h-screen w-screen ${inter.className}`}>
      <div className="bg-gray-50 rounded-lg shadow-xl w-full max-w-lg mx-auto" onClick={(e) => e.stopPropagation()}>
        <div className="relative text-center p-3 border-b border-gray-200">
          <h5 className="font-semibold text-gray-800">Checkout</h5>
          <button onClick={onClose} className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <i className="bi bi-x text-2xl"></i>
          </button>
        </div>
        <div className="p-2 space-y-2">
            <div className="bg-gray-100 p-2 rounded-md text-sm text-gray-600 flex items-center space-x-3">
                <div className="relative w-24 h-16 shrink-0">
                    <Image
                        src="https://s3.incrivelsorteios.com/redimensiona?key=600x600/20250731_688b54af15d40.jpg"
                        alt="Prêmio"
                        fill
                        className="rounded-md object-cover"
                    />
                </div>
                <p>
                    <b className="font-semibold text-gray-800">{quantity}</b> unidade(s) do produto <b className="font-semibold text-gray-800">EDIÇÃO 76 - NOVO TERA 2026 0KM</b>
                </p>
            </div>
            {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
