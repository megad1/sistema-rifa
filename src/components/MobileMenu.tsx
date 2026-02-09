// src/components/MobileMenu.tsx
"use client";

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return (
    <>
      {/* Overlay Escuro com transição de opacidade */}
      <div
        className={`fixed inset-0 bg-black/50 z-[99998] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Menu Lateral - deslizando da esquerda */}
      <div
        ref={menuRef}
        className={`fixed top-0 left-0 h-full w-[85%] max-w-[300px] bg-white text-gray-900 z-[99999] shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ fontFamily: 'Ubuntu, sans-serif' }}
      >

        {/* Lista de Itens */}
        <div className="flex-1 overflow-y-auto py-4">
          <ul className="flex flex-col text-[15px] font-bold text-[#1F2937]"> {/* Cor de texto quase preta */}

            {/* Entrar */}
            <li>
              <Link href="/login" onClick={onClose} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                <i className="bi bi-box-arrow-in-right text-lg"></i>
                <span>Entrar</span>
              </Link>
            </li>

            <li className="border-b border-gray-200 mx-5"></li>

            {/* Início */}
            <li>
              <Link href="/" onClick={onClose} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                <i className="bi bi-house-fill text-lg"></i>
                <span>Início</span>
              </Link>
            </li>

            {/* Resultados */}
            <li>
              <Link href="/resultados" onClick={onClose} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                <i className="bi bi-trophy-fill text-lg"></i>
                <span>Resultados</span>
              </Link>
            </li>

            <li className="border-b border-gray-200 mx-5 my-2"></li>

            {/* Seção O Pix do Milhão */}
            <li className="px-5 py-2">
              <h3 className="font-bold text-lg" style={{ color: 'rgb(235, 171, 43)' }}>O Pix do Milhão</h3>
            </li>

            {/* Perguntas frequentes */}
            <li>
              <Link href="/faq" onClick={onClose} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                <i className="bi bi-question-circle-fill text-lg"></i>
                <span>Perguntas frequentes</span>
              </Link>
            </li>

            {/* Termos de uso */}
            <li>
              <Link href="/termos" onClick={onClose} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                <i className="bi bi-hammer text-lg"></i>
                <span>Termos de uso</span>
              </Link>
            </li>

            {/* Regulamento */}
            <li>
              <Link href="/regulamento" onClick={onClose} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                <span className="text-xl leading-none w-[18px] text-center font-serif font-bold">§</span>
                <span>Regulamento</span>
              </Link>
            </li>

            <li className="border-b border-gray-200 mx-5"></li>

            {/* Clube PDM */}
            <li>
              <Link href="/clube" onClick={onClose} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                <i className="bi bi-gift-fill text-lg"></i>
                <span>Clube PDM</span>
              </Link>
            </li>

            <li className="border-b border-gray-200 mx-5"></li>

            {/* Contato */}
            <li>
              <Link href="/contato" onClick={onClose} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                <i className="bi bi-chat-fill text-lg"></i>
                <span>Contato</span>
              </Link>
            </li>
            <li className="border-b border-gray-200 mx-5"></li>

          </ul>
        </div>
      </div>
    </>
  );
};

export default MobileMenu;
