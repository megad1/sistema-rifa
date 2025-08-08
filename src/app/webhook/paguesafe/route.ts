import { NextResponse } from 'next/server';
import { processPaymentFromWebhookPayload } from '@/services/payments';

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
  // Ex.: cabeçalhos de assinatura (quando houver formato definido)
  if (req.headers.get('x-skalepay-signature') || req.headers.get('x-signature')) {
    // TODO: Validar com crypto/HMAC quando a SkalePay documentar o formato
  }
  return true;
}

export async function POST(request: Request) {
  try {
    const requireAuth = process.env.WEBHOOK_REQUIRE_AUTH !== 'false';

    // Logging opcional do webhook
    if (process.env.LOG_WEBHOOKS === 'true') {
      try {
        const raw = await request.clone().text();
        const headers: Record<string, string> = {};
        request.headers.forEach((v, k) => {
          headers[k] = k.toLowerCase() === 'authorization' ? '[redacted]' : v;
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

    // 2) (Opcional) assinatura/HMAC
    const signatureOk = await validateSignature(request);
    if (!signatureOk) {
      return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 401 });
    }

    // 3) Corpo do postback
    const body = await request.json();
    // Preferir processamento direto do payload (usa status e secureId/id do corpo)
    const result = await processPaymentFromWebhookPayload(body);

    return NextResponse.json({ success: true, status: result.status, titles: result.titles });
  } catch (error) {
    console.error('Erro no webhook PagueSafe/SkalePay:', error);
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}


