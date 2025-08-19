import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminRequest } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status'); // optional: pending|paid
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') || '20', 10)));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
      .from('compras')
      .select('id, transaction_id, quantidade_bilhetes, valor_total, status, paid_at, created_at, cliente_id, clientes:cliente_id (nome, email, cpf)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status === 'pending' || status === 'paid') {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, items: data || [], total: count ?? 0, page, pageSize });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}


