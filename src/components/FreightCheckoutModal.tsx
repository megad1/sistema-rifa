"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
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
    let masked = value;
    if (name === 'cpf') {
      const digits = value.replace(/\D/g, '').slice(0, 11);
      masked = digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else if (name === 'telefone') {
      const digits = value.replace(/\D/g, '').slice(0, 11);
      if (digits.length <= 10) {
        masked = digits
          .replace(/(\d{2})(\d)/, '($1) $2')
          .replace(/(\d{4})(\d)/, '$1-$2')
          .replace(/(-\d{4})\d+?$/, '$1');
      } else {
        masked = digits
          .replace(/(\d{2})(\d)/, '($1) $2')
          .replace(/(\d{5})(\d)/, '$1-$2')
          .replace(/(-\d{4})\d+?$/, '$1');
      }
    } else if (name === 'cep') {
      const digits = value.replace(/\D/g, '').slice(0, 8);
      masked = digits.replace(/(\d{5})(\d)/, '$1-$2');
    } else if (name === 'estado') {
      masked = value.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 2);
    }
    setForm(prev => ({ ...prev, [name]: masked }));
  };

  // Auto-preencher com dados do cliente logado
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/client/profile', { cache: 'no-store' });
        const j = await r.json();
        if (j?.success && j?.cliente) {
          setForm(prev => ({
            ...prev,
            nome: j.cliente.nome || prev.nome,
            email: j.cliente.email || prev.email,
            cpf: j.cliente.cpf ? j.cliente.cpf.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2') : prev.cpf,
            telefone: j.cliente.telefone ? j.cliente.telefone.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1') : prev.telefone,
          }));
        }
      } catch {}
    })();
  }, []);

  // ViaCEP: quando CEP tiver 8 dígitos, busca endereço
  const onCepBlur = async () => {
    const cepDigits = (form.cep || '').replace(/\D/g, '');
    if (cepDigits.length !== 8) return;
    try {
      const resp = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const data = await resp.json();
      if (data?.erro) return;
      setForm(prev => ({
        ...prev,
        endereco: data.logradouro || prev.endereco,
        bairro: data.bairro || prev.bairro,
        cidade: data.localidade || prev.cidade,
        estado: (data.uf || prev.estado || '').toString().toUpperCase(),
      }));
    } catch {}
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
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-gray-50 rounded-lg shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="relative text-center p-3 border-b border-gray-200">
          <h5 className="font-semibold text-gray-800">Resgatar prêmio</h5>
          <button onClick={onClose} className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <i className="bi bi-x text-2xl"></i>
          </button>
        </div>

        {step === 1 && (
          <form className="p-4 space-y-3" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-3">
              <input name="nome" value={form.nome} onChange={handleChange} placeholder="Nome completo" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-base" />
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="E-mail" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-base" />
              <input name="cpf" value={form.cpf} onChange={handleChange} placeholder="CPF" inputMode="numeric" maxLength={14} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-base" />
              <input name="telefone" value={form.telefone} onChange={handleChange} placeholder="Telefone" inputMode="tel" maxLength={15} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-base" />
              <div className="grid grid-cols-2 gap-3">
                <input name="cep" value={form.cep} onChange={handleChange} onBlur={onCepBlur} placeholder="CEP" inputMode="numeric" maxLength={9} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-base" />
                <input name="estado" value={form.estado} onChange={handleChange} placeholder="UF" maxLength={2} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-base" />
              </div>
              <input name="endereco" value={form.endereco} onChange={handleChange} placeholder="Endereço" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-base" />
              <div className="grid grid-cols-2 gap-3">
                <input name="numero" value={form.numero} onChange={handleChange} placeholder="Número" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-base" />
                <input name="complemento" value={form.complemento} onChange={handleChange} placeholder="Complemento" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-base" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input name="bairro" value={form.bairro} onChange={handleChange} placeholder="Bairro" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-base" />
                <input name="cidade" value={form.cidade} onChange={handleChange} placeholder="Cidade" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-base" />
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

            {error && <div className="bg-red-100 border-l-4 border-red-400 text-red-800 p-2 text-xs rounded-r-md">{error}</div>}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="px-3 py-2 rounded text-sm bg-gray-100 hover:bg-gray-200">Cancelar</button>
              <button type="submit" disabled={loading} className="px-3 py-2 rounded text-sm font-bold text-white bg-green-600 hover:bg-green-700 disabled:opacity-60">
                {loading ? 'Validando...' : 'Continuar para pagamento'}
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
            <div className="bg-gray-100 p-2 rounded-md flex items-center justify-between">
              <span className="text-xs font-mono text-green-700 truncate mr-2">{pix.pixCopiaECola}</span>
              <button type="button" onClick={() => navigator.clipboard.writeText(pix.pixCopiaECola)} className="bg-gray-200 text-gray-700 px-2 py-1 rounded-md text-xs font-semibold hover:bg-gray-300 transition-colors flex items-center space-x-1 shrink-0">
                <i className="bi bi-clipboard-check"></i>
                <span>Copiar</span>
              </button>
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


