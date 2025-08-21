import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSkalePayTransactionStatus } from '@/services/payments';
import { supabaseAdmin } from '@/lib/supabase';
import { getUtmifySettings, postUtmifyOrder, toUtcSqlDate } from '@/lib/utmify';

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
    if (status === 'paid') {
      // marcar compra como paga (se ainda não)
      const { data: compra } = await supabaseAdmin
        .from('compras')
        .select('id, status, cliente_id, valor_total, paid_at, tracking_parameters')
        .eq('transaction_id', id)
        .single();
      if (compra && compra.status !== 'paid') {
        await supabaseAdmin.from('compras').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', compra.id);
        try {
          const utm = await getUtmifySettings();
          if (utm.enabled) {
            const { data: cliente } = await supabaseAdmin
              .from('clientes')
              .select('nome, email, cpf')
              .eq('id', compra.cliente_id)
              .single();
            await postUtmifyOrder({
              orderId: id,
              status: 'paid',
              createdAt: toUtcSqlDate(new Date()),
              approvedDate: toUtcSqlDate(new Date()),
              ip: undefined,
              customer: { name: cliente?.nome || '', email: cliente?.email || '', document: cliente?.cpf || '' },
              quantity: 1,
              totalValue: compra.valor_total,
            }, (compra as unknown as { tracking_parameters?: Record<string, string | null> }).tracking_parameters || undefined);
          }
        } catch {}
      }
    }
    return NextResponse.json({ success: true, status });
  } catch {
    return NextResponse.json({ success: false, message: 'error' }, { status: 500 });
  }
}


