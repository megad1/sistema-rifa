'use client';

import { useEffect, useState } from 'react';

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
      <div className="container mx-auto max-w-lg">
        <div className="bg-white rounded-lg shadow p-4 space-y-3">
          {!isAuthed ? (
            <form className="space-y-3" onSubmit={handleLogin}>
              <h1 className="text-lg font-bold text-gray-800">Admin - Login</h1>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Token</label>
                <input id="admin_token" type="password" className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900" />
              </div>
              <button className="w-full bg-black text-white font-bold py-2 rounded-md">Entrar</button>
              {loginError && <div className="text-sm text-center text-red-600">{loginError}</div>}
            </form>
          ) : (
            <>
              <h1 className="text-lg font-bold text-gray-800">Admin - Campanha</h1>
              <form className="space-y-3" onSubmit={handleSave}>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Título</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">URL da Imagem</label>
                  <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900" />
              {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="Preview da imagem" className="mt-2 rounded-md border max-h-40 object-cover" />
              )}
                </div>
                <div className="border-t pt-3">
                  <h2 className="text-md font-bold text-gray-800 mb-2">Facebook Pixel / CAPI</h2>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700">Ativar Pixel</span>
                    <input type="checkbox" checked={fbEnabled} onChange={(e) => setFbEnabled(e.target.checked)} />
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700">Enviar Purchase</span>
                    <input type="checkbox" checked={fbSendPurchase} onChange={(e) => setFbSendPurchase(e.target.checked)} />
                  </div>
                  <div className="mb-2">
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Pixel ID</label>
                    <input value={fbPixelId} onChange={(e) => setFbPixelId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900" />
                  </div>
                  <div className="mb-2">
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Token API Conversões</label>
                    <input value={fbCapiToken} onChange={(e) => setFbCapiToken(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900" />
                  </div>
                </div>
                <button disabled={loading} className="w-full bg-black text-white font-bold py-2 rounded-md disabled:bg-gray-400">
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


