import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getClientIdFromRequest } from '@/lib/clientAuth';
import { limparCpf } from '@/utils/formatters';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // Primeiro tenta sessão; se não houver, aceita cpf no body para consulta pontual
    let clienteId: string | null = getClientIdFromRequest(request);
    if (!clienteId) {
      try {
        const body = await request.json();
        const rawCpf = (body?.cpf ?? '').toString();
        const cpf = limparCpf(rawCpf);
        if (!cpf) return NextResponse.json({ success: false, message: 'unauthorized' }, { status: 401 });
        const { data: cliente, error: clienteError } = await supabaseAdmin
          .from('clientes')
          .select('id')
          .eq('cpf', cpf)
          .single();
        if (clienteError || !cliente) return NextResponse.json({ success: false, message: 'cliente_not_found' }, { status: 404 });
        clienteId = String(cliente.id);
      } catch {
        return NextResponse.json({ success: false, message: 'unauthorized' }, { status: 401 });
      }
    }

    const { data: spin, error: spinErr } = await supabaseAdmin
      .from('cliente_spins')
      .select('balance')
      .eq('cliente_id', clienteId)
      .single();
    if (spinErr && spinErr.code !== 'PGRST116') {
      return NextResponse.json({ success: false, message: 'db_error' }, { status: 500 });
    }
    const balance = (spin?.balance ?? 0) as number;
    return NextResponse.json({ success: true, balance });
  } catch {
    return NextResponse.json({ success: false, message: 'error' }, { status: 500 });
  }
}


