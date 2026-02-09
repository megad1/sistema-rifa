// src/lib/email.ts
// Wrapper leve para envio de emails via Resend (fetch puro, compatível com Edge Runtime)

interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
    from?: string;
}

interface SendEmailResult {
    success: boolean;
    id?: string;
    error?: string;
}

export async function sendEmail({ to, subject, html, from }: SendEmailParams): Promise<SendEmailResult> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.warn('[EMAIL] RESEND_API_KEY não configurada. Email não enviado.');
        return { success: false, error: 'RESEND_API_KEY não configurada' };
    }

    const sender = from || process.env.EMAIL_FROM || '';
    if (!sender) {
        console.warn('[EMAIL] EMAIL_FROM não configurada. Email não enviado.');
        return { success: false, error: 'EMAIL_FROM não configurada' };
    }

    try {
        const resp = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: sender,
                to: [to],
                subject,
                html,
            }),
        });

        if (!resp.ok) {
            const errBody = await resp.text();
            console.error('[EMAIL] Erro Resend:', resp.status, errBody);
            return { success: false, error: `HTTP ${resp.status}: ${errBody}` };
        }

        const data = await resp.json();
        return { success: true, id: data?.id };
    } catch (err) {
        console.error('[EMAIL] Exceção ao enviar:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}
