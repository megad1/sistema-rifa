// src/components/Prizes.tsx
"use client";

import { useState } from 'react';

const allPrizes = [
  { prize: 'R$ 300,00', winner: 'Washington Luis 🏆' },
  { prize: 'R$ 300,00', winner: 'Enio Duarte 🏆' },
  { prize: 'R$ 300,00', winner: 'Cristhian dos 🏆' },
  { prize: 'R$ 300,00', winner: 'Matheus Lima 🏆' },
  { prize: 'R$ 300,00', winner: 'Ewerton hernandes 🏆' },
  { prize: 'R$ 300,00', winner: 'Willian Pablo 🏆' },
  { prize: 'R$ 300,00', winner: 'Lucas Emanoel 🏆' },
  { prize: 'R$ 300,00', winner: 'danilo Bonora 🏆' },
  { prize: 'R$ 300,00', winner: 'Douglas dos 🏆' },
  { prize: 'R$ 300,00', winner: 'Josenildo Sousa 🏆' },
  ...Array(90).fill({ prize: 'R$ 300,00', winner: null }),
];

const Prizes = () => {
  const [showAll, setShowAll] = useState(false);
  const prizesToShow = showAll ? allPrizes : allPrizes.slice(0, 10);

  return (
    <section className="mb-8 bg-white p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">🏆 Premiações instantâneas</h2>
          <p className="text-sm text-gray-500">Veja a lista de prêmios</p>
        </div>
        <div className="bg-blue-600 text-white text-sm font-semibold px-3 py-1 rounded">
          Total 100
        </div>
      </div>
      <div className="flex space-x-4 mb-4">
        <div className="bg-teal-500 text-white text-sm font-semibold px-4 py-2 rounded-lg flex-1 text-center">
          Disponíveis 90
        </div>
        <div className="bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded-lg flex-1 text-center">
          Sorteados 10
        </div>
      </div>
      <div className="space-y-2">
        {prizesToShow.map((item, index) => (
          <div key={index} className={`p-3 rounded-lg flex justify-between items-center ${item.winner ? 'bg-gray-800 text-white' : 'bg-gray-100 text-black'}`}>
            <span className="font-semibold">{item.prize}</span>
            {item.winner ? (
              <span className="font-bold">{item.winner}</span>
            ) : (
              <span className="text-green-600 font-semibold">Disponível</span>
            )}
          </div>
        ))}
      </div>
      <button 
        onClick={() => setShowAll(!showAll)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg mt-4"
      >
        {showAll ? 'Ver menos' : 'Ver mais'}
      </button>
    </section>
  );
};

export default Prizes;
