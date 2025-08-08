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
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-green-600' : 'bg-gray-300'}`}
      title={label}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow ${checked ? 'translate-x-5' : 'translate-x-1'}`}
      />
    </button>
  );
}

export default function AdminPage() {
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [fbEnabled, setFbEnabled] = useState(false);
  const [fbSendPurchase, setFbSendPurchase] = useState(false);
  const [fbPixelId, setFbPixelId] = useState('');
  const [fbCapiToken, setFbCapiToken] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/campaign', { cache: 'no-store' });
        const json = await res.json();
        if (json?.success && json.settings) {
          setTitle(json.settings.title || '');
          setImageUrl(json.settings.imageUrl || '');
        }
        const fb = await fetch('/api/facebook', { cache: 'no-store' }).then(r => r.json());
        if (fb?.success) {
          setFbEnabled(Boolean(fb.settings?.enabled));
          setFbSendPurchase(Boolean(fb.settings?.sendPurchase));
          setFbPixelId(String(fb.settings?.pixelId || ''));
          setFbCapiToken(String(fb.settings?.capiToken || ''));
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
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/campaign/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, imageUrl }),
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
        <div className="bg-white rounded-xl shadow-md p-5 space-y-4 border border-gray-200">
          {!isAuthed ? (
            <form className="space-y-3" onSubmit={handleLogin}>
              <h1 className="text-2xl font-extrabold text-gray-900">Painel Administrativo</h1>
              <p className="text-sm text-gray-600">Acesse com seu token para gerenciar a campanha.</p>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Token</label>
                <input id="admin_token" type="password" className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900" />
              </div>
              <button className="w-full bg-black text-white font-bold py-2 rounded-md hover:bg-gray-800 transition-colors">Entrar</button>
              {loginError && <div className="text-sm text-center text-red-600">{loginError}</div>}
            </form>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900">Painel Administrativo</h1>
                  <p className="text-sm text-gray-600">Gerencie as configurações da campanha e integrações.</p>
                </div>
                <button onClick={async()=>{await fetch('/api/admin/logout',{method:'POST'}); location.reload();}} className="text-sm font-semibold text-gray-600 hover:text-black">Sair</button>
              </div>

              <form className="space-y-5" onSubmit={handleSave}>
                <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                  <h2 className="text-lg font-bold text-gray-800 mb-3">Configurações da Campanha</h2>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1">Título</label>
                      <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1">URL da Imagem</label>
                      <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900" />
                      {imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imageUrl} alt="Preview da imagem" className="mt-2 rounded-md border max-h-48 object-cover w-full" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Facebook Pixel / CAPI</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-md p-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Ativar Pixel</p>
                        <p className="text-xs text-gray-500">Liga/desliga a injeção do Pixel na página</p>
                      </div>
                      <ToggleSwitch checked={fbEnabled} onChange={setFbEnabled} label="Ativar Pixel" />
                    </div>
                    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-md p-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Enviar Purchase</p>
                        <p className="text-xs text-gray-500">Dispara o evento Purchase quando pago</p>
                      </div>
                      <ToggleSwitch checked={fbSendPurchase} onChange={setFbSendPurchase} label="Enviar Purchase" />
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1">Pixel ID</label>
                      <input value={fbPixelId} onChange={(e) => setFbPixelId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1">Token API Conversões</label>
                      <input value={fbCapiToken} onChange={(e) => setFbCapiToken(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900" />
                    </div>
                  </div>
                </div>

                <button disabled={loading} className="w-full bg-black text-white font-bold py-2 rounded-md disabled:bg-gray-400 hover:bg-gray-800 transition-colors">
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


