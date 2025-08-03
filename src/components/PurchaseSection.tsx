// src/components/PurchaseSection.tsx
"use client";

import { useState, useEffect } from 'react';
import CheckoutModal from './CheckoutModal'; // Importando o modal

const TICKET_PRICE = 0.11;

const PurchaseSection = () => {
  const [quantity, setQuantity] = useState(120);
  const [totalPrice, setTotalPrice] = useState(0);
  const [hasMounted, setHasMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para o modal

  useEffect(() => {
    setHasMounted(true);
  }, []);

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

  const handleOpenModal = () => {
    if (quantity > 0) {
        setIsModalOpen(true);
    } else {
        alert("Por favor, selecione pelo menos um título para participar.");
    }
  }

  return (
    <>
        <div className="bg-white p-2 rounded-lg shadow-md">
            <div className="flex justify-center items-center space-x-4 text-xs font-semibold mb-2">
                <div className="text-center">
                    <span className="text-gray-600 mr-1">Sorteio</span>
                    <span className="font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded-md">09/08/2025</span>
                </div>
                <div className="text-center">
                    <span className="text-gray-600 mr-1">Por apenas</span>
                    <span className="font-bold text-white bg-black px-2 py-1 rounded-md">R$ 0,11</span>
                </div>
            </div>
            
            <div className="text-center bg-gray-100 p-1 rounded-md mb-2">
                <p className="text-xs text-gray-600 font-semibold">QUANTO MAIS TÍTULOS, MAIS VOCÊ AJUDA E MAIS CHANCES DE GANHAR!</p>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-2 text-center">
                {[100, 250, 500, 750, 1000, 1500].map((num) => {
                    const isPopular = num === 250;
                    return (
                    <div key={num} className="relative h-16">
                        {isPopular && (
                        <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 bg-green-700 text-white px-2 py-0 rounded-md whitespace-nowrap" style={{ fontSize: '0.6rem' }}>
                            Mais popular
                        </div>
                        )}
                        <button
                        onClick={() => handleAddQuantity(num)}
                        className={`transition-all text-white flex flex-col justify-center items-center w-full h-full rounded-lg ${isPopular ? 'bg-[#28a745] pt-3' : 'bg-black'}`}
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
                <div className="col-span-1 bg-gray-100 rounded-lg p-1 flex justify-between items-center h-full">
                    <button onClick={resetQuantity} className="text-gray-500 hover:text-black text-lg px-1">
                        <i className="bi bi-x-circle"></i>
                    </button>
                    <button onClick={() => handleAddQuantity(-1)} className="text-gray-500 hover:text-black text-xl px-1">
                        <i className="bi bi-dash-circle"></i>
                    </button>
                    <input type="text" value={quantity} readOnly className="bg-transparent text-black text-center w-8 font-bold"/>
                    <button onClick={() => handleAddQuantity(1)} className="text-green-500 hover:text-green-400 text-xl px-1">
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
        />
    </>
  );
};

export default PurchaseSection;
