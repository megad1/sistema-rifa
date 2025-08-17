'use client';

import { useEffect, useState } from 'react';

// Toggle Switch simples e acessível
function ToggleSwitch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(!checked); } }}
      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors outline-none focus:ring-2 focus:ring-green-500 ${checked ? 'bg-green-600' : 'bg-gray-300'}`}
      title={label}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${checked ? 'translate-x-5' : 'translate-x-1'}`}
      />
    </button>
  );
}

export default function AdminPage() {
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [ticketPrice, setTicketPrice] = useState<number>(0.11);
  const [drawMode, setDrawMode] = useState<'fixedDate' | 'sameDay' | 'today'>('today');
  const [drawDate, setDrawDate] = useState<string>('');
  const [drawDay, setDrawDay] = useState<number>(9);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [fbEnabled, setFbEnabled] = useState(false);
  const [fbSendPurchase, setFbSendPurchase] = useState(false);
  const [fbPixelId, setFbPixelId] = useState('');
  const [fbCapiToken, setFbCapiToken] = useState('');
  const [utmEnabled, setUtmEnabled] = useState(false);
  const [utmToken, setUtmToken] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/campaign', { cache: 'no-store' });
        const json = await res.json();
        if (json?.success && json.settings) {
          setTitle(json.settings.title || '');
          setImageUrl(json.settings.imageUrl || '');
          setSubtitle(json.settings.subtitle || '');
          if (typeof json.settings.ticketPrice === 'number') setTicketPrice(json.settings.ticketPrice);
          if (json.settings.drawMode === 'fixedDate' || json.settings.drawMode === 'sameDay' || json.settings.drawMode === 'today') setDrawMode(json.settings.drawMode);
          if (typeof json.settings.drawDate === 'string') setDrawDate(json.settings.drawDate);
          if (typeof json.settings.drawDay === 'number') setDrawDay(json.settings.drawDay);
        }
        // Só tenta buscar integrações se já autenticado
        const cookieHasAdmin = document.cookie.includes('__Host-admin_session=');
        if (!cookieHasAdmin) return;
        const fbRes = await fetch('/api/facebook', { cache: 'no-store' });
        if (fbRes.ok) {
          const fb = await fbRes.json();
          if (fb?.success) {
            setFbEnabled(Boolean(fb.settings?.enabled));
            setFbSendPurchase(Boolean(fb.settings?.sendPurchase));
            setFbPixelId(String(fb.settings?.pixelId || ''));
            setFbCapiToken(String(fb.settings?.capiToken || ''));
          }
        }
        const utmRes = await fetch('/api/utmify', { cache: 'no-store' });
        if (utmRes.ok) {
          const utm = await utmRes.json();
          if (utm?.success) {
            setUtmEnabled(Boolean(utm.settings?.enabled));
            setUtmToken(String(utm.settings?.token || ''));
          }
        }
      } catch {}
    })();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const token = (document.getElementById('admin_token') as HTMLInputElement | null)?.value?.trim();
    if (!token) { setLoginError('Informe o token.'); return; }
    const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
    const json = await res.json();
    if (!json.success) { setLoginError(json.message || 'Falha no login'); return; }
    setIsAuthed(true);
    // Após autenticar, carrega integrações
    try {
      const [fbRes, utmRes] = await Promise.all([
        fetch('/api/facebook', { cache: 'no-store' }),
        fetch('/api/utmify', { cache: 'no-store' }),
      ]);
      if (fbRes.ok) {
        const fb = await fbRes.json();
        if (fb?.success) {
          setFbEnabled(Boolean(fb.settings?.enabled));
          setFbSendPurchase(Boolean(fb.settings?.sendPurchase));
          setFbPixelId(String(fb.settings?.pixelId || ''));
          setFbCapiToken(String(fb.settings?.capiToken || ''));
        }
      }
      if (utmRes.ok) {
        const utm = await utmRes.json();
        if (utm?.success) {
          setUtmEnabled(Boolean(utm.settings?.enabled));
          setUtmToken(String(utm.settings?.token || ''));
        }
      }
    } catch {}
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/campaign/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, imageUrl, subtitle, ticketPrice, drawMode, drawDate: drawDate || null, drawDay }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Falha ao salvar');
      // Facebook settings
      const resFb = await fetch('/api/facebook/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: fbEnabled, sendPurchase: fbSendPurchase, pixelId: fbPixelId, capiToken: fbCapiToken }),
      });
      const jsonFb = await resFb.json();
      if (!jsonFb.success) throw new Error(jsonFb.message || 'Falha ao salvar Facebook');
      const resUtm = await fetch('/api/utmify/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: utmEnabled, token: utmToken, platform: 'rifa-system' }),
      });
      const jsonUtm = await resUtm.json();
      if (!jsonUtm.success) throw new Error(jsonUtm.message || 'Falha ao salvar Utmify');
      setMessage('Salvo com sucesso.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#ebebeb] min-h-screen p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="bg-white rounded-xl shadow-md p-4 space-y-4 border border-gray-200">
          {!isAuthed ? (
            <form className="space-y-3" onSubmit={handleLogin}>
              <h1 className="text-xl font-extrabold text-gray-900">Painel Administrativo</h1>
              <p className="text-xs text-gray-600">Acesse com seu token para gerenciar a campanha.</p>
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">Token</label>
                <input id="admin_token" type="password" className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900" />
              </div>
              <button className="w-full bg-black text-white font-bold py-2 rounded-md hover:bg-gray-800 transition-colors text-sm">Entrar</button>
              {loginError && <div className="text-sm text-center text-red-600">{loginError}</div>}
            </form>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-extrabold text-gray-900">Painel Administrativo</h1>
                  <p className="text-xs text-gray-600">Gerencie as configurações da campanha e integrações.</p>
                </div>
              </div>

              <form className="space-y-4" onSubmit={handleSave}>
                <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                  <h2 className="text-base font-bold text-gray-800 mb-2">Configurações da Campanha</h2>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-800 mb-1">Título</label>
                      <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-800 mb-1">Subtítulo</label>
                      <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-800 mb-1">URL da Imagem</label>
                      <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900" />
                      {imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imageUrl} alt="Preview da imagem" className="mt-2 rounded-md border max-h-40 object-cover w-full" />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-800 mb-1">Preço do Título (R$)</label>
                      <input type="number" step="0.01" min="0" value={ticketPrice} onChange={(e) => setTicketPrice(parseFloat(e.target.value || '0'))} className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-gray-800 mb-1">Modo do Sorteio</label>
                        <select value={drawMode} onChange={(e) => setDrawMode(e.target.value as 'fixedDate' | 'sameDay' | 'today')} className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900">
                          <option value="today">Hoje (data atual)</option>
                          <option value="fixedDate">Data fixa</option>
                          <option value="sameDay">Mesmo dia de todo mês</option>
                        </select>
                      </div>
                      {drawMode === 'fixedDate' ? (
                        <div>
                          <label className="block text-xs font-semibold text-gray-800 mb-1">Data do Sorteio</label>
                          <input type="date" value={drawDate} onChange={(e) => setDrawDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900" />
                        </div>
                      ) : drawMode === 'sameDay' ? (
                        <div>
                          <label className="block text-xs font-semibold text-gray-800 mb-1">Dia do Mês</label>
                          <input type="number" min={1} max={31} value={drawDay} onChange={(e) => setDrawDay(parseInt(e.target.value || '1', 10))} className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900" />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-semibold text-gray-800 mb-1">Exibição</label>
                          <input value={new Date().toLocaleDateString('pt-BR')} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-500 bg-gray-100" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                  <h2 className="text-base font-bold text-gray-800 mb-3">Facebook Pixel / CAPI</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-md p-2">
                      <div>
                        <p className="text-xs font-semibold text-gray-800">Ativar Pixel</p>
                      </div>
                      <ToggleSwitch checked={fbEnabled} onChange={setFbEnabled} label="Ativar Pixel" />
                    </div>
                    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-md p-2">
                      <div>
                        <p className="text-xs font-semibold text-gray-800">Enviar Purchase</p>
                      </div>
                      <ToggleSwitch checked={fbSendPurchase} onChange={setFbSendPurchase} label="Enviar Purchase" />
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-800 mb-1">Pixel ID</label>
                      <input value={fbPixelId} onChange={(e) => setFbPixelId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-800 mb-1">Token API Conversões</label>
                      <input value={fbCapiToken} onChange={(e) => setFbCapiToken(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900" />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                  <h2 className="text-base font-bold text-gray-800 mb-3">Utmify</h2>
                  <div className="flex items-center justify-between bg-white border border-gray-200 rounded-md p-2">
                    <div>
                      <p className="text-xs font-semibold text-gray-800">Ativar Utmify</p>
                    </div>
                    <ToggleSwitch checked={utmEnabled} onChange={setUtmEnabled} label="Ativar Utmify" />
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-800 mb-1">Token</label>
                      <input value={utmToken} onChange={(e) => setUtmToken(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900" />
                    </div>
                  </div>
                </div>

                <button disabled={loading} className="w-full bg-black text-white font-bold py-2 rounded-md disabled:bg-gray-400 hover:bg-gray-800 transition-colors text-sm">
                  {loading ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </form>
              {message && <div className="text-sm text-center text-gray-700">{message}</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}


