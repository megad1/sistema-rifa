import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getClientIdFromRequest, parseCookie } from '@/lib/clientAuth';

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
  '2 iphones 16 pro max',
] as const;

const SIZES_DEG = [60, 60, 60, 60, 60, 60];
const BASE_START_DEG = 330; // primeiro segmento inicia em 330°

// Estado de tentativa/vitória controlado por cookie HttpOnly
const STATE_COOKIE_NAME = 'roulette_state';
const PRIZE_INDEX_IPHONES = 5; // '2 iPhone 16 Pro Max'

type RouletteState = { spinsTried: number; hasWon: boolean };

function readRouletteState(request: Request): RouletteState {
  try {
    const jar = parseCookie(request.headers.get('cookie'));
    const raw = jar[STATE_COOKIE_NAME];
    if (!raw) return { spinsTried: 0, hasWon: false };
    const parsed = JSON.parse(decodeURIComponent(raw));
    const spinsTried = Number(parsed?.spinsTried ?? 0);
    const hasWon = Boolean(parsed?.hasWon);
    if (!Number.isFinite(spinsTried) || spinsTried < 0) return { spinsTried: 0, hasWon: false };
    return { spinsTried, hasWon };
  } catch {
    return { spinsTried: 0, hasWon: false };
  }
}

function buildRouletteStateCookie(state: RouletteState): string {
  const payload = encodeURIComponent(JSON.stringify({ spinsTried: state.spinsTried, hasWon: state.hasWon }));
  const attrs = [
    `${STATE_COOKIE_NAME}=${payload}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (process.env.NODE_ENV !== 'development') attrs.push('Secure');
  // guarda por ~180 dias
  attrs.push(`Max-Age=${60 * 60 * 24 * 180}`);
  return attrs.join('; ');
}

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

    // Lê/atualiza estado de tentativas via cookie para forçar vitória no 2º giro e nunca mais
    const prev = readRouletteState(request);
    const nextSpinsTried = prev.spinsTried + 1;
    const isWinningSpin = !prev.hasWon && nextSpinsTried === 2;

    // Define o índice do resultado
    const idx = isWinningSpin ? PRIZE_INDEX_IPHONES : ([1, 4][Math.floor(Math.random() * 2)]);

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
    // Prepara resposta e atualiza cookie de estado
    const res = NextResponse.json(body);
    const cookie = buildRouletteStateCookie({ spinsTried: nextSpinsTried, hasWon: prev.hasWon || isWinningSpin });
    res.headers.append('Set-Cookie', cookie);
    return res;
  } catch {
    return NextResponse.json({ success: false, message: 'spin_error' }, { status: 500 });
  }
}


