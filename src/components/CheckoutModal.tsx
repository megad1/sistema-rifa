// src/components/CheckoutModal.tsx
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';

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

const TICKET_PRICE = 0.11;

// Funções de formatação
const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.***-**');
};

const formatPhone = (phone: string) => {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) *****-**$3');
};

import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

const CheckoutModal = ({ isOpen, onClose, quantity }: CheckoutModalProps) => {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutos em segundos

  useEffect(() => {
    // Bloquear o scroll do body quando o modal estiver aberto
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Resetar estados quando o modal for reaberto
      setPixData(null);
      setTimeLeft(600);
      setShowQr(false);
      setPhone('');
      setError(null);
    } else {
      document.body.style.overflow = 'auto';
    }
    // Limpeza ao desmontar o componente
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  useEffect(() => {
    if (pixData && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [pixData, timeLeft]);

  if (!isOpen) {
    return null;
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setPixData(null);

    try {
      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          valor: quantity * TICKET_PRICE,
          telefone: phone,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erro ao processar o pagamento.');
      }
      
      setPixData(data);
      // Ocultar QR Code por padrão em telas menores (mobile)
      setShowQr(window.innerWidth >= 768);

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocorreu um erro desconhecido.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Código PIX copiado para a área de transferência!');
  }
  
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className={`fixed inset-0 bg-black/80 z-50 flex justify-center items-center p-4 overflow-y-auto ${inter.className}`}>
      {/* Aplicando o mesmo padrão de container da página */}
      <div className="bg-gray-50 rounded-lg shadow-xl w-full max-w-lg mx-auto" onClick={(e) => e.stopPropagation()}>
        <div className="relative text-center p-3 border-b border-gray-200">
          <h5 className="font-semibold text-gray-800">Checkout</h5>
          <button onClick={onClose} className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <i className="bi bi-x text-2xl"></i>
          </button>
        </div>

        <div className="p-2 space-y-2">
            <div className="bg-gray-100 p-2 rounded-md text-sm text-gray-600 flex items-center space-x-3">
                <div className="relative w-16 h-16 shrink-0">
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

            {pixData ? (
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
                    <Image src={pixData.qrCodeUrl} alt="QR Code PIX" width={200} height={200} className="border-4 border-green-400 rounded-lg"/>
                </div>
                )}
                
                <div className="bg-white p-3 rounded-md shadow-sm border border-gray-200 space-y-3 text-sm">
                    <div className="flex items-center space-x-2">
                        <span className="flex items-center justify-center w-5 h-5 bg-gray-200 text-gray-700 rounded-full font-bold text-xs shrink-0">1</span>
                        <p className="font-semibold text-gray-700">Copie o código PIX abaixo.</p>
                    </div>
                    <div className="bg-gray-100 p-2 rounded-md flex items-center justify-between">
                        <span className="text-xs font-mono text-green-700 truncate mr-2">{pixData.pixCopiaECola}</span>
                        <button onClick={() => copyToClipboard(pixData.pixCopiaECola)} className="bg-gray-200 text-gray-700 px-2 py-1 rounded-md text-xs font-semibold hover:bg-gray-300 transition-colors flex items-center space-x-1 shrink-0">
                        <i className="bi bi-clipboard-check"></i>
                        <span>Copiar</span>
                        </button>
                    </div>
                </div>
                
                <div className="bg-white p-3 rounded-md shadow-sm border border-gray-200 space-y-2 text-xs text-gray-600">
                    <div className="flex items-start space-x-2"><span className="flex items-center justify-center w-5 h-5 bg-gray-200 text-gray-700 rounded-full font-bold text-xs mt-1 shrink-0">2</span><p>Abra o app do seu banco e escolha a opção PIX, como se fosse fazer uma transferência.</p></div>
                    <div className="flex items-start space-x-2"><span className="flex items-center justify-center w-5 h-5 bg-gray-200 text-gray-700 rounded-full font-bold text-xs mt-1 shrink-0">3</span><p>Selecione a opção PIX cópia e cola, cole a chave copiada e confirme o pagamento.</p></div>
                </div>

                <div className="bg-yellow-100 border-l-4 border-yellow-400 text-yellow-800 p-2 text-xs rounded-r-md">
                    Este pagamento só pode ser realizado dentro do tempo, após este período, caso o pagamento não for confirmado os números voltam a ficar disponíveis.
                </div>

                <button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-lg flex items-center justify-center space-x-2 text-sm">
                    <i className="bi bi-check-circle-fill"></i>
                    <span>Já fiz o pagamento</span>
                </button>
                
                <div className="bg-blue-100 border-l-4 border-blue-400 text-blue-800 p-2 text-xs rounded-r-md text-center">
                    <i className="bi bi-info-circle-fill mr-1"></i>
                    Aguarde até 5 minutos para a confirmação.
                </div>

                <div className="bg-white p-3 rounded-md shadow-sm border border-gray-200 space-y-1 text-sm">
                    <h4 className="font-bold text-gray-800 border-b pb-1 mb-2">Detalhes da sua compra</h4>
                    <p className="text-xs text-gray-500 break-words"><b>ID:</b> {pixData.token}</p>
                    <p className="text-xs text-gray-700"><b>Comprador:</b> {pixData.comprador.nome}</p>
                    <p className="text-xs text-gray-700"><b>CPF:</b> {formatCPF(pixData.comprador.cpf)}</p>
                    <p className="text-xs text-gray-700"><b>Telefone:</b> {formatPhone(pixData.comprador.telefone)}</p>
                    <p className="text-xs text-gray-700"><b>Situação:</b> <span className="font-semibold text-yellow-600">Aguardando pagamento</span></p>
                    <p className="text-xs text-gray-700"><b>Quantidade:</b> {quantity}</p>
                    <p className="text-xs font-bold text-gray-800"><b>Total:</b> {pixData.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>

            </div>
            ) : (
            <form className="space-y-2" onSubmit={handlePayment}>
                <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-800 mb-1">Informe seu telefone</label>
                    <input type="tel" id="phone" name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-sm" placeholder="(00) 00000-0000" disabled={isLoading} />
                </div>

                {error && <div className="bg-red-100 border-l-4 border-red-400 text-red-800 p-2 text-sm rounded-r-md"><i className="bi bi-x-circle-fill mr-2"></i>{error}</div>}
                
                {!phone && <div className="bg-yellow-100 border-l-4 border-yellow-400 text-yellow-800 p-2 text-sm rounded-r-md"><i className="bi bi-exclamation-circle-fill mr-2"></i>Informe seu telefone para continuar.</div>}

                <button type="submit" className="w-full bg-[#1db954] hover:bg-[#1aa34a] text-white font-bold py-2 px-4 rounded-lg flex justify-center items-center space-x-2 transition-colors disabled:bg-gray-400 text-sm" disabled={isLoading || !phone}>
                    {isLoading ? (
                        <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Processando...</span></>
                    ) : (
                        <><span>Continuar</span><i className="bi bi-arrow-right"></i></>
                    )}
                </button>
            </form>
            )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
