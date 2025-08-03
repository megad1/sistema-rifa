// src/components/MobileMenu.tsx
"use client";

import Link from 'next/link'; // Importando o Link

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-40"
      onClick={onClose}
    >
      <div 
        className="fixed top-0 left-0 h-full w-4/5 max-w-sm bg-gray-800 text-white p-6 z-50 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold">Menu</h2>
          <button onClick={onClose} className="text-white">
            <i className="bi bi-x-lg text-2xl"></i>
          </button>
        </div>
        <nav>
          <ul className="space-y-4">
            {/* Usando o componente Link do Next.js */}
            <li><Link href="/" className="hover:text-yellow-400">Início</Link></li>
            <li><Link href="/campanhas" className="hover:text-yellow-400">Campanhas</Link></li>
            <li><Link href="/meus-numeros" className="hover:text-yellow-400">Meus títulos</Link></li>
            <li><Link href="/ganhadores" className="hover:text-yellow-400">Ganhadores</Link></li>
            <li><Link href="/contato" className="hover:text-yellow-400">Suporte</Link></li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default MobileMenu;
