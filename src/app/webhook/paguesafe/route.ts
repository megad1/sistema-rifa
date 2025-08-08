import { NextResponse } from 'next/server';
import { processPaymentConfirmation } from '@/services/payments';

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
  // Ex.: cabeçalhos de assinatura (não usados ainda, apenas para consumir o parâmetro)
  const _sig = req.headers.get('x-skalepay-signature') || req.headers.get('x-signature');
  // Validar com crypto/HMAC se houver (implementar quando soubermos o formato)
  return true;
}

export async function POST(request: Request) {
  try {
    // 1) Autorização básica
    const authHeader = request.headers.get('authorization');
    if (!isAuthorizedBasic(authHeader)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // 2) (Opcional) assinatura/HMAC
    const signatureOk = await validateSignature(request);
    if (!signatureOk) {
      return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 401 });
    }

    // 3) Corpo do postback
    const body = await request.json();
    // Esperado: body.id ou body.transactionId, ajustar conforme payload real
    const transactionId: string | undefined = body?.id || body?.transactionId;
    if (!transactionId) {
      return NextResponse.json({ success: false, message: 'Missing transaction id' }, { status: 400 });
    }

    // 4) Processar confirmação de pagamento (idempotente)
    const result = await processPaymentConfirmation(transactionId);

    return NextResponse.json({ success: true, status: result.status, titles: result.titles });
  } catch (error) {
    console.error('Erro no webhook PagueSafe/SkalePay:', error);
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}


