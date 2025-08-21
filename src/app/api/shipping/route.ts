import { NextResponse } from 'next/server';
import { limparCpf, limparTelefone } from '@/utils/formatters';
import { FREIGHT_OPTIONS_BR } from '@/config/payments';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

type ShippingBody = {
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  freightOptionId: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ShippingBody;

    const nome = (body?.nome || '').toString().trim();
    const email = (body?.email || '').toString().trim();
    const cpf = limparCpf((body?.cpf || '').toString());
    const telefone = limparTelefone((body?.telefone || '').toString());
    const cep = (body?.cep || '').toString().replace(/\D/g, '');
    const endereco = (body?.endereco || '').toString().trim();
    const numero = (body?.numero || '').toString().trim();
    const complemento = (body?.complemento || '').toString().trim();
    const bairro = (body?.bairro || '').toString().trim();
    const cidade = (body?.cidade || '').toString().trim();
    const estado = (body?.estado || '').toString().trim().toUpperCase();
    const freightOptionId = (body?.freightOptionId || '').toString();

    if (!nome || !email || !cpf || cpf.length !== 11 || !telefone || !cep || !endereco || !numero || !bairro || !cidade || !estado || !freightOptionId) {
      return NextResponse.json({ success: false, message: 'Dados obrigatórios ausentes.' }, { status: 400 });
    }

    const freight = FREIGHT_OPTIONS_BR.find(f => f.id === freightOptionId);
    if (!freight) {
      return NextResponse.json({ success: false, message: 'Opção de frete inválida.' }, { status: 400 });
    }

    const secretKey = process.env.SKALEPAY_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ success: false, message: 'SKALEPAY_SECRET_KEY ausente.' }, { status: 500 });
    }
    const apiUrl = 'https://api.conta.skalepay.com.br/v1';
    const authHeader = `Basic ${Buffer.from(`${secretKey}:x`).toString('base64')}`;

    const valorCentavos = Math.round(freight.amount * 100);

    const payload = {
      amount: valorCentavos,
      paymentMethod: 'pix',
      customer: {
        name: nome,
        email,
        document: { type: 'cpf', number: cpf },
        phone: telefone,
        ip: request.headers.get('x-forwarded-for') ?? '127.0.0.1',
      },
      items: [
        {
          id: 'FRETE_PREMIO',
          title: `Frete prêmio – iPhones (${freight.label})`,
          quantity: 1,
          unitPrice: valorCentavos,
          tangible: true,
        },
      ],
      // Nota: alguns gateways aceitam metadata; mantemos somente campos essenciais para compatibilidade
    } as const;

    const response = await fetch(`${apiUrl}/transactions`, {
      method: 'POST',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return NextResponse.json({ success: false, message: `Erro no pagamento: HTTP ${response.status} - ${errorBody}` }, { status: 502 });
    }

    const result = await response.json();
    if (!result?.id || !result?.pix?.qrcode) {
      return NextResponse.json({ success: false, message: 'Resposta de pagamento inválida.' }, { status: 502 });
    }

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(result.pix.qrcode)}&size=300x300`;

    return NextResponse.json({
      success: true,
      token: result.id,
      pixCopiaECola: result.pix.qrcode,
      qrCodeUrl,
      valor: freight.amount,
      freight: { id: freight.id, label: freight.label },
      address: { cep, endereco, numero, complemento, bairro, cidade, estado },
    });
  } catch {
    return NextResponse.json({ success: false, message: 'Erro interno.' }, { status: 500 });
  }
}


