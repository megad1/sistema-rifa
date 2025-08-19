import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getClientIdFromRequest } from '@/lib/clientAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

type SpinResponse = {
  success: true;
  idx: number;
  label: string;
  stopAngle: number;
};

// Mesmo mapeamento utilizado no componente WinwheelRoulette
const SEGMENT_LABELS = [
  '8 MIL REAIS',
  'TENTE OUTRA VEZ',
  '15 MIL REAIS',
  'CARRO 0KM',
  'TENTE OUTRA VEZ',
  '2 iPhone 16 Pro Max',
] as const;

const SIZES_DEG = [60, 60, 60, 60, 60, 60];
const BASE_START_DEG = 330; // primeiro segmento inicia em 330°

export async function POST(request: Request) {
  try {
    // Identificação do jogador via sessão (cookie) ou fallback para CPF no body
    let clienteId: string | null = getClientIdFromRequest(request);
    if (!clienteId) {
      try {
        const body = await request.json();
        const cpf = (body?.cpf ?? '').toString();
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

    // Tenta decrementar 1 giro do saldo (tabela cliente_spins)
    // Estratégia: ler saldo atual e atualizar com checagem de >0
    const { data: current, error: curErr } = await supabaseAdmin
      .from('cliente_spins')
      .select('balance')
      .eq('cliente_id', clienteId)
      .single();
    if (curErr && curErr.code !== 'PGRST116') {
      return NextResponse.json({ success: false, message: 'balance_error' }, { status: 500 });
    }
    const balance = (current?.balance ?? 0) as number;
    if (balance <= 0) {
      return NextResponse.json({ success: false, message: 'no_spins' }, { status: 403 });
    }
    const { error: updErr } = await supabaseAdmin
      .from('cliente_spins')
      .update({ balance: balance - 1, updated_at: new Date().toISOString() })
      .eq('cliente_id', clienteId);
    if (updErr) {
      return NextResponse.json({ success: false, message: 'decrement_error' }, { status: 500 });
    }

    // Força cair em "TENTE OUTRA VEZ" (índices 1 ou 4), escolhendo aleatoriamente entre os dois
    const candidates = [1, 4];
    const idx = candidates[Math.floor(Math.random() * candidates.length)];

    // Calcula o início do segmento escolhido
    let start = BASE_START_DEG;
    for (let i = 0; i < idx; i += 1) start = (start + SIZES_DEG[i]) % 360;

    // Escolhe um ângulo interno ao segmento, evitando as bordas (margem ~15% e mínimo 5°)
    const size = SIZES_DEG[idx];
    const margin = Math.min(size / 2 - 1, Math.max(5, size * 0.15));
    const angleWithin = margin + Math.random() * (size - 2 * margin);
    const stopAngle = (start + angleWithin) % 360;

    const body: SpinResponse = {
      success: true,
      idx,
      label: SEGMENT_LABELS[idx],
      stopAngle,
    };
    return NextResponse.json(body);
  } catch {
    return NextResponse.json({ success: false, message: 'spin_error' }, { status: 500 });
  }
}


