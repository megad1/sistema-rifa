import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { limparTelefone, limparCpf } from '@/utils/formatters';
import { TICKET_PRICE } from '@/config/pricing';
import { MAX_PIX_TOTAL_BR } from '@/config/payments';
import { getFacebookSettings } from '@/lib/facebook';
import { getUtmifySettings, postUtmifyOrder, toUtcSqlDate } from '@/lib/utmify';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { nome, email, cpf, telefone, quantity, trackingParameters } = body as any;

        // --- Validação de Entrada ---
        if (!quantity || typeof quantity !== 'number' || quantity <= 0) {
            throw new Error('Quantidade é obrigatória e deve ser maior que zero.');
        }
        if (!nome || !email || !cpf || !telefone) {
            throw new Error('Todos os campos são obrigatórios: nome, email, cpf e telefone.');
        }

        const telefone_limpo = limparTelefone(telefone);
        const cpf_limpo = limparCpf(cpf);

        // --- Cálculo de valor no SERVIDOR (fonte de verdade) ---
        const valor = quantity * TICKET_PRICE;
        if (valor > MAX_PIX_TOTAL_BR) {
            throw new Error(`Valor máximo por Pix é R$ ${MAX_PIX_TOTAL_BR.toFixed(2)}. Reduza a quantidade ou realize múltiplas compras.`);
        }

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
        const authHeader = `Basic ${Buffer.from(`${secretKey}:x`).toString('base64')}`;

        const webhookToken = process.env.WEBHOOK_TOKEN;
        const baseWebhookUrl = `https://${request.headers.get('host')}/webhook/paguesafe`;
        const postbackUrl = webhookToken ? `${baseWebhookUrl}?t=${encodeURIComponent(webhookToken)}` : baseWebhookUrl;

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
            "postbackUrl": postbackUrl
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
                status: 'pending', // Status inicial
                tracking_parameters: trackingParameters ?? null
            });

        if (compraError) {
            console.error("Erro ao salvar a compra:", compraError);
            // Idealmente, aqui deveria haver uma lógica para cancelar a transação na SkalePay se possível
            throw new Error("Não foi possível registrar a sua compra.");
        }

        // --- Resposta para o Frontend ---
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(resultSkalePay.pix.qrcode)}&size=300x300`;

        const fb = await getFacebookSettings();
        const utm = await getUtmifySettings();

        // Envia Purchase para o Pixel (browser) via fbq em client já acontece com PageView. Para CAPI, enviaremos servidor → Facebook se ativado.

        // Disparo Utmify (waiting_payment)
        if (utm.enabled) {
            try {
                await postUtmifyOrder({
                    orderId: resultSkalePay.id,
                    status: 'waiting_payment',
                    createdAt: toUtcSqlDate(new Date()),
                    approvedDate: null,
                    ip: request.headers.get('x-forwarded-for') ?? undefined,
                    customer: { name: nome, email, document: cpf_limpo },
                    quantity: quantity,
                    totalValue: valor,
                }, trackingParameters || undefined);
            } catch (e) { console.error('[UTMIFY] pending error', e); }
        }

        // --- Resposta para o Frontend ---
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
            },
            fb: { enabled: fb.enabled, sendPurchase: fb.sendPurchase, pixelId: fb.pixelId }
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

