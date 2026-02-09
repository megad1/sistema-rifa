// src/components/LastWinnersSection.tsx
"use client";

import Image from 'next/image';
import { useState } from 'react';

interface BigWinner {
    name: string;
    city: string;
    state: string;
    amount: string;
    videoId: string;
}

const bigWinners: BigWinner[] = [
    {
        name: 'Alexandre C. L. M.',
        city: 'Rio de Janeiro',
        state: 'RJ',
        amount: 'R$ 1 MILHÃO',
        videoId: 'V_lNXvjzXQY'
    },
    {
        name: 'Roberto S. A.',
        city: 'Paraibano',
        state: 'MA',
        amount: 'R$ 100 MIL',
        videoId: 'ecG8taH4FH0'
    },
    {
        name: 'Leilane J. P. S.',
        city: 'Gravata',
        state: 'PE',
        amount: 'R$ 40 MIL',
        videoId: 'CtDethtILwg'
    },
    {
        name: 'Rainere A. P. O.',
        city: 'Conde',
        state: 'PB',
        amount: 'R$ 100 MIL',
        videoId: 'GBwS9C2SeL4'
    }
];

const LastWinnersSection = () => {
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

    const openModal = (videoId: string) => {
        setSelectedVideo(videoId);
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        setSelectedVideo(null);
        document.body.style.overflow = 'unset';
    };

    return (
        <>
            <section
                className="container mx-auto max-w-lg px-3 mt-5"
                style={{ fontFamily: 'Ubuntu, sans-serif' }}
            >
                {/* Título */}
                <div className="mb-2">
                    <h2 className="text-black text-xl font-bold">
                        <span>Confira quem mudou de vida</span>
                    </h2>
                </div>

                {/* Subtítulo */}
                <div className="mb-4 text-sm text-left text-black opacity-50">
                    Conheça os mais recentes ganhadores
                </div>

                {/* Scroll horizontal dos ganhadores */}
                <div className="overflow-x-auto scrollbar-none -mx-3">
                    <div className="flex gap-2 px-3 pb-4">
                        {bigWinners.map((winner, index) => (
                            <div
                                key={index}
                                className="flex flex-col w-40 min-w-[160px] cursor-pointer shrink-0"
                                onClick={() => openModal(winner.videoId)}
                            >
                                {/* Badge do valor ganho */}
                                <div
                                    className="flex justify-center items-center mb-1 h-full rounded-md border border-black/10 shadow-lg"
                                    style={{ backgroundColor: 'rgb(13, 167, 0)', color: 'rgb(255, 255, 255)' }}
                                >
                                    <span className="w-full text-center text-[12px] font-bold leading-tight p-1 rounded-md">
                                        Ganhou {winner.amount}
                                    </span>
                                </div>

                                {/* Card do vídeo */}
                                <div className="relative flex flex-col h-60 min-h-[240px] overflow-hidden rounded-lg">
                                    {/* Foto de fundo */}
                                    <div className="absolute inset-0 z-0">
                                        <Image
                                            src={`https://img.youtube.com/vi/${winner.videoId}/maxresdefault.jpg`}
                                            alt={`Foto de ${winner.name}`}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    </div>

                                    {/* Ícone de play do YouTube */}
                                    <div className="absolute z-20 flex items-center justify-center top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                        <Image
                                            src="https://pixdomilhao.com.br/assets/youtube-shorts-DrEjrmxt.png"
                                            alt="Assistir vídeo"
                                            width={40}
                                            height={40}
                                            className="w-10 h-10"
                                            unoptimized
                                        />
                                    </div>

                                    {/* Gradiente e informações */}
                                    <div className="relative z-10 px-1 py-1 mt-auto bg-gradient-to-t from-gray-900/90 via-gray-900/70 to-transparent leading-none">
                                        <div className="flex flex-col gap-1 text-white">
                                            <span className="text-[12px] font-bold truncate max-w-full">
                                                {winner.name}
                                            </span>
                                            <span className="text-[10px] font-medium truncate max-w-full">
                                                {winner.city}/{winner.state}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Modal do Vídeo */}
            {selectedVideo && (
                <div
                    className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80"
                    onClick={closeModal}
                >
                    {/* Botão Fechar */}
                    <button
                        className="absolute top-4 right-4 text-white text-4xl font-light z-[100000] hover:opacity-70 transition-opacity"
                        onClick={closeModal}
                    >
                        ×
                    </button>

                    {/* Container do Vídeo */}
                    <div
                        className="relative w-full max-w-sm mx-4 aspect-[9/16] rounded-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <iframe
                            src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1`}
                            className="absolute inset-0 w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default LastWinnersSection;
