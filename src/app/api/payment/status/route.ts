// src/app/api/payment/status/route.ts
import { NextResponse } from 'next/server';

// Forçar a rota a ser sempre dinâmica e nunca cacheada.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Gera números da sorte (títulos) únicos com 6 dígitos.
 */
function generateTitles(quantity: number): string[] {
    const titles = new Set<string>();
    while (titles.size < quantity) {
        const title = Math.floor(100000 + Math.random() * 900000).toString();
        titles.add(title);
    }
    return Array.from(titles);
}

// Interface para o item da transação SkalePay para evitar o uso de 'any'.
interface SkalePayItem {
    quantity: number;
    // outras propriedades podem ser adicionadas aqui se necessário.
}

// Alterado para POST para evitar o cache agressivo da Vercel em rotas GET.
export async function POST(request: Request) {
    const secretKey = process.env.SKALEPLAY_SECRET_KEY;
    if (!secretKey) {
        return NextResponse.json({ success: false, message: 'Chave da API não configurada.' }, { status: 500 });
    }

    let transactionId: string | null = null;
    try {
        const body = await request.json();
        transactionId = body.id;

        if (!transactionId) {
            return NextResponse.json({ success: false, message: 'ID da transação não fornecido.' }, { status: 400 });
        }
    } catch (_error) { // FIX: Renamed 'error' to '_error' as it is not used.
        return NextResponse.json({ success: false, message: 'Corpo da requisição inválido.' }, { status: 400 });
    }


    try {
        const authString = Buffer.from(`${secretKey}:`).toString('base64');

        const response = await fetch(`https://api.skalepay.com/transactions/${transactionId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${authString}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });
        
        if (!response.ok) {
            const errorData = await response.text();
            console.error("Erro da API SkalePay:", errorData);
            return NextResponse.json({ success: false, message: 'Erro ao consultar o status da transação na SkalePay.' }, { status: response.status });
        }
        
        const data = await response.json();
        let titles: string[] = [];

        if (data.status === 'paid') {
            // FIX: Defined a specific type for the 'item' instead of 'any'.
            const quantity = data.items.reduce((acc: number, item: SkalePayItem) => acc + item.quantity, 0);
            titles = generateTitles(quantity > 0 ? quantity : 1);
        }

        return NextResponse.json({ success: true, status: data.status, data, titles });

    } catch (error) {
        console.error('Erro interno ao verificar status do pagamento:', error);
        return NextResponse.json({ success: false, message: 'Erro interno no servidor.' }, { status: 500 });
    }
}
