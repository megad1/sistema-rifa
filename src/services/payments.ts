import { supabaseAdmin } from '@/lib/supabase';

export interface ProcessPaymentResult {
  titles: string[];
  updated: boolean;
  status: string;
  raw?: unknown;
}

export interface SkalePayTransactionStatus {
  id: string;
  status: string;
  [key: string]: unknown;
}

export async function getSkalePayTransactionStatus(transactionId: string): Promise<SkalePayTransactionStatus> {
  const secretKey = process.env.SKALEPLAY_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Chave da API não configurada.');
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
    status: 'pending' | 'paid' | string;
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

  return { titles, updated, status: skalePayStatus, raw: payload };
}


