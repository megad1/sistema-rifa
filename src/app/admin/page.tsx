'use client';

import { useEffect, useState } from 'react';

// Toggle Switch simples e acessível
function ToggleSwitch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
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
  const [logoMode, setLogoMode] = useState<'text' | 'image'>('text');
  const [logoText, setLogoText] = useState('Rifas7k');
  const [logoImageUrl, setLogoImageUrl] = useState('');
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
  const [activeTab, setActiveTab] = useState<'campaign' | 'facebook' | 'utmify' | 'purchases'>('campaign');
  const [purchases, setPurchases] = useState<Array<{ id: string; transaction_id: string; quantidade_bilhetes: number; valor_total: number; status: string; paid_at: string | null; created_at: string; clientes?: { nome?: string; email?: string; cpf?: string } | null }>>([]);
  const [purchasesPage, setPurchasesPage] = useState(1);
  const [purchasesTotal, setPurchasesTotal] = useState(0);
  const [purchasesLoading, setPurchasesLoading] = useState(false);

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
          if (json.settings.logoMode === 'text' || json.settings.logoMode === 'image') setLogoMode(json.settings.logoMode);
          if (typeof json.settings.logoText === 'string') setLogoText(json.settings.logoText);
          if (typeof json.settings.logoImageUrl === 'string') setLogoImageUrl(json.settings.logoImageUrl);
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

  useEffect(() => {
    if (!isAuthed) return;
    if (activeTab !== 'purchases') return;
    (async () => {
      setPurchasesLoading(true);
      try {
        const res = await fetch(`/api/admin/purchases?page=${purchasesPage}&pageSize=20`, { cache: 'no-store' });
        const json = await res.json();
        if (json?.success) { setPurchases(json.items || []); setPurchasesTotal(json.total || 0); }
      } catch {}
      setPurchasesLoading(false);
    })();
  }, [isAuthed, activeTab, purchasesPage]);

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
        body: JSON.stringify({ title, imageUrl, subtitle, ticketPrice, drawMode, drawDate: drawDate || null, drawDay, logoMode, logoText, logoImageUrl }),
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
      <div className="container mx-auto max-w-7xl">
        {!isAuthed ? (
          <div className="bg-white rounded-xl shadow-md p-4 space-y-4 border border-gray-200">
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
          </div>
        ) : (
          <>
            <div className="flex items-start gap-4">
              {/* Sidebar */}
              <aside className="hidden lg:block w-64 shrink-0">
                <div className="bg-white rounded-lg shadow border border-gray-200 p-3">
                  <h2 className="text-sm font-bold text-gray-800 mb-2">Menu</h2>
                  <nav className="space-y-1">
                    <button type="button" onClick={() => setActiveTab('campaign')} className={`w-full text-left px-3 py-2 rounded-md text-sm font-semibold ${activeTab==='campaign' ? 'bg-black text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>
                      <i className="bi bi-gear me-1"></i> Configurações
                    </button>
                    <button type="button" onClick={() => setActiveTab('facebook')} className={`w-full text-left px-3 py-2 rounded-md text-sm font-semibold ${activeTab==='facebook' ? 'bg-black text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>
                      <i className="bi bi-meta me-1"></i> Facebook Pixel
                    </button>
                    <button type="button" onClick={() => setActiveTab('utmify')} className={`w-full text-left px-3 py-2 rounded-md text-sm font-semibold ${activeTab==='utmify' ? 'bg-black text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>
                      <i className="bi bi-diagram-3 me-1"></i> Utmify
                    </button>
                    <button type="button" onClick={() => setActiveTab('purchases')} className={`w-full text-left px-3 py-2 rounded-md text-sm font-semibold ${activeTab==='purchases' ? 'bg-black text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>
                      <i className="bi bi-receipt me-1"></i> Compras (em breve)
                    </button>
                  </nav>
                </div>
              </aside>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Painel Administrativo</h1>
                    <p className="text-xs text-gray-600">Gerencie sua campanha, integrações e em breve veja as compras.</p>
                  </div>
                  <div className="hidden lg:block">
                    <button onClick={(e) => { e.preventDefault(); const form = document.getElementById('admin-form') as HTMLFormElement | null; form?.requestSubmit(); }} disabled={loading} className="px-4 py-2 rounded-md bg-black text-white font-bold disabled:bg-gray-400 hover:bg-gray-800 transition-colors text-sm">
                      {loading ? 'Salvando...' : 'Salvar alterações'}
                    </button>
                  </div>
                </div>

                <form id="admin-form" className="space-y-4" onSubmit={handleSave}>
                  {activeTab === 'campaign' && (
                    <div className="rounded-lg border border-gray-200 p-4 bg-white shadow-sm">
                      <h2 className="text-base font-bold text-gray-800 mb-3">Configurações da Campanha</h2>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-800 mb-1">Título</label>
                          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-800 mb-1">Subtítulo</label>
                          <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-800 mb-1">Logo</label>
                            <select value={logoMode} onChange={(e) => setLogoMode(e.target.value as 'text' | 'image')} className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900">
                              <option value="text">Texto</option>
                              <option value="image">Imagem (URL)</option>
                            </select>
                          </div>
                          {logoMode === 'text' ? (
                            <div>
                              <label className="block text-xs font-semibold text-gray-800 mb-1">Texto da Logo</label>
                              <input value={logoText} onChange={(e) => setLogoText(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900" />
                            </div>
                          ) : (
                            <div>
                              <label className="block text-xs font-semibold text-gray-800 mb-1">URL da Imagem da Logo</label>
                              <input value={logoImageUrl} onChange={(e) => setLogoImageUrl(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900" />
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-800 mb-1">URL da Imagem do Banner</label>
                          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900" />
                          {imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={imageUrl} alt="Preview da imagem" className="mt-2 rounded-md border max-h-40 object-cover w-full" />
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-800 mb-1">Modo do Sorteio</label>
                            <select value={drawMode} onChange={(e) => setDrawMode(e.target.value as 'fixedDate' | 'sameDay' | 'today')} className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900">
                              <option value="today">Hoje (data atual)</option>
                              <option value="fixedDate">Data fixa</option>
                              <option value="sameDay">Mesmo dia de todo mês</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        <div>
                          <label className="block text-xs font-semibold text-gray-800 mb-1">Preço do Título (R$)</label>
                          <input type="number" step="0.01" min="0" value={ticketPrice} onChange={(e) => setTicketPrice(parseFloat(e.target.value || '0'))} className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900" />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'facebook' && (
                    <div className="rounded-lg border border-gray-200 p-4 bg-white shadow-sm">
                      <h2 className="text-base font-bold text-gray-800 mb-3">Facebook Pixel / CAPI</h2>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md p-2">
                          <div>
                            <p className="text-xs font-semibold text-gray-800">Ativar Pixel</p>
                          </div>
                          <ToggleSwitch checked={fbEnabled} onChange={setFbEnabled} label="Ativar Pixel" />
                        </div>
                        <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md p-2">
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
                  )}

                  {activeTab === 'utmify' && (
                    <div className="rounded-lg border border-gray-200 p-4 bg-white shadow-sm">
                      <h2 className="text-base font-bold text-gray-800 mb-3">Utmify</h2>
                      <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md p-2">
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
                  )}

                  {activeTab === 'purchases' && (
                    <div className="rounded-lg border border-gray-200 p-4 bg-white shadow-sm">
                      <h2 className="text-base font-bold text-gray-800 mb-3">Compras (em breve)</h2>
                      <div className="text-xs text-gray-600 mb-3">Lista de compras do banco (ordenado por mais recentes).</div>
                      <div className="flex items-center gap-2 mb-2">
                        <button type="button" onClick={async () => {
                          setPurchasesLoading(true);
                          try {
                            const res = await fetch(`/api/admin/purchases?page=${purchasesPage}&pageSize=20`, { cache: 'no-store' });
                            const json = await res.json();
                            if (json?.success) { setPurchases(json.items || []); setPurchasesTotal(json.total || 0); }
                          } finally { setPurchasesLoading(false); }
                        }} className="px-3 py-1 rounded-md bg-black text-white text-xs font-semibold">Atualizar</button>
                        <span className="text-[12px] text-gray-600">Página {purchasesPage} de {Math.max(1, Math.ceil(purchasesTotal / 20))}</span>
                        <div className="ml-auto flex gap-2">
                          <button type="button" disabled={purchasesPage<=1} onClick={() => setPurchasesPage((p) => Math.max(1, p-1))} className="px-2 py-1 rounded-md bg-gray-200 text-gray-800 text-xs disabled:opacity-50">Anterior</button>
                          <button type="button" disabled={purchasesPage>=Math.max(1, Math.ceil(purchasesTotal/20))} onClick={() => setPurchasesPage((p) => p+1)} className="px-2 py-1 rounded-md bg-gray-200 text-gray-800 text-xs disabled:opacity-50">Próxima</button>
                        </div>
                      </div>
                      <div className="border rounded-md overflow-hidden">
                        <div className="grid grid-cols-12 bg-gray-50 p-2 text-[12px] font-semibold text-gray-700">
                          <div className="col-span-3">Cliente</div>
                          <div className="col-span-3">Transação</div>
                          <div className="col-span-2">Quantidade</div>
                          <div className="col-span-2">Valor</div>
                          <div className="col-span-2 text-right">Status</div>
                        </div>
                        {purchasesLoading ? (
                          <div className="p-3 text-xs text-gray-500">Carregando...</div>
                        ) : purchases.length === 0 ? (
                          <div className="p-3 text-xs text-gray-500">Nenhum dado para exibir.</div>
                        ) : (
                          <div className="divide-y">
                            {purchases.map((c) => (
                              <div key={c.id} className="grid grid-cols-12 p-2 text-[12px] text-gray-800">
                                <div className="col-span-3 truncate">{c.clientes?.nome || '—'}<span className="block text-[11px] text-gray-500 truncate">{c.clientes?.email || ''}</span></div>
                                <div className="col-span-3 truncate">{c.transaction_id}</div>
                                <div className="col-span-2">{c.quantidade_bilhetes}</div>
                                <div className="col-span-2">R$ {Number(c.valor_total).toFixed(2)}</div>
                                <div className="col-span-2 text-right font-semibold {c.status==='paid' ? 'text-green-700' : 'text-yellow-700'}">{c.status}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="lg:hidden">
                    <button disabled={loading} className="w-full bg-black text-white font-bold py-2 rounded-md disabled:bg-gray-400 hover:bg-gray-800 transition-colors text-sm">
                      {loading ? 'Salvando...' : 'Salvar alterações'}
                    </button>
                  </div>
                </form>

                {message && <div className="text-sm text-center text-gray-700 mt-2">{message}</div>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


