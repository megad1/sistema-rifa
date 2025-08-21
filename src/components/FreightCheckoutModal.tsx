"use client";

import { useCallback, useMemo, useState } from 'react';
import { FREIGHT_OPTIONS_BR } from '@/config/payments';

type PixData = { token: string; pixCopiaECola: string; qrCodeUrl: string; valor: number };
type Props = { onClose: () => void; onPix?: (data: PixData) => void };

export default function FreightCheckoutModal({ onClose, onPix }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [freightId, setFreightId] = useState<string>(FREIGHT_OPTIONS_BR[0]?.id || 'pac');
  const [pix, setPix] = useState<PixData | null>(null);

  const [form, setForm] = useState({
    nome: '',
    email: '',
    cpf: '',
    telefone: '',
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
  });

  const freight = useMemo(() => FREIGHT_OPTIONS_BR.find(f => f.id === freightId)!, [freightId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const resp = await fetch('/api/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, freightOptionId: freightId }),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.success) throw new Error(data?.message || 'Erro ao gerar Pix do frete.');
      const payload: PixData = { token: data.token, pixCopiaECola: data.pixCopiaECola, qrCodeUrl: data.qrCodeUrl, valor: data.valor };
      setPix(payload);
      onPix?.(payload);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido.');
    } finally {
      setLoading(false);
    }
  }, [form, freightId, onPix]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h3 className="text-lg font-bold">Entrega do prêmio</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900">✕</button>
        </div>

        {step === 1 && (
          <form className="p-5 space-y-3" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-3">
              <input name="nome" value={form.nome} onChange={handleChange} placeholder="Nome completo" className="border rounded px-3 py-2 text-sm" />
              <input name="email" value={form.email} onChange={handleChange} placeholder="E-mail" className="border rounded px-3 py-2 text-sm" />
              <input name="cpf" value={form.cpf} onChange={handleChange} placeholder="CPF" inputMode="numeric" className="border rounded px-3 py-2 text-sm" />
              <input name="telefone" value={form.telefone} onChange={handleChange} placeholder="Telefone" inputMode="tel" className="border rounded px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input name="cep" value={form.cep} onChange={handleChange} placeholder="CEP" inputMode="numeric" className="border rounded px-3 py-2 text-sm" />
                <input name="estado" value={form.estado} onChange={handleChange} placeholder="UF" maxLength={2} className="border rounded px-3 py-2 text-sm" />
              </div>
              <input name="endereco" value={form.endereco} onChange={handleChange} placeholder="Endereço" className="border rounded px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input name="numero" value={form.numero} onChange={handleChange} placeholder="Número" className="border rounded px-3 py-2 text-sm" />
                <input name="complemento" value={form.complemento} onChange={handleChange} placeholder="Complemento" className="border rounded px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input name="bairro" value={form.bairro} onChange={handleChange} placeholder="Bairro" className="border rounded px-3 py-2 text-sm" />
                <input name="cidade" value={form.cidade} onChange={handleChange} placeholder="Cidade" className="border rounded px-3 py-2 text-sm" />
              </div>

              <div className="mt-2">
                <p className="text-sm font-semibold mb-2">Escolha o frete</p>
                <div className="space-y-2">
                  {FREIGHT_OPTIONS_BR.map(opt => (
                    <label key={opt.id} className="flex items-center justify-between border rounded px-3 py-2 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <input type="radio" name="frete" checked={freightId === opt.id} onChange={() => setFreightId(opt.id)} />
                        <span className="text-sm">{opt.label}</span>
                      </div>
                      <span className="text-sm font-bold">R$ {opt.amount.toFixed(2)}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {error && <div className="text-xs text-red-600">{error}</div>}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="px-3 py-2 rounded text-sm bg-gray-100 hover:bg-gray-200">Cancelar</button>
              <button disabled={loading} className="px-3 py-2 rounded text-sm font-bold text-white bg-green-600 hover:bg-green-700 disabled:opacity-60">
                {loading ? 'Gerando Pix...' : `Pagar frete R$ ${freight.amount.toFixed(2)}`}
              </button>
            </div>
          </form>
        )}

        {step === 2 && pix && (
          <div className="p-5 space-y-3 text-center">
            <h4 className="text-lg font-extrabold text-green-600">Pagamento do frete</h4>
            <p className="text-sm text-gray-700">Escaneie o QR Code ou copie o código Pix</p>
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pix.qrCodeUrl} alt="QR Code" className="w-48 h-48 object-contain" />
            </div>
            <div className="bg-gray-100 rounded p-2 text-xs break-all">
              {pix.pixCopiaECola}
            </div>
            <div className="flex justify-center">
              <button onClick={onClose} className="px-3 py-2 rounded text-sm font-bold text-white bg-green-600 hover:bg-green-700">Fechar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


