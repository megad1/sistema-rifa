import { supabaseAdmin } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';
import { buildPurchaseConfirmationHtml } from '@/lib/email-templates';

interface CompraInterna {
  id: string;
  status: string;
  quantidade_bilhetes: number;
  cliente_id: string | number;
  tracking_parameters?: {
    spins_to_grant?: string | number;
    [key: string]: unknown;
  };
}

export interface ProcessPaymentResult {
  titles: string[];
  updated: boolean;
  status: string;
  raw?: unknown;
  transactionIdUsed?: string;
}

export interface SkalePayTransactionStatus {
  id: string;
  status: string;
  [key: string]: unknown;
}

export async function getSkalePayTransactionStatus(transactionId: string): Promise<SkalePayTransactionStatus> {
  const secretKey = process.env.SKALEPAY_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Chave da API (SKALEPAY_SECRET_KEY) não configurada.');
  }

  const authString = Buffer.from(`${secretKey}:x`).toString('base64');
  const cacheBuster = `_=${new Date().getTime()}`;
  const apiUrl = `https://api.conta.skalepay.com.br/v1/transactions/${transactionId}?${cacheBuster}`;

  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Erro da API SkalePay:', errorData);
    throw new Error('Erro ao consultar o status da transação na SkalePay.');
  }

  return (await response.json()) as SkalePayTransactionStatus;
}

function generateTitles(quantity: number, avoid: Set<string> = new Set()): string[] {
  const titles = new Set<string>(avoid);
  while (titles.size < avoid.size + quantity) {
    const title = Math.floor(100000 + Math.random() * 900000).toString();
    titles.add(title);
  }
  const result: string[] = [];
  for (const t of titles) {
    if (!avoid.has(t)) result.push(t);
  }
  return result.slice(0, quantity);
}

export async function processPaymentConfirmation(transactionId: string): Promise<ProcessPaymentResult> {
  if (!transactionId) {
    throw new Error('ID da transação não fornecido.');
  }

  // 1) Status externo
  const skalePayData = await getSkalePayTransactionStatus(transactionId);
  const skalePayStatus = skalePayData.status;

  // 2) Compra no nosso banco
  const { data: compra, error: compraError } = await supabaseAdmin
    .from('compras')
    .select('*')
    .eq('transaction_id', transactionId)
    .single();

  if (compraError || !compra) {
    console.error('Compra não encontrada no banco de dados:', compraError);
    throw new Error('Compra não encontrada no sistema.');
  }

  let titles: string[] = [];
  let updated = false;

  if (skalePayStatus === 'paid') {
    if (compra.status === 'pending') {
      const newTitles = generateTitles(compra.quantidade_bilhetes);

      const { error: updateError } = await supabaseAdmin
        .from('compras')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', compra.id);

      if (updateError) {
        console.error('Erro ao atualizar status da compra:', updateError);
        throw new Error('Erro ao atualizar o status do pagamento.');
      }

      const bilhetesParaInserir = newTitles.map((numero) => ({
        compra_id: compra.id,
        numero,
      }));

      const { error: bilhetesError } = await supabaseAdmin
        .from('bilhetes')
        .insert(bilhetesParaInserir);

      if (bilhetesError) {
        console.error('Erro ao salvar os bilhetes:', bilhetesError);
        throw new Error('Pagamento confirmado, mas houve um erro ao gerar seus bilhetes.');
      }

      titles = newTitles;
      updated = true;

      // Conceder giros pela compra (apenas na primeira confirmação)
      try {
        let spins = 0;
        const track = (compra as unknown as CompraInterna).tracking_parameters;
        if (track && track.spins_to_grant) {
          spins = Number(track.spins_to_grant);
        } else {
          spins = calculateSpinsFromQuantity(compra.quantidade_bilhetes);
        }
        if (spins > 0) await grantSpinsToCliente(String((compra as unknown as CompraInterna).cliente_id), spins);
      } catch (e) {
        console.error('Erro ao conceder giros (polling):', e);
      }

      // Enviar email de confirmação
      try {
        await sendConfirmationEmail(compra.id, String((compra as unknown as CompraInterna).cliente_id), compra.quantidade_bilhetes, compra.valor_total ?? 0, newTitles);
      } catch (e) {
        console.error('[EMAIL] Erro ao enviar confirmação (polling):', e);
      }
    } else {
      // Já pago: garantir idempotência
      const { data: existingTitles, error: existingTitlesError } = await supabaseAdmin
        .from('bilhetes')
        .select('numero')
        .eq('compra_id', compra.id);

      if (existingTitlesError) {
        throw new Error('Erro ao buscar seus bilhetes já existentes.');
      }
      const currentTitles = (existingTitles || []).map((t) => t.numero);

      if (currentTitles.length < compra.quantidade_bilhetes) {
        const missing = compra.quantidade_bilhetes - currentTitles.length;
        const avoid = new Set(currentTitles);
        const newOnes = generateTitles(missing, avoid);
        if (newOnes.length > 0) {
          const insertRows = newOnes.map((numero) => ({ compra_id: compra.id, numero }));
          const { error: insertMissingError } = await supabaseAdmin
            .from('bilhetes')
            .insert(insertRows);
          if (insertMissingError) {
            console.error('Erro ao inserir bilhetes faltantes:', insertMissingError);
            throw new Error('Erro ao completar seus bilhetes.');
          }
          titles = [...currentTitles, ...newOnes];
          updated = true;
        } else {
          titles = currentTitles;
        }
      } else {
        titles = currentTitles;
      }
    }
  }

  return { titles, updated, status: skalePayStatus, raw: skalePayData };
}

export interface SkalePayWebhookPayload {
  id?: number | string;
  status?: string;
  transactionId?: string;
  transaction_id?: string;
  secureId?: string;
  data?: {
    id?: number | string;
    secureId?: string;
    status?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export async function processPaymentFromWebhookPayload(payload: SkalePayWebhookPayload): Promise<ProcessPaymentResult> {
  // A SkalePay envia tanto um id numérico (data.id) quanto um secureId (data.secureId)
  const numericId = payload?.data?.id ?? payload?.id;
  const secureId = payload?.data?.secureId ?? payload?.secureId ?? payload?.transactionId ?? payload?.transaction_id;

  const candidateIds: string[] = [];
  if (numericId !== undefined && numericId !== null) candidateIds.push(String(numericId));
  if (secureId) candidateIds.push(String(secureId));
  if (candidateIds.length === 0) {
    throw new Error('Webhook sem transaction id.');
  }

  const skalePayStatus = (payload?.data?.status || payload?.status || '').toString().toLowerCase();

  // 2) Tenta localizar a compra por qualquer um dos IDs candidatos (prioriza o numérico, que é o salvo no create)
  let compra: {
    id: string;
    quantidade_bilhetes: number;
    valor_total: number;
    status: 'pending' | 'paid' | string;
    cliente_id: string | number;
    tracking_parameters?: Record<string, unknown>;
    [key: string]: unknown;
  } | null = null;
  let lastError: unknown = null;
  for (const candidate of candidateIds) {
    const { data, error } = await supabaseAdmin
      .from('compras')
      .select('*')
      .eq('transaction_id', candidate)
      .single();
    if (!error && data) {
      compra = data;
      break;
    }
    lastError = error;
  }

  if (!compra) {
    console.error('Compra não encontrada no banco de dados (webhook):', lastError, 'candidates:', candidateIds);
    throw new Error('Compra não encontrada no sistema.');
  }

  let titles: string[] = [];
  let updated = false;

  if (skalePayStatus === 'paid') {
    if (compra.status === 'pending') {
      const newTitles = generateTitles(compra.quantidade_bilhetes);

      const { error: updateError } = await supabaseAdmin
        .from('compras')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', compra.id);

      if (updateError) {
        console.error('Erro ao atualizar status da compra (webhook):', updateError);
        throw new Error('Erro ao atualizar o status do pagamento.');
      }

      const bilhetesParaInserir = newTitles.map((numero) => ({
        compra_id: compra.id,
        numero,
      }));

      const { error: bilhetesError } = await supabaseAdmin
        .from('bilhetes')
        .insert(bilhetesParaInserir);

      if (bilhetesError) {
        console.error('Erro ao salvar os bilhetes (webhook):', bilhetesError);
        throw new Error('Pagamento confirmado, mas houve um erro ao gerar seus bilhetes.');
      }

      titles = newTitles;
      updated = true;

      try {
        let spins = 0;
        const track = (compra as unknown as CompraInterna).tracking_parameters;
        if (track && track.spins_to_grant) {
          spins = Number(track.spins_to_grant);
        } else {
          spins = calculateSpinsFromQuantity(compra.quantidade_bilhetes);
        }

        if (spins > 0) await grantSpinsToCliente(String((compra as unknown as CompraInterna).cliente_id), spins);
      } catch (e) {
        console.error('Erro ao conceder giros (webhook):', e);
      }

      // Enviar email de confirmação
      try {
        await sendConfirmationEmail(compra.id, String((compra as unknown as CompraInterna).cliente_id), compra.quantidade_bilhetes, compra.valor_total ?? 0, newTitles);
      } catch (e) {
        console.error('[EMAIL] Erro ao enviar confirmação (webhook):', e);
      }
    } else {
      // Já pago: garantir idempotência
      const { data: existingTitles, error: existingTitlesError } = await supabaseAdmin
        .from('bilhetes')
        .select('numero')
        .eq('compra_id', compra.id);

      if (existingTitlesError) {
        throw new Error('Erro ao buscar seus bilhetes já existentes.');
      }
      const currentTitles = (existingTitles || []).map((t) => t.numero);

      if (currentTitles.length < compra.quantidade_bilhetes) {
        const missing = compra.quantidade_bilhetes - currentTitles.length;
        const avoid = new Set(currentTitles);
        const newOnes = generateTitles(missing, avoid);
        if (newOnes.length > 0) {
          const insertRows = newOnes.map((numero) => ({ compra_id: compra.id, numero }));
          const { error: insertMissingError } = await supabaseAdmin
            .from('bilhetes')
            .insert(insertRows);
          if (insertMissingError) {
            console.error('Erro ao inserir bilhetes faltantes (webhook):', insertMissingError);
            throw new Error('Erro ao completar seus bilhetes.');
          }
          titles = [...currentTitles, ...newOnes];
          updated = true;
        } else {
          titles = currentTitles;
        }
      } else {
        titles = currentTitles;
      }
    }
  }

  const transactionIdUsed = (compra as unknown as { transaction_id?: string }).transaction_id;
  return { titles, updated, status: skalePayStatus, raw: payload, transactionIdUsed };
}

// ---- Giros: cálculo e concessão ----

function calculateSpinsFromQuantity(quantity: number): number {
  const ratio = Number(process.env.ROULETTE_SPINS_PER_TICKET || '0.1'); // padrão: 1 giro a cada 10 bilhetes
  const minPerPurchase = Number(process.env.ROULETTE_MIN_SPINS_PER_PURCHASE || '0'); // padrão: pode ser 0
  const computed = Math.floor(quantity * ratio);
  return Math.max(minPerPurchase, computed);
}

async function grantSpinsToCliente(clienteId: string, spinsToGrant: number): Promise<void> {
  if (!spinsToGrant || spinsToGrant <= 0) return;
  // Upsert saldo em cliente_spins
  const { data: existing, error: selErr } = await supabaseAdmin
    .from('cliente_spins')
    .select('balance')
    .eq('cliente_id', clienteId)
    .single();
  if (selErr && selErr.code !== 'PGRST116') {
    throw new Error('db_error');
  }
  const nextBalance = (existing?.balance ?? 0) + spinsToGrant;
  if (existing) {
    const { error: updErr } = await supabaseAdmin
      .from('cliente_spins')
      .update({ balance: nextBalance, updated_at: new Date().toISOString() })
      .eq('cliente_id', clienteId);
    if (updErr) throw new Error('update_error');
  } else {
    const { error: insErr } = await supabaseAdmin
      .from('cliente_spins')
      .insert({ cliente_id: clienteId, balance: nextBalance, updated_at: new Date().toISOString() });
    if (insErr) throw new Error('insert_error');
  }
}

// ---- Envio de Email de Confirmação ----

import { getCampaignSettings } from '@/lib/campaign';

async function sendConfirmationEmail(
  compraId: string,
  clienteId: string,
  quantidadeCotas: number,
  valorTotal: number,
  bilhetes: string[]
): Promise<void> {
  // Buscar dados do cliente e verificar se já foi enviado
  const { data: compraData } = await supabaseAdmin
    .from('compras')
    .select('confirmation_email_sent_at, cliente_id, tracking_parameters')
    .eq('id', compraId)
    .single();

  if (compraData?.confirmation_email_sent_at) {
    console.log('[EMAIL] Confirmação já enviada anteriormente para esta compra, pulando.');
    return;
  }

  const { data: cliente } = await supabaseAdmin
    .from('clientes')
    .select('nome, email')
    .eq('id', clienteId)
    .single();

  if (!cliente?.email) {
    console.warn('[EMAIL] Cliente sem email, pulando confirmação.');
    return;
  }

  // Buscar nome da campanha (fallback)
  const campaign = await getCampaignSettings();
  const tracking = compraData?.tracking_parameters as Record<string, any> | null;
  const campaign_title = tracking?.campaign_title || campaign.title;

  // URL base do site
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  if (!siteUrl) console.warn('[EMAIL] NEXT_PUBLIC_SITE_URL não configurada. Links no email podem não funcionar.');

  const html = buildPurchaseConfirmationHtml({
    nomeCliente: cliente.nome || 'Cliente',
    quantidadeCotas,
    valorTotal,
    bilhetes,
    dataCompra: new Date().toISOString(),
    tituloCampanha: campaign_title,
    siteUrl,
  });

  const result = await sendEmail({
    to: cliente.email,
    subject: `✅ Compra confirmada — ${quantidadeCotas} cotas`,
    html,
  });

  if (result.success) {
    // Marcar email de confirmação como enviado
    await supabaseAdmin
      .from('compras')
      .update({ confirmation_email_sent_at: new Date().toISOString() })
      .eq('id', compraId);
    console.log('[EMAIL] Email de confirmação enviado:', result.id);
  } else {
    console.error('[EMAIL] Falha ao enviar confirmação:', result.error);
  }
}
