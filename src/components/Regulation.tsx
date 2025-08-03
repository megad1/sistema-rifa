// src/components/Regulation.tsx
"use client";

import { useState } from 'react';

const Regulation = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="mb-8 bg-white p-4 rounded-lg shadow-md">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left font-bold text-lg text-gray-700"
      >
        Descrição/Regulamento
        <span className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
            ▼
        </span>
      </button>
      {isOpen && (
        <div className="text-xs text-gray-600 space-y-3 mt-4 border-t pt-4">
          <p>O WESLEY ALEMÃO PRÊMIOS VI.58 é um Título de Capitalização da Modalidade Filantropia Premiável...</p>
          <p>A contratação deste título é apropriada principalmente na hipótese de o consumidor estar interessado em contribuir com entidades beneficentes de assistência sociais...</p>
          <p><strong>1 – SORTEIOS:</strong> Ao adquirir o WESLEY ALEMÃO PRÊMIOS VI.58 o Subscritor irá concorrer aos sorteios das modalidades...</p>
          <p><strong>2 – SÉRIES E PROBABILIDADES:</strong> Os Títulos são ordenados em séries de 10.000.000 unidades...</p>
          <p><strong>3 – VIGÊNCIA:</strong> A vigência do Título é de 2 meses.</p>
          <p><strong>4 – RESGATE:</strong> O valor do resgate estará disponível ao Titular do direito de resgate após 2 meses de carência.</p>
          <p>PREMIAÇÃO: VW TERA HIGH TSI – ANO 2026 (SUGESTÃO DE USO DO PRÊMIO LÍQUIDO R$ 140.000,00)</p>
          <p>Instantâneas: 100 TÍTULOS PREMIADOS DE R$ 300,00</p>
        </div>
      )}
    </section>
  );
};

export default Regulation;
