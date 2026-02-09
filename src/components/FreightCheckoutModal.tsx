"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { FREIGHT_OPTIONS_BR } from '@/config/payments';

type PixData = { token: string; pixCopiaECola: string; qrCodeUrl: string; valor: number };
type InitialData = { nome?: string; email?: string; cpf?: string; telefone?: string };
type Props = { onClose: () => void; onPix?: (data: PixData) => void; bannerImage?: string; prizeLabel?: string; initialData?: InitialData };

export default function FreightCheckoutModal({ onClose, onPix, bannerImage = '/roleta.png', prizeLabel, initialData }: Props) {
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

  // Preencher a partir de initialData (sem delay de fetch)
  useEffect(() => {
    if (!initialData) return;
    const maskCpf = (v: string) => v.replace(/\D/g, '').slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    const maskTel = (v: string) => {
      const d = v.replace(/\D/g, '').slice(0, 11);
      return (d.length <= 10)
        ? d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1')
        : d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1');
    };
    setForm(prev => ({
      ...prev,
      nome: initialData.nome || prev.nome,
      email: initialData.email || prev.email,
      cpf: initialData.cpf ? maskCpf(initialData.cpf) : prev.cpf,
      telefone: initialData.telefone ? maskTel(initialData.telefone) : prev.telefone,
    }));
  }, [initialData]);

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
    } catch { }
  };

  const handleContinueToFreight = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // validações básicas
    const digits = (s: string) => s.replace(/\D/g, '');
    if (!form.nome || !form.email) { setError('Preencha nome e e-mail.'); return; }
    if (digits(form.cpf).length !== 11) { setError('CPF inválido.'); return; }
    const telLen = digits(form.telefone).length; if (telLen < 10 || telLen > 11) { setError('Telefone inválido.'); return; }
    if (digits(form.cep).length !== 8) { setError('CEP inválido.'); return; }
    if (!form.endereco || !form.numero || !form.bairro || !form.cidade || form.estado.length !== 2) { setError('Preencha endereço completo.'); return; }
    setStep(2);
  }, [form]);

  const handleGeneratePix = useCallback(async (e: React.FormEvent) => {
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
      // Mantém na etapa 2, exibindo QR Code e copia-e-cola abaixo das opções
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido.');
    } finally {
      setLoading(false);
    }
  }, [form, freightId, onPix]);

  return (
    <div className="fixed inset-0 z-[999999] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-gray-50 rounded-lg shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="relative text-center p-3 border-b border-gray-200">
          <h5 className="font-semibold text-gray-800">Resgatar prêmio</h5>
          <button onClick={onClose} className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <i className="bi bi-x text-2xl"></i>
          </button>
        </div>
        <div className="p-2 space-y-2">
          <div className="bg-gray-100 p-2 rounded-md text-sm text-gray-600 flex items-center space-x-3">
            <div className="relative w-24 h-16 shrink-0 bg-white">
              <Image src={bannerImage} alt="Prêmio" fill className="rounded-md object-contain" />
            </div>
            <div className="flex-1">
              <p className="text-gray-700">
                <b className="font-semibold text-gray-800">Resgate</b> do prêmio {prizeLabel ? <b className="font-semibold text-gray-800">{prizeLabel}</b> : null}
              </p>
            </div>
          </div>
        </div>

        {step === 1 && (
          <form className="p-4 space-y-3" onSubmit={handleContinueToFreight}>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Nome Completo</label>
                <input name="nome" value={form.nome} onChange={handleChange} placeholder="Seu nome completo" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-base" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">E-mail</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="seu@email.com" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-base" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">CPF</label>
                <input name="cpf" value={form.cpf} onChange={handleChange} placeholder="000.000.000-00" inputMode="numeric" maxLength={14} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-base" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Telefone</label>
                <input name="telefone" value={form.telefone} onChange={handleChange} placeholder="(00) 00000-0000" inputMode="tel" maxLength={15} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-base" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">CEP</label>
                  <input name="cep" value={form.cep} onChange={handleChange} onBlur={onCepBlur} placeholder="00000-000" inputMode="numeric" maxLength={9} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-base" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">UF</label>
                  <input name="estado" value={form.estado} onChange={handleChange} placeholder="UF" maxLength={2} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-base" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Endereço</label>
                <input name="endereco" value={form.endereco} onChange={handleChange} placeholder="Rua, avenida..." className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-base" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Número</label>
                  <input name="numero" value={form.numero} onChange={handleChange} placeholder="Número" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-base" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Complemento</label>
                  <input name="complemento" value={form.complemento} onChange={handleChange} placeholder="Apto, bloco..." className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-base" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Bairro</label>
                  <input name="bairro" value={form.bairro} onChange={handleChange} placeholder="Bairro" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-base" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Cidade</label>
                  <input name="cidade" value={form.cidade} onChange={handleChange} placeholder="Cidade" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-base" />
                </div>
              </div>
            </div>

            {error && <div className="bg-red-100 border-l-4 border-red-400 text-red-800 p-2 text-xs rounded-r-md">{error}</div>}

            <button type="submit" disabled={loading} className="w-full bg-[#1db954] hover:bg-[#1aa34a] text-white font-bold py-2 px-4 rounded-lg flex justify-center items-center space-x-2 transition-colors disabled:bg-gray-400 text-sm">
              {loading ? (
                <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Validando...</span></>
              ) : (
                <><span>Continuar</span><i className="bi bi-arrow-right"></i></>
              )}
            </button>
          </form>
        )}

        {step === 2 && (
          <form className="p-4 space-y-3" onSubmit={handleGeneratePix}>
            {!pix && <p className="text-sm font-semibold">Escolha o frete</p>}
            {!pix && (
              <div className="space-y-2">
                {FREIGHT_OPTIONS_BR.map(opt => (
                  <label key={opt.id} className="flex items-center justify-between border rounded px-3 py-2 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input type="radio" name="frete" checked={freightId === opt.id} onChange={() => setFreightId(opt.id)} />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900">{opt.label}</span>
                        {opt.subtitle && <span className="text-[11px] text-gray-600">{opt.subtitle}</span>}
                        {opt.hasInsurance && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-green-700 font-semibold mt-0.5">
                            <i className="bi bi-shield-check"></i>
                            Seguro incluso
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-bold">R$ {opt.amount.toFixed(2)}</span>
                  </label>
                ))}
              </div>
            )}

            {error && <div className="bg-red-100 border-l-4 border-red-400 text-red-800 p-2 text-xs rounded-r-md">{error}</div>}

            {!pix ? (
              <div className="space-y-2 pt-2">
                <button type="submit" disabled={loading} className="w-full bg-[#1db954] hover:bg-[#1aa34a] text-white font-bold py-2 px-4 rounded-lg flex justify-center items-center space-x-2 transition-colors disabled:bg-gray-400 text-sm">
                  {loading ? (
                    <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg><span>Gerando Pix...</span></>
                  ) : (
                    <><span>Gerar Pix do frete</span><i className="bi bi-arrow-right"></i></>
                  )}
                </button>
                <button type="button" onClick={() => setStep(1)} className="w-full bg-gray-100 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-200 text-sm">Voltar</button>
              </div>
            ) : (
              <PixLikeCheckout pix={pix} onClose={onClose} />
            )}
          </form>
        )}
      </div>
    </div>
  );
}

function PixLikeCheckout({ pix, onClose }: { pix: PixData; onClose: () => void }) {
  const [showQr, setShowQr] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<'pending' | 'paid' | 'expired'>('pending');
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (timeLeft <= 0) return; const t = setInterval(() => setTimeLeft((s) => s - 1), 1000); return () => clearInterval(t);
  }, [timeLeft]);
  const minutes = Math.max(0, Math.floor(timeLeft / 60));
  const seconds = Math.max(0, timeLeft % 60);
  const verify = async () => {
    try {
      setChecking(true);
      const r = await fetch('/api/shipping/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: pix.token }) });
      const j = await r.json();
      if (j?.success && j?.status === 'paid') setStatus('paid');
    } finally { setChecking(false); }
  };
  const handleCopy = () => {
    navigator.clipboard.writeText(pix.pixCopiaECola);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="space-y-3">
      <div className="text-center text-sm text-gray-700">
        Você tem <b className="text-red-500">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</b> para pagar
      </div>
      <div className="text-center">
        <button type="button" onClick={() => setShowQr((s) => !s)} className="text-sm text-gray-600 font-semibold hover:text-black">
          <i className={`bi ${showQr ? 'bi-eye-slash' : 'bi-qr-code'}`}></i>
          {showQr ? ' Ocultar QR Code' : ' Exibir QR Code'}
        </button>
      </div>
      {showQr && (
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pix.qrCodeUrl} alt="QR Code" className="w-48 h-48 object-contain" />
        </div>
      )}
      <div className="bg-white p-3 rounded-md shadow-sm border border-gray-200 space-y-3 text-sm">
        <div className="flex items-center space-x-2">
          <span className="flex items-center justify-center w-5 h-5 bg-gray-200 text-gray-700 rounded-full font-bold text-xs shrink-0">1</span>
          <p className="font-semibold text-gray-700">Copie o código PIX abaixo.</p>
        </div>
        <div className="bg-gray-100 p-2 rounded-md flex items-center justify-between">
          <span className="text-xs font-mono text-green-700 truncate mr-2">{pix.pixCopiaECola}</span>
          <button
            type="button"
            onClick={handleCopy}
            className={`${copied ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'} px-2 py-1 rounded-md text-xs font-semibold hover:bg-gray-300 transition-all flex items-center space-x-1 shrink-0`}
          >
            <i className={`bi ${copied ? 'bi-check-all' : 'bi-clipboard-check'}`}></i>
            <span>{copied ? 'Copiado!' : 'Copiar'}</span>
          </button>
        </div>
      </div>
      <div className="bg-white p-3 rounded-md shadow-sm border border-gray-200 space-y-2 text-xs text-gray-600">
        <div className="flex items-start space-x-2"><span className="flex items-center justify-center w-5 h-5 bg-gray-200 text-gray-700 rounded-full font-bold text-xs mt-1 shrink-0">2</span><p>Abra o app do seu banco e escolha a opção PIX.</p></div>
        <div className="flex items-start space-x-2"><span className="flex items-center justify-center w-5 h-5 bg-gray-200 text-gray-700 rounded-full font-bold text-xs mt-1 shrink-0">3</span><p>Selecione PIX cópia e cola, cole a chave e confirme.</p></div>
      </div>
      {status === 'paid' ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center text-sm text-green-700 font-semibold">Pagamento confirmado</div>
      ) : null}
      <button type="button" onClick={verify} disabled={checking} className="w-full bg-[#1db954] hover:bg-[#1aa34a] text-white font-bold py-2 px-4 rounded-lg text-sm disabled:opacity-60">{checking ? 'Verificando...' : 'Já fiz o pagamento'}</button>
      <button type="button" onClick={onClose} className="w-full bg-gray-100 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-200 text-sm">Fechar</button>
    </div>
  );
}


