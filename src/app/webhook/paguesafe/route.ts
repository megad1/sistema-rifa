import { NextResponse } from 'next/server';
import { processPaymentFromWebhookPayload } from '@/services/payments';
import { getUtmifySettings, postUtmifyOrder, toUtcSqlDate } from '@/lib/utmify';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

function isAuthorizedBasic(authHeader: string | null): boolean {
  if (!authHeader) return false;
  const [scheme, value] = authHeader.split(' ');
  if (scheme !== 'Basic' || !value) return false;
  const expected = Buffer.from(`${process.env.SKALEPLAY_SECRET_KEY}:x`).toString('base64');
  return value === expected;
}

// Placeholder para validação de assinatura/HMAC caso a SkalePay envie
async function validateSignature(req: Request): Promise<boolean> {
  const requireSig = process.env.WEBHOOK_REQUIRE_SIGNATURE === 'true';
  if (!requireSig) return true;
  // Quando a SkalePay documentar o formato de assinatura, validar cabeçalhos aqui
  return false;
}

export async function POST(request: Request) {
  try {
    const requireAuth = process.env.WEBHOOK_REQUIRE_AUTH !== 'false';
    const expectedToken = process.env.WEBHOOK_TOKEN || '';

    // Logging opcional do webhook
    if (process.env.LOG_WEBHOOKS === 'true') {
      try {
        const raw = await request.clone().text();
        const headers: Record<string, string> = {};
        request.headers.forEach((v, k) => {
          const lower = k.toLowerCase();
          if (lower === 'authorization' || lower === 'x-webhook-token') {
            headers[k] = '[redacted]';
          } else {
            headers[k] = v;
          }
        });
        console.log('[WEBHOOK] headers:', headers);
        console.log('[WEBHOOK] body:', raw?.slice(0, 2000));
      } catch (e) {
        console.warn('[WEBHOOK] falha ao logar payload:', e);
      }
    }

    // 1) Autorização básica
    const authHeader = request.headers.get('authorization');
    if (requireAuth && !isAuthorizedBasic(authHeader)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // 1.1) Token obrigatório (se configurado)
    if (expectedToken) {
      const url = new URL(request.url);
      const qsToken = url.searchParams.get('t');
      const headerToken = request.headers.get('x-webhook-token');
      const providedToken = headerToken ?? qsToken ?? '';
      if (providedToken !== expectedToken) {
        return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
      }
    }

    // 2) (Opcional) assinatura/HMAC
    const signatureOk = await validateSignature(request);
    if (!signatureOk) {
      return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 401 });
    }

    // 3) Corpo do postback
    const body = await request.json();
    // Preferir processamento direto do payload (usa status e secureId/id do corpo)
    const result = await processPaymentFromWebhookPayload(body);

    // Utmify: quando pago
    const utm = await getUtmifySettings();
    if (utm.enabled && result.status === 'paid') {
      try {
        const customer = body?.data?.customer;
        const amountInCents = body?.data?.paidAmount ?? body?.data?.amount;
        const quantity = body?.data?.items?.[0]?.quantity ?? 1;
        const totalValue = typeof amountInCents === 'number' ? amountInCents / 100 : 0;
        const paidAt = body?.data?.paidAt ? new Date(body.data.paidAt) : new Date();
        // Recupera tracking salvo na compra
        let tracking: Record<string, string | null> | undefined = undefined;
        try {
          const { data: compraData } = await supabaseAdmin
            .from('compras')
            .select('tracking_parameters')
            .eq('transaction_id', String(body?.data?.id ?? body?.id ?? result.transactionIdUsed ?? ''))
            .single();
          tracking = (compraData as unknown as { tracking_parameters?: Record<string, string | null> })?.tracking_parameters || undefined;
        } catch {}
        await postUtmifyOrder({
          orderId: String(body?.data?.id ?? body?.id ?? result.transactionIdUsed ?? ''),
          status: 'paid',
          createdAt: toUtcSqlDate(new Date()),
          approvedDate: toUtcSqlDate(paidAt),
          ip: undefined,
          customer: { name: customer?.name ?? '', email: customer?.email ?? '', document: customer?.document?.number ?? '' },
          quantity,
          totalValue,
        }, tracking);
      } catch (e) { console.error('[UTMIFY] paid error', e); }
    }

    return NextResponse.json({ success: true, status: result.status, titles: result.titles });
  } catch (error) {
    console.error('Erro no webhook PagueSafe/SkalePay:', error);
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}


