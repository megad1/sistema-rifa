import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

// Concede giros para um CPF (usa no pós-pagamento). Idempotente: soma ao saldo existente.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const cpf = (body?.cpf ?? '').toString();
    const spins = Number(body?.spins ?? 0);
    if (!cpf || !Number.isFinite(spins) || spins <= 0) {
      return NextResponse.json({ success: false, message: 'cpf_and_spins_required' }, { status: 400 });
    }

    const { data: cliente, error: clienteError } = await supabaseAdmin
      .from('clientes')
      .select('id')
      .eq('cpf', cpf)
      .single();
    if (clienteError || !cliente) {
      return NextResponse.json({ success: false, message: 'cliente_not_found' }, { status: 404 });
    }

    // Upsert em cliente_spins
    const { data: existing, error: selErr } = await supabaseAdmin
      .from('cliente_spins')
      .select('balance')
      .eq('cliente_id', cliente.id)
      .single();
    if (selErr && selErr.code !== 'PGRST116') {
      return NextResponse.json({ success: false, message: 'db_error' }, { status: 500 });
    }

    const nextBalance = (existing?.balance ?? 0) + spins;
    if (existing) {
      const { error: updErr } = await supabaseAdmin
        .from('cliente_spins')
        .update({ balance: nextBalance, updated_at: new Date().toISOString() })
        .eq('cliente_id', cliente.id);
      if (updErr) return NextResponse.json({ success: false, message: 'update_error' }, { status: 500 });
    } else {
      const { error: insErr } = await supabaseAdmin
        .from('cliente_spins')
        .insert({ cliente_id: cliente.id, balance: nextBalance, updated_at: new Date().toISOString() });
      if (insErr) return NextResponse.json({ success: false, message: 'insert_error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, balance: nextBalance });
  } catch {
    return NextResponse.json({ success: false, message: 'error' }, { status: 500 });
  }
}


