import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Impede o cache da rota

const SKALEPAY_API_URL = 'https://api.conta.skalepay.com.br/v1';

/**
 * Endpoint para verificar o status de uma transação na SkalePay.
 * Recebe o ID da transação via query param.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('id');

    if (!transactionId) {
      return new NextResponse(JSON.stringify({ success: false, message: 'ID da transação não fornecido.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const secretKey = process.env.SKALEPLAY_SECRET_KEY;
    if (!secretKey) {
      throw new Error('Chave secreta da API não configurada.');
    }

    const authString = `${secretKey}:x`;
    const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;

    // A adição de { cache: 'no-store' } aqui é a correção crucial.
    // Isso força o servidor da Vercel a não usar o cache para esta chamada fetch específica.
    const response = await fetch(`${SKALEPAY_API_URL}/transactions/${transactionId}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
      },
      cache: 'no-store' 
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Erro ao consultar a API da SkalePay: HTTP ${response.status} - ${errorBody}`);
    }

    const result = await response.json();
    const titles: string[] = [];

    // Se o pagamento foi confirmado, geramos os títulos.
    if (result.status === 'paid' && result.items && result.items.length > 0) {
      const quantity = result.items[0].quantity || 0;
      for (let i = 0; i < quantity; i++) {
        // Gera um número aleatório de 6 dígitos
        const title = Math.floor(100000 + Math.random() * 900000).toString();
        titles.push(title);
      }
    }

    // Retornamos o status e os títulos (se houver) para o frontend
    return NextResponse.json({
      success: true,
      status: result.status, // Ex: 'paid', 'pending', 'expired'
      data: result,
      titles: titles,
    });

  } catch (error) {
    console.error("Erro ao verificar status do pagamento:", error);
    let errorMessage = "Ocorreu um erro desconhecido.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return new NextResponse(JSON.stringify({ success: false, message: errorMessage }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
    });
  }
}
