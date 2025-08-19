// src/components/Header.tsx
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link'; // Importa o Link
import MobileMenu from './MobileMenu';
import { Bungee } from 'next/font/google';
import Image from 'next/image';
// Sem fetch de settings aqui por padrão para evitar flicker. Recebe por props.

const bungee = Bungee({ subsets: ['latin'], weight: '400' });

type HeaderProps = {
  logoMode?: 'text' | 'image';
  logoText?: string;
  logoImageUrl?: string;
};

const Header = ({ logoMode: logoModeProp, logoText: logoTextProp, logoImageUrl: logoImageUrlProp }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [logoMode, setLogoMode] = useState<'text' | 'image' | null>(logoModeProp ?? null);
  const [logoText, setLogoText] = useState<string | null>(logoTextProp ?? null);
  const [logoImageUrl, setLogoImageUrl] = useState<string | null>(logoImageUrlProp ?? null);

  useEffect(() => {
    // Caso as props venham definidas, usamos imediatamente
    if (logoModeProp !== undefined) setLogoMode(logoModeProp);
    if (logoTextProp !== undefined) setLogoText(logoTextProp);
    if (logoImageUrlProp !== undefined) setLogoImageUrl(logoImageUrlProp);

    // Se alguma prop não veio, tenta cache local para evitar flicker
    const needFetch = (logoModeProp === undefined || logoTextProp === undefined || logoImageUrlProp === undefined);
    if (!needFetch) return;

    try {
      const cached = localStorage.getItem('campaign_logo');
      if (cached) {
        const obj = JSON.parse(cached) as { logoMode?: 'text' | 'image'; logoText?: string; logoImageUrl?: string };
        if (obj.logoMode === 'text' || obj.logoMode === 'image') setLogoMode(obj.logoMode);
        if (typeof obj.logoText === 'string') setLogoText(obj.logoText);
        if (typeof obj.logoImageUrl === 'string') setLogoImageUrl(obj.logoImageUrl);
      }
    } catch {}

    // Busca atualizada no servidor sem cache
    (async () => {
      try {
        const res = await fetch('/api/campaign', { cache: 'no-store' });
        const json = await res.json();
        if (json?.success && json.settings) {
          const mode = json.settings.logoMode;
          const txt = json.settings.logoText;
          const img = json.settings.logoImageUrl;
          if (mode === 'text' || mode === 'image') setLogoMode(mode);
          if (typeof txt === 'string') setLogoText(txt);
          if (typeof img === 'string') setLogoImageUrl(img);
          try { localStorage.setItem('campaign_logo', JSON.stringify({ logoMode: mode, logoText: txt, logoImageUrl: img })); } catch {}
        }
      } catch {}
    })();
  }, [logoModeProp, logoTextProp, logoImageUrlProp]);

  return (
    <>
      <header className="sticky top-0 z-40 bg-black shadow-lg py-2">
        <div className="container mx-auto max-w-lg px-4">
          <div className="flex justify-between items-center">

            {/* Ícone do Menu */}
            <div className="flex-1 flex justify-start">
              <button className="text-white" onClick={() => setIsMenuOpen(true)}>
                <i className="bi bi-list text-4xl"></i>
              </button>
            </div>

            {/* Logo Centralizado */}
            <div className="flex-shrink-0">
              <Link href="/" passHref>
                <div className="w-[160px] h-[34px] cursor-pointer flex items-center justify-center overflow-hidden">
                  {logoMode === null ? (
                    <div className="w-full h-full" />
                  ) : logoMode === 'image' && logoImageUrl ? (
                    <div className="relative w-full h-full">
                      <Image key={logoImageUrl} src={logoImageUrl} alt="Logo" fill className="object-contain" priority />
                    </div>
                  ) : (
                    <span
                      aria-label={(logoText || 'Logo') as string}
                      className={`${bungee.className} block text-center bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-400 bg-clip-text text-transparent text-2xl leading-none select-none`}
                      style={{ lineHeight: 1 }}
                    >
                      {(logoText || 'Rifas7k') as string}
                    </span>
                  )}
                </div>
              </Link>
            </div>

            {/* Espaço vazio para manter o logo centralizado */}
            <div className="flex-1 flex justify-end"></div>
            
          </div>
        </div>
      </header>

      {/* Componente do Menu Lateral */}
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
};

export default Header;
