import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSkalePayTransactionStatus } from '@/services/payments';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = (body?.id || '').toString();
    if (!id) return NextResponse.json({ success: false, message: 'ID da transação não fornecido.' }, { status: 400 });
    const res = await getSkalePayTransactionStatus(id);
    const status = (res?.status || '').toString().toLowerCase();
    return NextResponse.json({ success: true, status });
  } catch {
    return NextResponse.json({ success: false, message: 'error' }, { status: 500 });
  }
}


