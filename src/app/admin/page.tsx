'use client';

import { useEffect, useState } from 'react';
import { Bungee } from 'next/font/google';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from '@/components/ui/table';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const bungee = Bungee({ subsets: ['latin'], weight: '400' });

// Removido ToggleSwitch em favor do Switch do shadcn

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

  function StatusChip({ status }: { status: string }) {
    const s = (status || '').toLowerCase();
    const isPaid = s === 'paid';
    const isPending = s === 'pending';
    const theme = isPaid
      ? { bg: 'bg-emerald-500/10', text: 'text-emerald-400', ring: 'ring-emerald-500/30', icon: <CheckCircle2 className="h-3.5 w-3.5" /> , label: 'Pago' }
      : isPending
      ? { bg: 'bg-amber-500/10', text: 'text-amber-400', ring: 'ring-amber-500/30', icon: <Clock className="h-3.5 w-3.5" />, label: 'Pendente' }
      : { bg: 'bg-rose-500/10', text: 'text-rose-400', ring: 'ring-rose-500/30', icon: <XCircle className="h-3.5 w-3.5" />, label: status };

    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${theme.bg} ${theme.text} ring-1 ring-inset ${theme.ring}`}> 
        {theme.icon}
        <span className="leading-none">{theme.label}</span>
      </span>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-background text-foreground">
      <div className="container mx-auto max-w-7xl">
        {!isAuthed ? (
          <div className="min-h-[80vh] flex items-center justify-center">
            <div className="max-w-xl mx-auto w-full">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Painel Administrativo</CardTitle>
                <p className="text-xs text-gray-600">Acesse com seu token para gerenciar a campanha.</p>
              </CardHeader>
              <CardContent>
                <form className="space-y-3" onSubmit={handleLogin}>
                  <div>
                    <Label htmlFor="admin_token" className="text-xs">Token</Label>
                    <Input id="admin_token" type="password" className="mt-1" />
                  </div>
                  <Button className="w-full" type="submit">Entrar</Button>
                  {loginError && <div className="text-sm text-center text-red-600">{loginError}</div>}
                </form>
              </CardContent>
            </Card>
            </div>
          </div>
        ) : (
          <>
            <div className="w-full">
              <div className="mb-3">
                <h1 className="text-2xl font-extrabold tracking-tight">Painel Administrativo</h1>
                <p className="text-xs text-muted-foreground">Gerencie sua campanha, integrações e compras.</p>
              </div>

              <div className="lg:flex lg:items-start lg:gap-4">
                {/* Sidebar desktop */}
                <aside className="hidden lg:block w-64 shrink-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Menu</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button variant={activeTab==='campaign' ? 'default' : 'secondary'} className="w-full justify-start" onClick={() => setActiveTab('campaign')}>Configurações</Button>
                      <Button variant={activeTab==='purchases' ? 'default' : 'secondary'} className="w-full justify-start" onClick={() => setActiveTab('purchases')}>Compras</Button>
                      <Button variant={activeTab==='facebook' ? 'default' : 'secondary'} className="w-full justify-start" onClick={() => setActiveTab('facebook')}>Facebook Pixel</Button>
                      <Button variant={activeTab==='utmify' ? 'default' : 'secondary'} className="w-full justify-start" onClick={() => setActiveTab('utmify')}>Utmify</Button>
                    </CardContent>
                  </Card>
                </aside>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
                <TabsList className="flex gap-2 overflow-x-auto no-scrollbar mb-3 lg:hidden sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-1 border border-border rounded-md">
                  <TabsTrigger value="campaign" className="border border-border rounded-md py-2 px-2 text-xs shrink-0 whitespace-nowrap data-[state=active]:bg-muted data-[state=active]:text-foreground">Configurações</TabsTrigger>
                  <TabsTrigger value="purchases" className="border border-border rounded-md py-2 px-2 text-xs shrink-0 whitespace-nowrap data-[state=active]:bg-muted data-[state=active]:text-foreground">Compras</TabsTrigger>
                  <TabsTrigger value="facebook" className="border border-border rounded-md py-2 px-2 text-xs shrink-0 whitespace-nowrap data-[state=active]:bg-muted data-[state=active]:text-foreground">Facebook Pixel</TabsTrigger>
                  <TabsTrigger value="utmify" className="border border-border rounded-md py-2 px-2 text-xs shrink-0 whitespace-nowrap data-[state=active]:bg-muted data-[state=active]:text-foreground">Utmify</TabsTrigger>
                </TabsList>

                {/* Configurações */}
                {activeTab === 'campaign' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Configurações da Campanha</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-xs" htmlFor="title">Título</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs" htmlFor="subtitle">Subtítulo</Label>
                        <Input id="subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="mt-1" />
                      </div>
                      <div className="grid grid-cols-2 gap-3 items-end">
                        <div>
                          <Label className="text-xs">Logo</Label>
                          <Select value={logoMode} onValueChange={(v) => setLogoMode(v as 'text' | 'image')}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Texto</SelectItem>
                              <SelectItem value="image">Imagem (URL)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          {logoMode === 'text' ? (
                            <>
                              <Label className="text-xs" htmlFor="logoText">Texto da Logo</Label>
                              <Input id="logoText" value={logoText} onChange={(e) => setLogoText(e.target.value)} className="mt-1" />
                            </>
                          ) : (
                            <>
                              <Label className="text-xs" htmlFor="logoUrl">URL da Imagem da Logo</Label>
                              <Input id="logoUrl" value={logoImageUrl} onChange={(e) => setLogoImageUrl(e.target.value)} className="mt-1" />
                            </>
                          )}
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        {logoMode === 'image' && logoImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={logoImageUrl} alt="Preview da logo" className="max-h-20 w-full object-contain rounded-md border border-border bg-card" />
                        ) : (
                          <div className="h-12 flex items-center justify-center rounded-md border border-border bg-card">
                            <span className={`${bungee.className} block text-center bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-400 bg-clip-text text-transparent text-2xl leading-none select-none`} style={{ lineHeight: 1 }}>{logoText || 'Rifas7k'}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs" htmlFor="bannerUrl">URL da Imagem do Banner</Label>
                        <Input id="bannerUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="mt-1" />
                        {imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imageUrl} alt="Preview da imagem" className="mt-2 rounded-md border border-border max-h-60 object-contain w-full bg-card" />
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3 items-end">
                        <div>
                          <Label className="text-xs">Modo do Sorteio</Label>
                          <Select value={drawMode} onValueChange={(v) => setDrawMode(v as 'fixedDate' | 'sameDay' | 'today')}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="today">Hoje (data atual)</SelectItem>
                              <SelectItem value="fixedDate">Data fixa</SelectItem>
                              <SelectItem value="sameDay">Mesmo dia de todo mês</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          {drawMode === 'fixedDate' ? (
                            <>
                              <Label className="text-xs" htmlFor="drawDate">Data do Sorteio</Label>
                              <Input id="drawDate" type="date" value={drawDate || ''} onChange={(e) => setDrawDate(e.target.value)} className="mt-1" />
                            </>
                          ) : drawMode === 'sameDay' ? (
                            <>
                              <Label className="text-xs" htmlFor="drawDay">Dia do Mês</Label>
                              <Input id="drawDay" type="number" min={1} max={31} value={drawDay} onChange={(e) => setDrawDay(parseInt(e.target.value || '1', 10))} className="mt-1" />
                            </>
                          ) : (
                            <>
                              <Label className="text-xs">Exibição</Label>
                              <Input readOnly value={new Date().toLocaleDateString('pt-BR')} className="mt-1" />
                            </>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs" htmlFor="price">Preço do Título (R$)</Label>
                        <Input id="price" type="number" step="0.01" min="0" value={ticketPrice} onChange={(e) => setTicketPrice(parseFloat(e.target.value || '0'))} className="mt-1 w-40 sm:w-48" />
                      </div>
                      <div className="flex justify-end">
                        <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar alterações'}</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Facebook */}
                {activeTab === 'facebook' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Facebook Pixel / CAPI</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center justify-between bg-muted border border-border rounded-md p-2 max-w-sm">
                          <Label className="text-xs" htmlFor="fb-enabled">Ativar Pixel</Label>
                          <Switch id="fb-enabled" checked={fbEnabled} onCheckedChange={setFbEnabled} />
                        </div>
                        <div className="flex items-center justify-between bg-muted border border-border rounded-md p-2 max-w-sm">
                          <Label className="text-xs" htmlFor="fb-purchase">Enviar Purchase</Label>
                          <Switch id="fb-purchase" checked={fbSendPurchase} onCheckedChange={setFbSendPurchase} />
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-2">
                        <div>
                          <Label className="text-xs">Pixel ID</Label>
                          <Input value={fbPixelId} onChange={(e) => setFbPixelId(e.target.value)} className="mt-1" />
                        </div>
                        <div>
                          <Label className="text-xs">Token API Conversões</Label>
                          <Input value={fbCapiToken} onChange={(e) => setFbCapiToken(e.target.value)} className="mt-1" />
                        </div>
                      </div>
                      <div className="flex justify-end mt-3">
                        <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar alterações'}</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Utmify */}
                {activeTab === 'utmify' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Utmify</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between bg-muted border border-border rounded-md p-2 max-w-sm">
                        <Label className="text-xs" htmlFor="utm-enabled">Ativar Utmify</Label>
                        <Switch id="utm-enabled" checked={utmEnabled} onCheckedChange={setUtmEnabled} />
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-2">
                        <div>
                          <Label className="text-xs">Token</Label>
                          <Input value={utmToken} onChange={(e) => setUtmToken(e.target.value)} className="mt-1" />
                        </div>
                      </div>
                      <div className="flex justify-end mt-3">
                        <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar alterações'}</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Compras */}
                {activeTab === 'purchases' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Compras</CardTitle>
                      <p className="text-xs text-gray-600">Ordenado por mais recentes. Use os botões para navegar.</p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-3">
                        <Button type="button" onClick={async () => {
                          setPurchasesLoading(true);
                          try {
                            const res = await fetch(`/api/admin/purchases?page=${purchasesPage}&pageSize=20`, { cache: 'no-store' });
                            const json = await res.json();
                            if (json?.success) { setPurchases(json.items || []); setPurchasesTotal(json.total || 0); }
                          } finally { setPurchasesLoading(false); }
                        }} size="sm">Atualizar</Button>
                        <span className="text-[12px] text-gray-600">Página {purchasesPage} de {Math.max(1, Math.ceil(purchasesTotal / 20))}</span>
                        <div className="ml-auto flex gap-2">
                          <Button type="button" variant="secondary" size="sm" disabled={purchasesPage<=1} onClick={() => setPurchasesPage((p) => Math.max(1, p-1))}>Anterior</Button>
                          <Button type="button" variant="secondary" size="sm" disabled={purchasesPage>=Math.max(1, Math.ceil(purchasesTotal/20))} onClick={() => setPurchasesPage((p) => p+1)}>Próxima</Button>
                        </div>
                      </div>
                      <div className="rounded-lg overflow-hidden border border-border">
                        <div className="overflow-x-auto [--radix-select-content-z-index:60]">
                          <div className="min-w-[760px]">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Cliente</TableHead>
                                  <TableHead>Transação</TableHead>
                                  <TableHead>Quantidade</TableHead>
                                  <TableHead className="text-right">Valor</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {purchasesLoading ? (
                                  <TableRow><TableCell colSpan={5} className="text-xs text-muted-foreground">Carregando...</TableCell></TableRow>
                                ) : purchases.length === 0 ? (
                                  <TableRow><TableCell colSpan={5} className="text-xs text-muted-foreground">Nenhuma compra encontrada.</TableCell></TableRow>
                                ) : (
                                  purchases.map((c) => {
                                    const valor = (Number(c.valor_total) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                                    return (
                                      <TableRow key={c.id} className="hover:bg-muted/60">
                                        <TableCell>
                                          <StatusChip status={c.status} />
                                        </TableCell>
                                        <TableCell>
                                          <div className="font-semibold truncate max-w-[220px]">{c.clientes?.nome || '—'}</div>
                                          <div className="text-[11px] text-muted-foreground truncate max-w-[220px]">{c.clientes?.email || ''}</div>
                                        </TableCell>
                                        <TableCell className="font-mono text-[12px] truncate max-w-[160px]">{c.transaction_id}</TableCell>
                                        <TableCell>{c.quantidade_bilhetes}</TableCell>
                                        <TableCell className="text-right">{valor}</TableCell>
                                      </TableRow>
                                    );
                                  })
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                  </Tabs>
                </div>
              </div>

              {message && <div className="text-sm text-center text-gray-700 mt-2">{message}</div>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}


