// src/components/PurchaseSection.tsx
"use client";

import { useState, useEffect } from 'react';
import CheckoutModal from './CheckoutModal';
import { MAX_PIX_TOTAL_BR } from '@/config/payments';
import Image from 'next/image';

type Props = {
  ticketPrice?: number;
  drawLabel?: string;
  campaignTitle?: string;
  campaignImage?: string;
  minQuantity?: number;
  defaultQuantity?: number;
};

const QUANTITY_BUTTONS = [
  { value: 20, label: '+ 20', popular: false },
  { value: 10, label: '+ 10', popular: true },
  { value: 50, label: '+ 50', popular: false },
];

const PurchaseSection = ({
  ticketPrice: ticketPriceProp,
  drawLabel: drawLabelProp,
  campaignTitle: campaignTitleProp,
  campaignImage: campaignImageProp,
  minQuantity: minQuantityProp,
  defaultQuantity: defaultQuantityProp
}: Props) => {
  const initialMinQty = typeof minQuantityProp === 'number' ? Math.max(1, Math.floor(minQuantityProp)) : 5;
  const initialDefaultQtyRaw = typeof defaultQuantityProp === 'number' ? Math.max(1, Math.floor(defaultQuantityProp)) : 10;
  const initialDefaultQty = Math.max(initialMinQty, initialDefaultQtyRaw);

  // Card 1 - Pix do Milhão (R$ 1,99 por cota, min 5)
  const [quantity, setQuantity] = useState(initialDefaultQty);
  const [totalPrice, setTotalPrice] = useState(0);
  const [hasMounted, setHasMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ticketPrice, setTicketPrice] = useState<number>(ticketPriceProp ?? 1.99);
  const [drawLabel, setDrawLabel] = useState<string>(drawLabelProp ?? '');
  const [campaignTitle, setCampaignTitle] = useState<string>(campaignTitleProp ?? '');
  const [campaignImage, setCampaignImage] = useState<string>(campaignImageProp ?? '');
  const [minQuantity, setMinQuantity] = useState<number>(initialMinQty);
  const [countdown, setCountdown] = useState<string>('');
  const [currentDayName, setCurrentDayName] = useState<string>('');
  const [nextDayName, setNextDayName] = useState<string>('');
  // Card 1 - Pix do Milhão (R$ 1,99 por cota)
  // Max R$200 = 200/1.99 ≈ 100 cotas
  const MAX_QUANTITY = 100;

  // Card 2 - Dia dos Sonhos (R$ 0,25 por cota, min 40 = R$ 10,00)
  // Max R$200 = 200/0.25 = 800 cotas
  const CARD2_PRICE = 0.25;
  const CARD2_MIN = 40;
  const CARD2_MAX = 800;
  const [quantity2, setQuantity2] = useState(40);

  // Card 3 - Próximo Dia Premiado (R$ 0,20 por cota, min 50 = R$ 10,00)
  // Max R$200 = 200/0.20 = 1000 cotas
  const CARD3_PRICE = 0.20;
  const CARD3_MIN = 50;
  const CARD3_MAX = 1000;
  const [quantity3, setQuantity3] = useState(50);

  // Funções de preço dinâmico com faixas de desconto
  const getCard2Price = (qty: number) => {
    // Faixa 1: até 79 cotas (base R$ 9,99 por 40 cotas ≈ R$ 0,24975)
    if (qty < 80) {
      return qty * (9.99 / 40);
    }
    // Faixa 2: 80 cotas ou mais (base R$ 19,90 por 80 cotas = R$ 0,24875)
    return qty * (19.90 / 80);
  };

  const getCard3Price = (qty: number) => {
    // Faixa 1: até 99 cotas (base R$ 9,99 por 50 cotas ≈ R$ 0,1998)
    if (qty < 100) {
      return qty * (9.99 / 50);
    }
    // Faixa 2: 100 cotas ou mais (base R$ 19,00 por 100 cotas = R$ 0,19)
    return qty * (19.00 / 100);
  };

  // Nomes dos dias da semana em português
  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  // Contador regressivo até meia-noite + calcular dias
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0); // Meia-noite do próximo dia

      const diff = midnight.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));

      // Formato "Em X horas" como no original
      setCountdown(`Em ${hours} horas`);

      // Dia atual e próximo dia
      const currentDay = now.getDay();
      const nextDay = (currentDay + 1) % 7;
      setCurrentDayName(diasSemana[currentDay]);
      setNextDayName(diasSemana[nextDay]);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setHasMounted(true);

    if (ticketPriceProp === undefined || drawLabelProp === undefined || campaignTitleProp === undefined || campaignImageProp === undefined || minQuantityProp === undefined || defaultQuantityProp === undefined) {
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
                setDrawLabel(new Date().toLocaleDateString('pt-BR'));
              }
            }
            if (campaignTitleProp === undefined && typeof json.settings.title === 'string') setCampaignTitle(json.settings.title);
            if (campaignImageProp === undefined && typeof json.settings.imageUrl === 'string') setCampaignImage(json.settings.imageUrl);
            if (minQuantityProp === undefined && typeof json.settings.minQuantity === 'number') {
              const mq = Math.max(1, Math.floor(json.settings.minQuantity));
              setMinQuantity(mq);
              setQuantity(q => Math.max(mq, q));
            }
          }
        } catch { }
      })();
    }
  }, []);

  useEffect(() => {
    setTotalPrice(quantity * ticketPrice);
  }, [quantity, ticketPrice]);

  const handleSetQuantity = (amount: number) => {
    setQuantity(amount);
  };

  const handleAddQuantity = (amount: number) => {
    setQuantity(current => {
      const next = current + amount;
      if (next < minQuantity) return minQuantity;
      if (next > MAX_QUANTITY) return MAX_QUANTITY;
      return next;
    });
  };

  // Estado para dados do checkout dinâmico
  const [checkoutData, setCheckoutData] = useState({
    quantity: 0,
    totalPrice: 0,
    title: '',
    image: '',
    spins: 0
  });

  const handleOpenCheckout = (qty: number, price: number, title: string, img: string, spins: number) => {
    if (qty <= 0) {
      alert("Por favor, selecione pelo menos um título.");
      return;
    }
    if (price > MAX_PIX_TOTAL_BR) {
      const maxPix = MAX_PIX_TOTAL_BR.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      alert(`Valor máximo por Pix é ${maxPix}. Diminua a quantidade.`);
      return;
    }
    setCheckoutData({
      quantity: qty,
      totalPrice: price,
      title: title,
      image: img,
      spins: spins
    });
    setIsModalOpen(true);
  };

  return (
    <>
      {/* Card da Campanha - Estilo PDM Exato */}
      <div
        className="bg-white rounded-3xl shadow-lg overflow-hidden"
        style={{
          fontFamily: 'Ubuntu, ui-sans-serif, system-ui, sans-serif',
          padding: '12px'
        }}
      >

        {/* Banner da Campanha */}
        <div className="pb-0">
          <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden group">
            {/* Letreiro Animado */}
            <div className="absolute top-0 left-0 right-0 z-20 bg-[#2563EB] text-white py-1 overflow-hidden">
              <style jsx>{`
                  @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                  }
                  .animate-marquee {
                    display: flex;
                    width: max-content;
                    animation: marquee 15s linear infinite;
                  }
                `}</style>
              <div className="animate-marquee flex gap-8 items-center text-xs font-black uppercase tracking-widest whitespace-nowrap">
                <span className="flex items-center gap-2">🚨 NÃO PERCA TEMPO - CONCORRA A 1 MILHÃO DE REAIS HOJE!!!</span>
                <span className="flex items-center gap-2">🚨 NÃO PERCA TEMPO - CONCORRA A 1 MILHÃO DE REAIS HOJE!!!</span>
                <span className="flex items-center gap-2">🚨 NÃO PERCA TEMPO - CONCORRA A 1 MILHÃO DE REAIS HOJE!!!</span>
                <span className="flex items-center gap-2">🚨 NÃO PERCA TEMPO - CONCORRA A 1 MILHÃO DE REAIS HOJE!!!</span>
              </div>
            </div>

            <Image
              src="/card1.png"
              alt={campaignTitle || 'Campanha'}
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Processo SUSEP alinhado à direita */}
        <div className="py-1 text-right">
          <span className="text-xs text-gray-400">
            Processo SUSEP: 15414.652557/2025-01
          </span>
        </div>

        {/* Contador + Badge OFF + ícone */}
        <div className="flex items-center justify-between pb-2">
          {/* Contador à esquerda */}
          <div className="flex items-center gap-2 text-gray-700">
            <i className="bi bi-clock text-lg"></i>
            <span className="font-medium">{countdown || '--:--:--'}</span>
          </div>

          {/* Badge + ícone à direita */}
          <div className="flex items-center gap-2">
            <span
              className="px-3 rounded-lg"
              style={{
                backgroundColor: '#3B82F6',
                color: 'rgb(255, 255, 255)',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '1.2px',
                height: '26px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              59% OFF
            </span>
            <button className="w-6 h-6 rounded-full bg-[#212121] flex items-center justify-center text-white text-sm">
              <i className="bi bi-info"></i>
            </button>
          </div>
        </div>

        {/* Grid de Botões de Quantidade */}
        <div className="pb-3">
          <div className="grid grid-cols-3 gap-2">
            {QUANTITY_BUTTONS.map((btn) => (
              <button
                key={btn.value}
                onClick={() => handleAddQuantity(btn.value)}
                className={`relative flex flex-col items-center justify-center px-3 py-3 rounded-2xl
                  bg-gray-100 font-bold text-xl text-gray-700
                  shadow-sm transition-all duration-200 ease-out
                  active:scale-95 active:shadow-inner
                  hover:shadow-md hover:-translate-y-0.5
                `}
              >
                {/* Badge POPULAR acima do +10 */}
                {btn.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <div
                      className="flex items-center gap-0.5 text-white text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full shadow-md whitespace-nowrap"
                      style={{ backgroundColor: '#DC2626' }}
                    >
                      <i className="bi bi-fire text-[9px]"></i>
                      <span>POPULAR</span>
                    </div>
                  </div>
                )}
                <span className="leading-tight">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Seletor de Quantidade + Botão Comprar */}
        <div className="pb-0">
          <div className="flex gap-2 items-stretch">

            {/* Seletor Preto/Amarelo - Estilo PDM Original */}
            <div className="flex-1 flex items-center justify-center rounded-xl px-3 min-h-[3.7rem]" style={{ backgroundColor: '#212121' }}>
              <button
                onClick={() => handleAddQuantity(-1)}
                disabled={quantity <= minQuantity}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-2xl font-bold transition-opacity disabled:opacity-50"
                style={{ backgroundColor: 'rgb(245, 166, 35)' }}
              >
                −
              </button>
              <strong className="min-w-[3rem] text-center text-white text-2xl font-bold mx-2">
                {quantity}
              </strong>
              <button
                onClick={() => handleAddQuantity(1)}
                disabled={quantity >= MAX_QUANTITY}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-2xl font-bold transition-opacity disabled:opacity-50"
                style={{ backgroundColor: 'rgb(245, 166, 35)' }}
              >
                +
              </button>
            </div>

            {/* Botão Comprar */}
            <button
              onClick={() => handleOpenCheckout(quantity, totalPrice, campaignTitle, '/card1.png', Math.floor(quantity / 5) * 2)}
              className="pulse-buy flex-1 min-h-[3.7rem] bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-0 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md"
            >
              <div className="flex flex-col items-start justify-center h-full gap-0.5">
                <span className="text-sm leading-none">Comprar</span>
                {hasMounted ? (
                  <span className="leading-none font-bold">
                    {totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                ) : (
                  <span className="leading-none font-bold">R$ ...</span>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ======== SEGUNDO CARD - Dia Atual dos Sonhos ======== */}
      <div className="mt-6">
        {/* Título com estrela */}
        <div className="flex items-start gap-3 mb-4">
          <span className="text-3xl">⭐</span>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{currentDayName || 'Hoje'} dos Sonhos</h2>
            <p className="text-sm text-gray-500">Sua semana começa com R$ 100 mil esperando por você 🤩</p>
          </div>
        </div>

        {/* Card */}
        <div
          className="bg-white rounded-3xl shadow-lg overflow-hidden"
          style={{
            fontFamily: 'Ubuntu, ui-sans-serif, system-ui, sans-serif',
            padding: '12px'
          }}
        >
          {/* Banner */}
          <div className="pb-0">
            <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden group">
              {/* Letreiro Animado */}
              <div className="absolute top-0 left-0 right-0 z-20 bg-[#2563EB] text-white py-1 overflow-hidden">
                <style jsx>{`
                  @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                  }
                  .animate-marquee {
                    display: flex;
                    width: max-content;
                    animation: marquee 15s linear infinite;
                  }
                `}</style>
                <div className="animate-marquee flex gap-8 items-center text-xs font-black uppercase tracking-widest whitespace-nowrap">
                  <span className="flex items-center gap-2">🚨 NÃO PERCA TEMPO - CONCORRA A 100 MIL REAIS HOJE!!!</span>
                  <span className="flex items-center gap-2">🚨 NÃO PERCA TEMPO - CONCORRA A 100 MIL REAIS HOJE!!!</span>
                  <span className="flex items-center gap-2">🚨 NÃO PERCA TEMPO - CONCORRA A 100 MIL REAIS HOJE!!!</span>
                  <span className="flex items-center gap-2">🚨 NÃO PERCA TEMPO - CONCORRA A 100 MIL REAIS HOJE!!!</span>
                </div>
              </div>

              <Image
                src="/card2.png"
                alt={`${currentDayName} dos Sonhos`}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>

          {/* Processo SUSEP */}
          <div className="py-1 text-right">
            <span className="text-xs text-gray-400">
              Processo SUSEP: 15414.652557/2025-01
            </span>
          </div>

          {/* Contador + Badge */}
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2 text-gray-700">
              <i className="bi bi-clock text-lg"></i>
              <span className="font-medium">{countdown || '--:--:--'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="px-3 rounded-lg"
                style={{
                  backgroundColor: '#3B82F6',
                  color: 'rgb(255, 255, 255)',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '1.2px',
                  height: '26px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                49% OFF
              </span>
              <button className="w-6 h-6 rounded-full bg-[#212121] flex items-center justify-center text-white text-sm">
                <i className="bi bi-info"></i>
              </button>
            </div>
          </div>

          {/* Botões +40, +50, +200 */}
          <div className="pb-3">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setQuantity2(q => Math.min(q + 40, CARD2_MAX))}
                className="relative flex flex-col items-center justify-center px-3 py-3 rounded-2xl bg-gray-100 font-bold text-xl text-gray-700 shadow-sm hover:shadow-md transition-all duration-200 ease-out active:scale-95 active:shadow-inner hover:-translate-y-0.5"
              >
                <span className="leading-tight">+ 40</span>
              </button>
              <button
                onClick={() => setQuantity2(q => Math.min(q + 50, CARD2_MAX))}
                className="relative flex flex-col items-center justify-center px-3 py-3 rounded-2xl bg-gray-100 font-bold text-xl text-gray-700 shadow-sm hover:shadow-md transition-all duration-200 ease-out active:scale-95 active:shadow-inner hover:-translate-y-0.5"
              >
                {/* Badge POPULAR */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <div className="flex items-center gap-0.5 text-white text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full shadow-md whitespace-nowrap" style={{ backgroundColor: '#DC2626' }}>
                    <i className="bi bi-fire text-[9px]"></i>
                    <span>POPULAR</span>
                  </div>
                </div>
                <span className="leading-tight">+ 50</span>
              </button>
              <button
                onClick={() => setQuantity2(q => Math.min(q + 200, CARD2_MAX))}
                className="relative flex flex-col items-center justify-center px-3 py-3 rounded-2xl bg-gray-100 font-bold text-xl text-gray-700 shadow-sm hover:shadow-md transition-all duration-200 ease-out active:scale-95 active:shadow-inner hover:-translate-y-0.5"
              >
                <span className="leading-tight">+ 200</span>
              </button>
            </div>
          </div>

          {/* Seletor + Comprar */}
          <div className="pb-0">
            <div className="flex gap-2 items-stretch">
              <div className="flex-1 flex items-center justify-center rounded-xl px-3 min-h-[3.7rem]" style={{ backgroundColor: '#212121' }}>
                <button
                  onClick={() => setQuantity2(q => Math.max(q - 1, CARD2_MIN))}
                  disabled={quantity2 <= CARD2_MIN}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-2xl font-bold transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: 'rgb(245, 166, 35)' }}
                >−</button>
                <strong className="min-w-[3rem] text-center text-white text-2xl font-bold mx-2">{quantity2}</strong>
                <button
                  onClick={() => setQuantity2(q => Math.min(q + 1, CARD2_MAX))}
                  disabled={quantity2 >= CARD2_MAX}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-2xl font-bold transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: 'rgb(245, 166, 35)' }}
                >+</button>
              </div>
              <button
                onClick={() => handleOpenCheckout(quantity2, getCard2Price(quantity2), `${currentDayName || 'Hoje'} dos Sonhos`, '/card2.png', Math.floor(quantity2 / 40) * 2)}
                className="pulse-buy flex-1 min-h-[3.7rem] bg-gradient-to-br from-green-500 to-green-600 text-white font-medium py-0 px-4 rounded-lg shadow-lg"
              >
                <div className="flex flex-col items-start justify-center h-full gap-0.5">
                  <span className="text-sm leading-none">Comprar</span>
                  <span className="leading-none font-bold">
                    {getCard2Price(quantity2).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======== TERCEIRO CARD - Próximo Dia Premiado ======== */}
      <div className="mt-6">
        {/* Título com emoji */}
        <div className="flex items-start gap-3 mb-4">
          <span className="text-3xl">🏆</span>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{nextDayName || 'Amanhã'} Premiada</h2>
            <p className="text-sm text-gray-500">Toda {nextDayName?.toLowerCase() || 'amanhã'} R$ 40 mil para transformar sua semana 🍀</p>
          </div>
        </div>

        {/* Card */}
        <div
          className="bg-white rounded-3xl shadow-lg overflow-hidden"
          style={{
            fontFamily: 'Ubuntu, ui-sans-serif, system-ui, sans-serif',
            padding: '12px'
          }}
        >
          {/* Banner */}
          <div className="pb-0">
            <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden">
              <Image
                src="/card3.png"
                alt={`${nextDayName} Premiada`}
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Processo SUSEP */}
          <div className="py-1 text-right">
            <span className="text-xs text-gray-400">
              Processo SUSEP: 15414.669933/2025-98
            </span>
          </div>

          {/* Contador + Badge */}
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2 text-gray-700">
              <i className="bi bi-calendar3 text-lg"></i>
              <span className="font-medium">Em 1 dia</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-6 h-6 rounded-full bg-[#212121] flex items-center justify-center text-white text-sm">
                <i className="bi bi-info"></i>
              </button>
            </div>
          </div>

          {/* Botões +10, +50, +100 */}
          <div className="pb-3">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setQuantity3(q => Math.min(q + 10, CARD3_MAX))}
                className="relative flex flex-col items-center justify-center px-3 py-3 rounded-2xl bg-gray-100 font-bold text-xl text-gray-700 shadow-sm hover:shadow-md transition-all duration-200 ease-out active:scale-95 active:shadow-inner hover:-translate-y-0.5"
              >
                <span className="leading-tight">+ 10</span>
              </button>
              <button
                onClick={() => setQuantity3(q => Math.min(q + 50, CARD3_MAX))}
                className="relative flex flex-col items-center justify-center px-3 py-3 rounded-2xl bg-gray-100 font-bold text-xl text-gray-700 shadow-sm hover:shadow-md transition-all duration-200 ease-out active:scale-95 active:shadow-inner hover:-translate-y-0.5"
              >
                {/* Badge POPULAR */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <div className="flex items-center gap-0.5 text-white text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full shadow-md whitespace-nowrap" style={{ backgroundColor: '#DC2626' }}>
                    <i className="bi bi-fire text-[9px]"></i>
                    <span>POPULAR</span>
                  </div>
                </div>
                <span className="leading-tight">+ 50</span>
              </button>
              <button
                onClick={() => setQuantity3(q => Math.min(q + 100, CARD3_MAX))}
                className="relative flex flex-col items-center justify-center px-3 py-3 rounded-2xl bg-gray-100 font-bold text-xl text-gray-700 shadow-sm hover:shadow-md transition-all duration-200 ease-out active:scale-95 active:shadow-inner hover:-translate-y-0.5"
              >
                <span className="leading-tight">+ 100</span>
              </button>
            </div>
          </div>

          {/* Seletor + Comprar */}
          <div className="pb-0">
            <div className="flex gap-2 items-stretch">
              <div className="flex-1 flex items-center justify-center rounded-xl px-3 min-h-[3.7rem]" style={{ backgroundColor: '#212121' }}>
                <button
                  onClick={() => setQuantity3(q => Math.max(q - 1, CARD3_MIN))}
                  disabled={quantity3 <= CARD3_MIN}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-2xl font-bold transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: 'rgb(245, 166, 35)' }}
                >−</button>
                <strong className="min-w-[3rem] text-center text-white text-2xl font-bold mx-2">{quantity3}</strong>
                <button
                  onClick={() => setQuantity3(q => Math.min(q + 1, CARD3_MAX))}
                  disabled={quantity3 >= CARD3_MAX}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-2xl font-bold transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: 'rgb(245, 166, 35)' }}
                >+</button>
              </div>
              <button
                onClick={() => handleOpenCheckout(quantity3, getCard3Price(quantity3), `${nextDayName || 'Amanhã'} Premiada`, '/card3.png', Math.floor(quantity3 / 50) * 2)}
                className="pulse-buy flex-1 min-h-[3.7rem] bg-gradient-to-br from-green-500 to-green-600 text-white font-medium py-0 px-4 rounded-lg shadow-lg"
              >
                <div className="flex flex-col items-start justify-center h-full gap-0.5">
                  <span className="text-sm leading-none">Comprar</span>
                  <span className="leading-none font-bold">
                    {getCard3Price(quantity3).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <CheckoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        quantity={checkoutData.quantity || quantity}
        totalPrice={checkoutData.totalPrice || totalPrice}
        campaignTitle={checkoutData.title || campaignTitle}
        campaignImage={checkoutData.image || campaignImage}
        spins={checkoutData.spins}
      />
    </>
  );
};

export default PurchaseSection;
