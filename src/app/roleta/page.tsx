'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WinwheelRoulette from '@/components/WinwheelRoulette';
import Script from 'next/script';
import { Bungee } from 'next/font/google';

const bungee = Bungee({ subsets: ['latin'], weight: '400' });

import { useCallback, useEffect, useState } from 'react';
import { limparCpf } from '@/utils/formatters';

export default function RoletaPage() {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [cpfInput, setCpfInput] = useState<string>('');
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const fetchBalance = useCallback(async (cpfOptional?: string) => {
    setLoading(true);
    try {
      let resp: Response;
      if (cpfOptional) {
        const clean = limparCpf(cpfOptional);
        resp = await fetch('/api/roulette/balance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cpf: clean }) });
      } else {
        resp = await fetch('/api/roulette/balance', { method: 'POST' });
      }
      if (!resp.ok) { setBalance(0); return; }
      const data = await resp.json();
      setBalance(Number(data?.balance ?? 0));
    } catch { setBalance(0); } finally { setLoading(false); }
  }, []);

  const handleSpinStart = () => true;
  const handleFinished = () => { fetchBalance(); };

  // Checa sessão; se não houver, abre modal de CPF; se houver, busca saldo
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/client/session', { cache: 'no-store' });
        const s = await r.json();
        if (s?.active) {
          await fetchBalance();
        } else {
          setShowLoginModal(true);
        }
      } catch {
        setShowLoginModal(true);
      }
    })();
  }, [fetchBalance]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const clean = limparCpf(cpfInput);
    if (!clean || clean.length !== 11) { setLoginError('CPF inválido'); return; }
    setLoginLoading(true);
    try {
      const resp = await fetch('/api/client/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cpf: clean }) });
      const data = await resp.json();
      if (!resp.ok || !data?.success) { setLoginError(data?.message || 'Falha no login'); return; }
      setShowLoginModal(false);
      setCpfInput('');
      await fetchBalance();
    } catch {
      setLoginError('Erro ao entrar');
    } finally {
      setLoginLoading(false);
    }
  };
  return (
    <div className="bg-[#ebebeb] min-h-screen">
      {/* GSAP TweenMax v2 (necessária para Winwheel.js clássico) */}
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/2.1.3/TweenMax.min.js" strategy="afterInteractive" />
      {/* Winwheel.js via CDN - expõe window.Winwheel */}
      <Script src="https://cdn.jsdelivr.net/gh/zarocknz/javascript-winwheel/Winwheel.min.js" strategy="afterInteractive" />
      {/* Confetti */}
      <Script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js" strategy="afterInteractive" />

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
            <div className="mt-3 sm:mt-4">
              <div className="flex justify-end">
                <div className="inline-flex items-center bg-gray-100 rounded-md px-3 py-1 text-sm font-semibold text-gray-700">
                  Giros restantes: <span className="ml-1 text-gray-900">{balance}</span>
                </div>
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
              disabled={balance <= 0}
            />
          </div>
        </div>
      </div>

      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-4">
            <h2 className="text-lg font-bold text-gray-900">Entre para girar a roleta</h2>
            <p className="text-xs text-gray-600 mt-1">Informe seu CPF para carregar seus giros.</p>
            <form className="mt-3 space-y-2" onSubmit={handleLogin}>
              <input
                value={cpfInput}
                onChange={(e) => setCpfInput(e.target.value)}
                placeholder="000.000.000-00"
                inputMode="numeric"
                maxLength={14}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              {loginError && <div className="text-xs text-red-600">{loginError}</div>}
              <div className="flex gap-2 justify-end pt-1">
                <button type="button" onClick={() => setShowLoginModal(false)} className="px-3 py-2 rounded-md text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200">Cancelar</button>
                <button type="submit" disabled={loginLoading} className="px-3 py-2 rounded-md text-sm font-bold text-white bg-green-600 hover:bg-green-700 disabled:opacity-60">{loginLoading ? 'Entrando...' : 'Continuar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}


