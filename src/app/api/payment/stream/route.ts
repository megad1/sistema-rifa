import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

function sseFormat(data: unknown, event?: string) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  return event ? `event: ${event}\n${payload}` : payload;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const transactionId = searchParams.get('id');
  if (!transactionId) {
    return NextResponse.json({ success: false, message: 'Missing id' }, { status: 400 });
  }

  let isClosed = false;
  const heartbeatMs = 15000;
  const checkMs = 3000;
  const timeoutMs = 10 * 60 * 1000; // 10 minutos
  const startAt = Date.now();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (data: string) => controller.enqueue(encoder.encode(data));

      // headers iniciais / boas-vindas
      send(sseFormat({ success: true, status: 'connected' }, 'open'));

      // Heartbeat
      const hb = setInterval(() => {
        if (isClosed) return;
        send(`: ping\n\n`);
      }, heartbeatMs);

      // Loop de checagem no banco
      const check = setInterval(async () => {
        if (isClosed) return;
        try {
          const { data: compra, error } = await supabaseAdmin
            .from('compras')
            .select('id, status, paid_at, quantidade_bilhetes')
            .eq('transaction_id', transactionId)
            .single();

          if (error) {
            // Envia um aviso mas não fecha
            send(sseFormat({ success: false, message: 'not found yet' }, 'info'));
            return;
          }

          if (compra.status === 'paid') {
            // Busca títulos
            const { data: bilhetes } = await supabaseAdmin
              .from('bilhetes')
              .select('numero')
              .eq('compra_id', compra.id);

            const titles = (bilhetes || []).map((b: { numero: string }) => b.numero);
            const payload = {
              success: true,
              status: 'paid',
              titles,
              paidAt: compra.paid_at ?? null,
            };
            send(sseFormat(payload, 'paid'));
            clearInterval(check);
            clearInterval(hb);
            isClosed = true;
            controller.close();
          } else {
            // Status ainda pendente
            send(sseFormat({ success: true, status: compra.status }, 'status'));
          }
        } catch {
          send(sseFormat({ success: false, message: 'internal error' }, 'error'));
        }

        if (Date.now() - startAt > timeoutMs) {
          send(sseFormat({ success: false, message: 'timeout' }, 'timeout'));
          clearInterval(check);
          clearInterval(hb);
          isClosed = true;
          controller.close();
        }
      }, checkMs);

      // Abort se cliente desconectar
      const abort = () => {
        clearInterval(check);
        clearInterval(hb);
        if (!isClosed) {
          isClosed = true;
          controller.close();
        }
      };
      request.signal?.addEventListener('abort', abort);
    },
    cancel() {
      isClosed = true;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}


