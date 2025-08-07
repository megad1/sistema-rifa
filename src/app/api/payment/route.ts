import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { limparTelefone, limparCpf } from '@/utils/formatters';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { valor, nome, email, cpf, telefone, quantity } = body;

        // --- Validação de Entrada ---
        if (!valor || valor <= 0 || !quantity || quantity <= 0) {
            throw new Error('Valor e quantidade são obrigatórios e devem ser maiores que zero.');
        }
        if (!nome || !email || !cpf || !telefone) {
            throw new Error('Todos os campos são obrigatórios: nome, email, cpf e telefone.');
        }

        const telefone_limpo = limparTelefone(telefone);
        const cpf_limpo = limparCpf(cpf);

        // --- Lógica de Cliente (Upsert) ---
        const { data: cliente, error: clienteError } = await supabaseAdmin
            .from('clientes')
            .upsert({
                nome: nome,
                email: email,
                cpf: cpf_limpo,
                telefone: telefone_limpo,
                updated_at: new Date().toISOString()
            }, { onConflict: 'cpf' }) // Usa CPF como chave de conflito para o upsert
            .select()
            .single();

        if (clienteError || !cliente) {
            console.error("Erro no upsert do cliente:", clienteError);
            throw new Error("Não foi possível salvar os dados do cliente.");
        }

        // --- Geração de Pagamento na SkalePay ---
        const valor_centavos = Math.round(valor * 100);
        const secretKey = process.env.SKALEPLAY_SECRET_KEY;
        if (!secretKey) {
            throw new Error('Chave secreta da API de pagamento não configurada.');
        }

        const apiUrl = 'https://api.conta.skalepay.com.br/v1';
        const authHeader = `Basic ${btoa(`${secretKey}:x`)}`;

        const payloadSkalePay = {
            "amount": valor_centavos,
            "paymentMethod": "pix",
            "customer": {
                "name": nome,
                "email": email,
                "document": { "type": "cpf", "number": cpf_limpo },
                "phone": telefone_limpo,
                "ip": request.headers.get('x-forwarded-for') ?? '127.0.0.1'
            },
            "items": [{
                "id": `PROD_${new Date().getTime()}`,
                "title": "Produto Padrao",
                "quantity": quantity,
                "unitPrice": Math.round(valor_centavos / quantity),
                "tangible": false
            }],
            "postbackUrl": `https://${request.headers.get('host')}/webhook/paguesafe`
        };

        const responseSkalePay = await fetch(`${apiUrl}/transactions`, {
            method: 'POST',
            headers: { 'Authorization': authHeader, 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payloadSkalePay)
        });

        if (!responseSkalePay.ok) {
            const errorBody = await responseSkalePay.text();
            throw new Error(`Erro na API de pagamento: HTTP ${responseSkalePay.status} - ${errorBody}`);
        }

        const resultSkalePay = await responseSkalePay.json();

        if (!resultSkalePay.id || !resultSkalePay.pix?.qrcode) {
            throw new Error("Resposta da API de pagamento inválida ou incompleta.");
        }

        // --- Registro da Compra no Banco de Dados ---
        const { error: compraError } = await supabaseAdmin
            .from('compras')
            .insert({
                cliente_id: cliente.id,
                transaction_id: resultSkalePay.id,
                quantidade_bilhetes: quantity,
                valor_total: valor,
                status: 'pending' // Status inicial
            });

        if (compraError) {
            console.error("Erro ao salvar a compra:", compraError);
            // Idealmente, aqui deveria haver uma lógica para cancelar a transação na SkalePay se possível
            throw new Error("Não foi possível registrar a sua compra.");
        }

        // --- Resposta para o Frontend ---
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(resultSkalePay.pix.qrcode)}&size=300x300`;

        return NextResponse.json({
            success: true,
            token: resultSkalePay.id,
            pixCopiaECola: resultSkalePay.pix.qrcode,
            qrCodeUrl: qrCodeUrl,
            valor: valor,
            comprador: {
                nome: nome,
                cpf: cpf_limpo,
                telefone: telefone_limpo
            }
        });

    } catch (error) {
        console.error("Erro ao processar pagamento:", error);
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

