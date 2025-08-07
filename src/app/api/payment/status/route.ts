// src/app/api/payment/status/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

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

async function getSkalePayTransactionStatus(transactionId: string) {
    const secretKey = process.env.SKALEPLAY_SECRET_KEY;
    if (!secretKey) {
        throw new Error('Chave da API não configurada.');
    }

    const authString = btoa(`${secretKey}:x`);
    const cacheBuster = `_=${new Date().getTime()}`;
    const apiUrl = `https://api.conta.skalepay.com.br/v1/transactions/${transactionId}?${cacheBuster}`;

    const response = await fetch(apiUrl, {
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
        throw new Error('Erro ao consultar o status da transação na SkalePay.');
    }

    return await response.json();
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id: transactionId } = body;

        if (!transactionId) {
            return NextResponse.json({ success: false, message: 'ID da transação não fornecido.' }, { status: 400 });
        }

        // 1. Obter o status da transação na SkalePay
        const skalePayData = await getSkalePayTransactionStatus(transactionId);
        const skalePayStatus = skalePayData.status;

        // 2. Obter a compra correspondente no nosso banco de dados
        const { data: compra, error: compraError } = await supabaseAdmin
            .from('compras')
            .select('*')
            .eq('transaction_id', transactionId)
            .single();

        if (compraError || !compra) {
            console.error("Compra não encontrada no banco de dados:", compraError);
            return NextResponse.json({ success: false, message: 'Compra não encontrada no sistema.' }, { status: 404 });
        }

        let titles: string[] = [];

        // 3. Lógica de Pagamento Aprovado
        if (skalePayStatus === 'paid') {
            // Se o pagamento foi confirmado AGORA (nosso status ainda era pendente)
            if (compra.status === 'pending') {
                const newTitles = generateTitles(compra.quantidade_bilhetes);
                
                // Atualiza a compra para 'paid' e salva a data do pagamento
                const { error: updateError } = await supabaseAdmin
                    .from('compras')
                    .update({ status: 'paid', paid_at: new Date().toISOString() })
                    .eq('id', compra.id);

                if (updateError) {
                    console.error("Erro ao atualizar status da compra:", updateError);
                    throw new Error("Erro ao atualizar o status do pagamento.");
                }

                // Salva os bilhetes gerados no banco
                const bilhetesParaInserir = newTitles.map(numero => ({
                    compra_id: compra.id,
                    numero: numero
                }));

                const { error: bilhetesError } = await supabaseAdmin
                    .from('bilhetes')
                    .insert(bilhetesParaInserir);

                if (bilhetesError) {
                    console.error("Erro ao salvar os bilhetes:", bilhetesError);
                    // Aqui, a compra foi marcada como paga mas os bilhetes não foram salvos.
                    // Isso requer atenção manual ou uma rotina de correção.
                    throw new Error("Pagamento confirmado, mas houve um erro ao gerar seus bilhetes.");
                }
                
                titles = newTitles;

            } else { // Se o pagamento já estava 'paid' no nosso banco
                const { data: existingTitles, error: existingTitlesError } = await supabaseAdmin
                    .from('bilhetes')
                    .select('numero')
                    .eq('compra_id', compra.id);

                if (existingTitlesError) {
                    throw new Error("Erro ao buscar seus bilhetes já existentes.");
                }
                titles = existingTitles.map(t => t.numero);
            }
        }
        
        return NextResponse.json({ 
            success: true, 
            status: skalePayStatus, 
            data: skalePayData, // Mantém a resposta original da SkalePay para consistência no frontend
            titles 
        });

    } catch (error) {
        console.error('Erro interno ao verificar status do pagamento:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro interno no servidor.';
        return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
    }
}