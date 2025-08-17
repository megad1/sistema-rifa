// src/components/Campaign.tsx
'use client';

import { useState } from 'react';

interface CampaignProps {
  title: string;
  subtitle?: string;
}

const Campaign = ({ title, subtitle }: CampaignProps) => {
  const [open, setOpen] = useState(false);
  return (
    <section className="text-white text-left">
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-md animate-pulse">Adquira já!</span>
          <span className="text-xs font-semibold bg-black/40 px-2 py-1 rounded-md">15414.643737/2025-93</span>
        </div>
        <div className="w-full max-w-full cursor-pointer select-none" onClick={() => setOpen(true)}>
            <h1 className="text-xl font-bold tracking-tight truncate" title={title}>{title}</h1>
            {subtitle && (
              <p className="text-sm font-medium text-white/90 mt-0.5 truncate" title={subtitle}>{subtitle}</p>
            )}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg text-gray-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b px-4 py-2">
              <h2 className="text-sm font-semibold">Detalhes da campanha</h2>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-700">
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="p-4 space-y-2">
              <h3 className="text-lg font-bold leading-tight">{title}</h3>
              {subtitle && <p className="text-sm text-gray-700">{subtitle}</p>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Campaign;
