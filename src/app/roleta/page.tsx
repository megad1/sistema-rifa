'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WinwheelRoulette from '@/components/WinwheelRoulette';
import Script from 'next/script';
import { Bungee } from 'next/font/google';

const bungee = Bungee({ subsets: ['latin'], weight: '400' });

import { useEffect, useState } from 'react';

export default function RoletaPage() {
  const INITIAL_SPINS = 10;
  const remainingKey = 'roulette_remaining_spins_v1';
  const [remaining, setRemaining] = useState<number>(INITIAL_SPINS);

  useEffect(() => {
    // Durante ajustes: sempre resetar os giros ao carregar a página
    try { window.localStorage.setItem(remainingKey, String(INITIAL_SPINS)); } catch {}
    setRemaining(INITIAL_SPINS);
  }, []);

  const handleSpinStart = () => {
    if (remaining <= 0) return false;
    const next = remaining - 1;
    setRemaining(next);
    try { window.localStorage.setItem(remainingKey, String(next)); } catch {}
    return true;
  };

  const handleFinished = () => {};
  return (
    <div className="bg-[#ebebeb] min-h-screen">
      {/* GSAP TweenMax v2 (necessária para Winwheel.js clássico) */}
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/2.1.3/TweenMax.min.js" strategy="afterInteractive" />
      {/* Winwheel.js via CDN - expõe window.Winwheel */}
      <Script src="https://cdn.jsdelivr.net/gh/zarocknz/javascript-winwheel/Winwheel.min.js" strategy="afterInteractive" />

      <Header />

      <div className="container mx-auto max-w-lg px-4 mt-2 space-y-2">
        <div className="bg-white p-2 rounded-lg shadow-md">
          <div className="text-center mt-6 sm:mt-8 mb-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-wide drop-shadow-sm" style={{ letterSpacing: '0.02em' }}>
              <span className={`${bungee.className} bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-400 bg-clip-text text-transparent`}>
                Roleta da Sorte
              </span>
            </h1>
            <p className="mt-1 text-base sm:text-lg text-gray-700 font-semibold">Gire a roleta e boa sorte!</p>
            <div className="mt-3 sm:mt-4 flex justify-end">
              <div className="bg-gray-100 rounded-md px-3 py-1 text-sm font-semibold text-gray-700">
                Giros restantes: <span className="text-gray-900">{remaining}</span>
              </div>
            </div>
          </div>

          <div className="mx-auto" style={{ width: 340, overflow: 'hidden' }}>
            <WinwheelRoulette
              imageSrc="/roleta.png"
              wheelSizePx={340}
              angleOffsetDeg={-30}
              paddingPx={0}
              imageFitScale={1.12}
              onSpinStart={handleSpinStart}
              onFinished={handleFinished}
              disabled={remaining <= 0}
            />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}


