// src/components/Header.tsx
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import MobileMenu from './MobileMenu';
import { Oswald } from 'next/font/google';
import Image from 'next/image';

const oswald = Oswald({ subsets: ['latin'], weight: '700', style: 'normal' });

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
    if (logoModeProp !== undefined) setLogoMode(logoModeProp);
    if (logoTextProp !== undefined) setLogoText(logoTextProp);
    if (logoImageUrlProp !== undefined) setLogoImageUrl(logoImageUrlProp);

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
    } catch { }

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
          try { localStorage.setItem('campaign_logo', JSON.stringify({ logoMode: mode, logoText: txt, logoImageUrl: img })); } catch { }
        }
      } catch { }
    })();
  }, [logoModeProp, logoTextProp, logoImageUrlProp]);

  return (
    <>
      {/* Header amarelo/dourado - estilo PDM exato */}
      <header
        className="sticky top-0 z-[99999] select-none transition-all duration-300"
        style={{
          backgroundColor: 'rgb(235, 171, 43)',
          height: '76px',
          fontFamily: 'Ubuntu, ui-sans-serif, system-ui, sans-serif'
        }}
      >
        <div className="container mx-auto max-w-lg px-3 h-full">
          <div className="flex items-center justify-between w-full h-full">

            {/* Logo à esquerda - texto em duas linhas, GRANDE */}
            <div className="flex items-center">
              <Link href="/" passHref>
                <div className="cursor-pointer leading-none">
                  {logoMode === null ? (
                    <div className="w-24 h-10" />
                  ) : logoMode === 'image' && logoImageUrl ? (
                    <div className="relative h-8 w-28">
                      <Image
                        key={logoImageUrl}
                        src={logoImageUrl}
                        alt="Logo"
                        fill
                        className="object-contain object-left"
                        priority
                      />
                    </div>
                  ) : (
                    <span className={`${oswald.className} text-[#1a365d] text-xl leading-[1] select-none block tracking-tight italic font-bold`}>
                      <span className="block">PIX DO</span>
                      <span className="block">MILHÃO</span>
                    </span>
                  )}
                </div>
              </Link>
            </div>

            {/* Ícones à direita */}
            <div className="flex items-center gap-1">
              {/* Ícones quadrados pretos - pequenos */}
              <button className="h-8 w-8 rounded-xl bg-[#212121] flex items-center justify-center text-white text-sm">
                <i className="bi bi-gift-fill"></i>
              </button>
              <button className="h-8 w-8 rounded-xl bg-[#212121] flex items-center justify-center text-white text-sm">
                <i className="bi bi-headset"></i>
              </button>
              <button className="h-8 w-8 rounded-xl bg-[#212121] flex items-center justify-center text-white text-sm">
                <i className="bi bi-trophy-fill"></i>
              </button>

              {/* Botão Menu GRANDE */}
              <button
                onClick={() => setIsMenuOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#212121] text-white ml-1"
              >
                <span className="h-6 w-6 rounded-full bg-white flex items-center justify-center text-[#212121] text-sm">
                  <i className="bi bi-list"></i>
                </span>
                <span className="text-sm font-medium">menu</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
};

export default Header;
