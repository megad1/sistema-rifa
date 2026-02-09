// src/app/api/payment/status/route.ts
import { NextResponse } from 'next/server';
import { processPaymentConfirmation } from '@/services/payments';
import { getFacebookSettings } from '@/lib/facebook';
import { getUtmifySettings, postUtmifyOrder, toUtcSqlDate } from '@/lib/utmify';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id: transactionId } = body;

    if (!transactionId) {
      return NextResponse.json({ success: false, message: 'ID da transação não fornecido.' }, { status: 400 });
    }
    const result = await processPaymentConfirmation(transactionId);
    const fb = await getFacebookSettings();

    // Utmify (paid via polling)
    try {
      const utm = await getUtmifySettings();
      if (utm.enabled && result.status === 'paid') {
        // Busca compra + tracking + cliente
        const { data: compra } = await supabaseAdmin
          .from('compras')
          .select('id, tracking_parameters, quantidade_bilhetes, valor_total, cliente_id, paid_at, transaction_id')
          .eq('transaction_id', transactionId)
          .single();
        if (compra) {
          const { data: cliente } = await supabaseAdmin
            .from('clientes')
            .select('nome, email, cpf')
            .eq('id', compra.cliente_id)
            .single();
          await postUtmifyOrder({
            orderId: compra.transaction_id,
            status: 'paid',
            createdAt: toUtcSqlDate(new Date()),
            approvedDate: toUtcSqlDate(compra.paid_at ? new Date(compra.paid_at) : new Date()),
            ip: undefined,
            customer: { name: cliente?.nome || '', email: cliente?.email || '', document: cliente?.cpf || '' },
            quantity: compra.quantidade_bilhetes,
            totalValue: compra.valor_total,
          }, (compra as unknown as { tracking_parameters?: Record<string, string | null> }).tracking_parameters || undefined);
        }
      }
    } catch (e) { console.error('[UTMIFY][status] error', e); }

    return NextResponse.json({ success: true, status: result.status, data: result.raw, titles: result.titles, fb: { enabled: fb.enabled, sendPurchase: fb.sendPurchase, pixelId: fb.pixelId } });

  } catch (error) {
    console.error('Erro interno ao verificar status do pagamento:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno no servidor.';
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}