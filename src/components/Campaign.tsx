// src/components/Campaign.tsx
"use client";
import Image from 'next/image';
import { useState, useEffect } from 'react';

const TICKET_PRICE = 0.11;

const Campaign = () => {
  const [quantity, setQuantity] = useState(120);
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    const price = quantity * TICKET_PRICE;
    setTotalPrice(price);
  }, [quantity]);

  const handleAddQuantity = (amount: number) => {
    setQuantity(current => Math.max(0, current + amount));
  };

  const resetQuantity = () => {
    setQuantity(0);
  }

  const popularStyle = "bg-green-500 text-white border-green-500";
  const defaultStyle = "bg-white hover:bg-gray-100 border-gray-200 text-black";

  return (
    <section className="mb-8">
      <div className="relative mb-4 shadow-lg rounded-lg overflow-hidden">
        <Image
          src="https://s3.incrivelsorteios.com/redimensiona?key=600x600/20250731_688b54af15d40.jpg"
          alt="Prêmio"
          width={600}
          height={310}
          className="w-full"
        />
        <div className="absolute top-2 left-2 flex space-x-2">
          <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded animate-pulse">Adquira já!</span>
          <span className="bg-black bg-opacity-75 text-white text-xs font-bold px-2 py-1 rounded">15414.643737/2025-93</span>
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800">EDIÇÃO 76 - NOVO TERA 2026 0KM</h1>
        <p className="text-gray-500 mb-4">IMAGEM MERAMENTE ILUSTRATIVA</p>
        
        <div className="flex justify-center items-center space-x-4 bg-gray-100 p-2 rounded-lg mb-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Sorteio</p>
            <p className="font-bold text-gray-800 bg-white px-2 py-1 rounded-md">09/08/2025</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Por apenas</p>
            <p className="font-bold text-white bg-gray-800 px-3 py-1 rounded-md text-xl">R$ 0,11</p>
          </div>
        </div>

        <div className="text-center bg-gray-100 p-2 rounded-md mb-4">
          <p className="text-xs text-gray-600 font-semibold">QUANTO MAIS TÍTULOS, MAIS VOCÊ AJUDA E MAIS CHANCES DE GANHAR!</p>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
          {[100, 250, 500, 750, 1000, 1500].map((num) => (
            <button 
              key={num} 
              onClick={() => handleAddQuantity(num)}
              className={`p-3 rounded-lg border-2 transition-all relative ${num === 250 ? popularStyle : defaultStyle}`}
            >
              {num === 250 && <span className="text-xs absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white px-2 rounded-full">Mais popular</span>}
              <p className="font-bold text-lg">+{num}</p>
              <p className="text-xs uppercase">Selecionar</p>
            </button>
          ))}
        </div>
        
        <div className="flex items-center space-x-2">
            <div className="flex-grow bg-gray-100 rounded-lg p-2 flex justify-around items-center">
                <button onClick={resetQuantity} className="text-gray-500 hover:text-black text-xl px-2">✕</button>
                <button onClick={() => handleAddQuantity(-1)} className="text-gray-500 hover:text-black text-2xl px-2">-</button>
                <input type="text" value={quantity} readOnly className="bg-transparent text-black text-center w-16 font-bold text-lg"/>
                <button onClick={() => handleAddQuantity(1)} className="text-green-500 hover:text-green-400 text-2xl px-2">+</button>
            </div>
            <button className="bg-green-500 hover:bg-green-600 text-white font-bold p-2 rounded-lg flex-1 flex items-center justify-center space-x-2">
                <span className="text-3xl">➔</span>
                <div className="text-left">
                  <span className="font-semibold">Participar</span>
                  <p className="text-sm">{totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
            </button>
        </div>
      </div>
    </section>
  );
};

export default Campaign;
