// src/components/PurchaseSection.tsx
"use client";

import { useState, useEffect } from 'react';
import CheckoutModal from './CheckoutModal'; // Importando o modal
import { MAX_PIX_TOTAL_BR } from '@/config/payments';
import { getCampaignSettings } from '@/lib/campaign';

type Props = { ticketPrice?: number; drawLabel?: string; campaignTitle?: string; campaignImage?: string };

const PurchaseSection = ({ ticketPrice: ticketPriceProp, drawLabel: drawLabelProp, campaignTitle: campaignTitleProp, campaignImage: campaignImageProp }: Props) => {
  const [quantity, setQuantity] = useState(15);
  const [totalPrice, setTotalPrice] = useState(0);
  const [hasMounted, setHasMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para o modal
  const [ticketPrice, setTicketPrice] = useState<number>(ticketPriceProp ?? 0.11);
  const [drawLabel, setDrawLabel] = useState<string>(drawLabelProp ?? '');
  const [bannerReady, setBannerReady] = useState(false);
  const [spins, setSpins] = useState<number>(Math.floor(15 / 5));
  const [spinsBump, setSpinsBump] = useState(false);
  const [campaignTitle, setCampaignTitle] = useState<string>(campaignTitleProp ?? '');
  const [campaignImage, setCampaignImage] = useState<string>(campaignImageProp ?? '');
  const MAX_QUANTITY = 200;

  useEffect(() => {
    setHasMounted(true);
    setBannerReady(true);
    // Se não recebemos valores do servidor, faz fallback via API
    if (ticketPriceProp === undefined || drawLabelProp === undefined || campaignTitleProp === undefined || campaignImageProp === undefined) {
      (async () => {
        try {
          const res = await fetch('/api/campaign', { cache: 'no-store' });
          const json = await res.json();
          if (json?.success && json.settings) {
            if (ticketPriceProp === undefined && typeof json.settings.ticketPrice === 'number') setTicketPrice(json.settings.ticketPrice);
            if (drawLabelProp === undefined) {
              const mode = json.settings.drawMode as 'fixedDate' | 'sameDay' | 'today' | undefined;
              if (mode === 'fixedDate' && json.settings.drawDate) {
                const d = new Date(json.settings.drawDate + 'T00:00:00');
                setDrawLabel(d.toLocaleDateString('pt-BR'));
              } else if (mode === 'sameDay' && typeof json.settings.drawDay === 'number') {
                setDrawLabel(String(json.settings.drawDay).padStart(2, '0') + '/todo mês');
              } else if (mode === 'today') {
                const now = new Date();
                setDrawLabel(now.toLocaleDateString('pt-BR'));
              }
            }
            if (campaignTitleProp === undefined && typeof json.settings.title === 'string') setCampaignTitle(json.settings.title);
            if (campaignImageProp === undefined && typeof json.settings.imageUrl === 'string') setCampaignImage(json.settings.imageUrl);
          }
        } catch {}
      })();
    }
  }, []);

  useEffect(() => {
    const price = quantity * ticketPrice;
    setTotalPrice(price);
    const nextSpins = Math.floor(quantity / 5);
    setSpins(prev => {
      if (prev !== nextSpins) {
        setSpinsBump(true);
        window.setTimeout(() => setSpinsBump(false), 350);
      }
      return nextSpins;
    });
  }, [quantity, ticketPrice]);

  const handleAddQuantity = (amount: number) => {
    setQuantity(current => {
      const next = current + amount;
      if (next < 0) return 0;
      if (next > MAX_QUANTITY) return MAX_QUANTITY;
      return next;
    });
  };
  
  const resetQuantity = () => {
    setQuantity(0);
  }

  const handleOpenModal = () => {
    if (quantity <= 0) {
        alert("Por favor, selecione pelo menos um título para participar.");
        return;
    }
    if (totalPrice > MAX_PIX_TOTAL_BR) {
        const maxPix = MAX_PIX_TOTAL_BR.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        alert(`Valor máximo por Pix é ${maxPix}. Diminua a quantidade ou faça várias compras.`);
        return;
    }
    setIsModalOpen(true);
  }

  return (
    <>
        <div className="bg-white p-2 rounded-lg shadow-md">
            <div className="flex justify-center items-center space-x-4 text-xs font-semibold mb-2">
                <div className="text-center">
                    <span className="text-gray-600 mr-1">Sorteio</span>
                    <span className="font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded-md">{drawLabel || 'a definir'}</span>
                </div>
                <div className="text-center">
                    <span className="text-gray-600 mr-1">Por apenas</span>
                    <span className="font-bold text-white bg-black px-2 py-1 rounded-md">{ticketPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
            </div>
            
            <div className="text-center bg-gray-100 p-1 rounded-md mb-2">
                <p className="text-xs text-gray-600 font-semibold">QUANTO MAIS TÍTULOS, MAIS VOCÊ AJUDA E MAIS CHANCES VOCÊ TEM DE GANHAR!</p>
            </div>

            {/* Banner Roleta da Sorte com animações */}
            <div className={`rounded-lg text-white p-2 shadow-md mb-2 animated-gradient`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/25 shadow-sm">
                    <i className="bi bi-stars text-[18px]"></i>
                  </span>
                  <div className="leading-tight">
                    <p className="text-[12px] font-extrabold uppercase tracking-wide drop-shadow-sm">Roleta da Sorte</p>
                    <p className="text-[12px] opacity-95">Ganhe 1 giro a cada 5 cotas</p>
                  </div>
                </div>
                <span
                  className={
                    `bg-white/25 px-3 py-1.5 rounded-md text-sm font-extrabold transition-transform duration-300 drop-shadow-sm ` +
                    `${spinsBump ? 'scale-110 ring-2 ring-white/60' : 'scale-100'}`
                  }
                >
                  {spins} giro{spins === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-2 text-center">
                {[10, 25, 50, 75, 100, 150].map((num) => {
                    const isPopular = num === 25;
                    return (
                    <div key={num} className="relative h-16">
                        {isPopular && (
                        <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 bg-green-700 text-white px-2 py-0 rounded-md whitespace-nowrap" style={{ fontSize: '0.6rem' }}>
                            Mais popular
                        </div>
                        )}
                        <button
                        onClick={() => handleAddQuantity(num)}
                        className={`transition-all text-white flex flex-col justify-center items-center w-full h-full rounded-lg ${isPopular ? 'bg-[#28a745]' : 'bg-black'}`}
                        >
                        <p className="font-bold text-xl leading-tight">+{num}</p>
                        <p className="uppercase" style={{ fontSize: '0.6rem' }}>Selecionar</p>
                        </button>
                    </div>
                    );
                })}
            </div>
                
            <div className="grid grid-cols-2 gap-2 items-center">
                {/* Seletor de Quantidade */}
                <div className="col-span-1 bg-gray-100 rounded-lg p-1 flex items-center h-full">
                    <div className="flex items-center space-x-2">
                        <button onClick={resetQuantity} className="text-gray-500 hover:text-black text-lg px-2">
                            <i className="bi bi-x-circle"></i>
                        </button>
                        <button onClick={() => handleAddQuantity(-1)} className="text-gray-500 hover:text-black text-xl px-2">
                            <i className="bi bi-dash-circle"></i>
                        </button>
                    </div>
                    <input type="text" value={quantity} readOnly className="flex-1 bg-transparent text-black text-center font-bold w-full"/>
                    <button onClick={() => handleAddQuantity(1)} disabled={quantity >= MAX_QUANTITY} className="text-green-500 hover:text-green-400 text-xl px-2 disabled:opacity-40 disabled:cursor-not-allowed">
                        <i className="bi bi-plus-circle-fill"></i>
                    </button>
                </div>
                
                {/* Botão Participar */}
                <button 
                    onClick={handleOpenModal}
                    className="col-span-1 bg-[#28a745] hover:bg-green-700 text-white font-bold p-2 rounded-lg flex items-center justify-center space-x-2 h-full"
                >
                    <i className="bi bi-arrow-right-square-fill text-2xl"></i>
                    <div className="text-left leading-tight">
                        <span className="text-sm font-semibold">Participar</span>
                        {hasMounted ? (
                        <p className="text-xs">{totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        ) : (
                        <p className="text-xs">R$ ...</p>
                        )}
                    </div>
                </button>
            </div>

            
        </div>

        <CheckoutModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)}
            quantity={quantity}
            campaignTitle={campaignTitle}
            campaignImage={campaignImage}
        />
    </>
  );
};

export default PurchaseSection;
