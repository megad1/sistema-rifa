// src/components/WinnersSection.tsx
"use client";

import Image from 'next/image';
import { useState } from 'react';

interface Winner {
    name: string;
    state: string;
    amount: string;
    videoId: string;
}

const winners: Winner[] = [
    {
        name: 'Maria',
        state: 'MG',
        amount: 'R$.20 MIL',
        videoId: 'PjHeldijv6w'
    },
    {
        name: 'Breno',
        state: 'BA',
        amount: 'R$.1 MIL',
        videoId: 'AkN4St-xAXk'
    },
    {
        name: 'Paulo',
        state: 'GO',
        amount: 'R$.1 MIL',
        videoId: 'U_tcHa-cPb0'
    },
    {
        name: 'Carlos',
        state: 'PE',
        amount: 'R$.1 MIL',
        videoId: 'hRm-3l2m7_o'
    },
    {
        name: 'George',
        state: 'MG',
        amount: 'R$.1 MIL',
        videoId: 'DPtKAnMVua8'
    },
    {
        name: 'Vitor',
        state: 'BA',
        amount: 'R$.1 MIL',
        videoId: 'Ry0NRHJripM'
    }
];

const WinnersSection = () => {
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
                className="container mx-auto max-w-lg px-3 my-5"
                style={{ fontFamily: 'Ubuntu, sans-serif' }}
            >
                {/* Título */}
                <div className="mb-2">
                    <h2 className="text-black text-xl font-bold">
                        <span>Raspou. Achou. É pix!</span>
                    </h2>
                    <p className="text-sm text-left opacity-50 text-black">
                        Confira os ganhadores do Raspou. Achou. É pix!
                    </p>
                </div>

                {/* Scroll horizontal de ganhadores */}
                <div className="overflow-x-auto scrollbar-none -mx-3">
                    <div className="flex pb-2 pt-3 px-3">
                        {winners.map((winner, index) => (
                            <div
                                key={index}
                                className="flex flex-col mr-2 w-20 min-w-[80px] shrink-0 cursor-pointer my-2"
                                onClick={() => openModal(winner.videoId)}
                            >
                                {/* Card com fundo azul escuro */}
                                <div
                                    className="flex relative justify-center items-center h-full shadow-lg rounded-xl flex-col px-0.5 py-0.5"
                                    style={{ backgroundColor: 'rgb(0, 53, 126)', color: 'rgb(255, 255, 255)' }}
                                >
                                    {/* Badge GANHOU */}
                                    <span
                                        className="w-10/12 mx-auto text-center text-[9px] font-medium leading-tight h-fit py-0.5 px-0.5 absolute -top-2 z-10 rounded-lg"
                                        style={{ backgroundColor: 'rgb(0, 53, 126)', color: 'rgb(255, 255, 255)' }}
                                    >
                                        <span className="block">GANHOU</span>
                                        <span className="block">{winner.amount}</span>
                                    </span>

                                    {/* Container da foto */}
                                    <div className="relative px-0.5 py-1 pb-0.5 h-32 min-h-[128px] rounded-lg overflow-hidden text-white flex flex-col justify-end text-left w-full">
                                        {/* Foto */}
                                        <Image
                                            src={`https://img.youtube.com/vi/${winner.videoId}/hqdefault.jpg`}
                                            alt={`${winner.name}/${winner.state}`}
                                            fill
                                            className="absolute inset-0 w-full h-full object-cover"
                                            unoptimized
                                        />

                                        {/* Gradiente escuro */}
                                        <div
                                            className="absolute inset-0"
                                            style={{ background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0) 90%)' }}
                                        />

                                        {/* Nome/Estado */}
                                        <div className="relative z-10 rounded-md overflow-auto">
                                            <span className="text-[9px] text-center mx-auto font-semibold leading-tight line-clamp-3 py-1 block">
                                                {winner.name}/{winner.state}
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

export default WinnersSection;
