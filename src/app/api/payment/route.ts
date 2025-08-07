import { NextResponse } from 'next/server';

// Função para limpar telefone (remover formatação)
function limparTelefone(telefone: string | null): string {
    if (!telefone) return "11999999999";

    // Remove tudo que não é número
    let telefone_limpo = telefone.replace(/[^0-9]/g, '');

    // Se começar com 0, remove o 0
    if (telefone_limpo.startsWith('0')) {
        telefone_limpo = telefone_limpo.substring(1);
    }

    // Se não tiver DDD, adiciona 11 (ex: 8 dígitos)
    if (telefone_limpo.length === 8) {
        telefone_limpo = '11' + telefone_limpo;
    }

    // Se tiver 9 dígitos, adiciona DDD 11
    if (telefone_limpo.length === 9) {
        telefone_limpo = '11' + telefone_limpo;
    }

    // Garante que tenha pelo menos 10 dígitos
    if (telefone_limpo.length < 10) {
        return "11999999999";
    }

    return telefone_limpo;
}

// Função para gerar CPF válido
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { valor, nome, email, cpf, telefone, quantity } = body;

        if (!valor || valor <= 0 || !quantity || quantity <= 0) {
            throw new Error('Valor e quantidade são obrigatórios e devem ser maiores que zero.');
        }
        if (!nome || !email || !cpf || !telefone) {
            throw new Error('Todos os campos são obrigatórios: nome, email, cpf e telefone.');
        }

        const valor_centavos = Math.round(valor * 100);
        const telefone_cliente = limparTelefone(telefone);

        // Limpar CPF
        const cpf_limpo = cpf.replace(/[^0-9]/g, '');

        const apiUrl = 'https://api.conta.skalepay.com.br/v1';
        const secretKey = process.env.SKALEPLAY_SECRET_KEY;

        if (!secretKey) {
            throw new Error('Chave secreta da API não configurada.');
        }

        const authString = `${secretKey}:x`;
        const authHeader = `Basic ${btoa(authString)}`;

        const data = {
            "amount": valor_centavos,
            "paymentMethod": "pix",
            "customer": {
                "name": nome,
                "email": email,
                "document": {
                    "type": "cpf",
                    "number": cpf_limpo
                },
                "phone": telefone_cliente,
                "ip": request.headers.get('x-forwarded-for') ?? '127.0.0.1'
            },
            "items": [
                {
                    "id": `PROD_${new Date().getTime()}`,
                    "title": "Produto Padrao",
                    "quantity": quantity,
                    "unitPrice": Math.round(valor_centavos / quantity),
                    "tangible": false
                }
            ],
            "postbackUrl": `https://${request.headers.get('host')}/webhook/paguesafe`
        };

        const response = await fetch(`${apiUrl}/transactions`, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Erro na API: HTTP ${response.status} - ${errorBody}`);
        }

        const result = await response.json();

        if (!result.id || !result.pix?.qrcode) {
            throw new Error("Resposta da API inválida ou incompleta.");
        }
        
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(result.pix.qrcode)}&size=300x300`;


        return NextResponse.json({
            success: true,
            token: result.id,
            pixCopiaECola: result.pix.qrcode,
            qrCodeUrl: qrCodeUrl,
            valor: valor,
            comprador: {
                nome: nome,
                cpf: cpf_limpo,
                telefone: telefone_cliente
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

