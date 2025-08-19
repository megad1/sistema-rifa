import { NextResponse } from 'next/server';
import { getClientIdFromRequest } from '@/lib/clientAuth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const cid = getClientIdFromRequest(request);
    if (!cid) return NextResponse.json({ active: false });
    const { data: cliente, error } = await supabaseAdmin
      .from('clientes')
      .select('id, nome, email, cpf')
      .eq('id', cid)
      .single();
    if (error || !cliente) return NextResponse.json({ active: false });
    return NextResponse.json({ active: true, cliente: { id: cliente.id, nome: cliente.nome, email: cliente.email } });
  } catch {
    return NextResponse.json({ active: false });
  }
}


