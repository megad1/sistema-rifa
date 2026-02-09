// src/components/Winners.tsx
"use client";

import Image from 'next/image';

// Dados mockados - futuramente integrar com API
const MOCK_WINNERS = [
    { id: 1, name: 'Maria S.', prize: 'R$ 50.000', image: '/winner-placeholder.png', date: 'Há 2 dias' },
    { id: 2, name: 'João P.', prize: 'R$ 20.000', image: '/winner-placeholder.png', date: 'Há 3 dias' },
    { id: 3, name: 'Ana C.', prize: 'R$ 100.000', image: '/winner-placeholder.png', date: 'Há 5 dias' },
    { id: 4, name: 'Carlos M.', prize: 'R$ 10.000', image: '/winner-placeholder.png', date: 'Há 1 semana' },
];

const Winners = () => {
    return (
        <section className="py-4">
            {/* Título da seção */}
            <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🏆</span>
                <h2 className="text-lg font-bold text-gray-800">
                    Confira quem mudou de vida!
                </h2>
            </div>

            {/* Carrossel horizontal */}
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4">
                {MOCK_WINNERS.map((winner) => (
                    <div
                        key={winner.id}
                        className="flex-shrink-0 w-28 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-3 text-center text-white shadow-lg"
                    >
                        {/* Avatar */}
                        <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-white/20 overflow-hidden border-2 border-white/30">
                            <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-500 text-2xl">
                                <i className="bi bi-person-fill"></i>
                            </div>
                        </div>

                        {/* Nome */}
                        <p className="text-xs font-semibold truncate">{winner.name}</p>

                        {/* Prêmio */}
                        <p className="text-sm font-bold text-yellow-300">{winner.prize}</p>

                        {/* Data */}
                        <p className="text-[10px] opacity-70 mt-1">{winner.date}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Winners;
