// src/app/api/cron/recovery-emails/route.ts
// Endpoint para envio de emails de recuperação de carrinho abandonado
// Chamado periodicamente via cron-job.org

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';
import { buildRecoveryHtml } from '@/lib/email-templates';
import { getCampaignSettings } from '@/lib/campaign';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const MAX_EMAILS_PER_RUN = 50;

export async function GET(request: Request) {
    // Validar token de segurança
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    const expectedToken = process.env.CRON_SECRET;

    if (!expectedToken) {
        return NextResponse.json({ error: 'CRON_SECRET não configurado' }, { status: 500 });
    }

    if (token !== expectedToken) {
        return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    try {
        const delayMinutes = Number(process.env.RECOVERY_EMAIL_DELAY_MIN || '30');
        const cutoffDate = new Date(Date.now() - delayMinutes * 60 * 1000).toISOString();

        // Buscar compras pendentes há mais de X minutos sem email de recuperação enviado
        const { data: comprasPendentes, error: fetchError } = await supabaseAdmin
            .from('compras')
            .select('id, cliente_id, quantidade_bilhetes, valor_total, created_at')
            .eq('status', 'pending')
            .is('recovery_email_sent_at', null)
            .lt('created_at', cutoffDate)
            .order('created_at', { ascending: true })
            .limit(MAX_EMAILS_PER_RUN);

        if (fetchError) {
            console.error('[CRON] Erro ao buscar compras pendentes:', fetchError);
            return NextResponse.json({ error: 'Erro ao buscar compras' }, { status: 500 });
        }

        if (!comprasPendentes || comprasPendentes.length === 0) {
            return NextResponse.json({ sent: 0, message: 'Nenhuma compra pendente para recuperação.' });
        }

        const campaign = await getCampaignSettings();
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
        if (!siteUrl) console.warn('[CRON] NEXT_PUBLIC_SITE_URL não configurada.');

        let sent = 0;
        let errors = 0;

        for (const compra of comprasPendentes) {
            try {
                // Buscar dados do cliente
                const { data: cliente } = await supabaseAdmin
                    .from('clientes')
                    .select('nome, email')
                    .eq('id', compra.cliente_id)
                    .single();

                if (!cliente?.email) {
                    console.warn(`[CRON] Cliente ${compra.cliente_id} sem email, pulando.`);
                    // Marcar como enviado para não tentar novamente
                    await supabaseAdmin
                        .from('compras')
                        .update({ recovery_email_sent_at: new Date().toISOString() })
                        .eq('id', compra.id);
                    continue;
                }

                const html = buildRecoveryHtml({
                    nomeCliente: cliente.nome || 'Cliente',
                    quantidadeCotas: compra.quantidade_bilhetes,
                    valorTotal: compra.valor_total,
                    tituloCampanha: campaign.title,
                    siteUrl,
                });

                const result = await sendEmail({
                    to: cliente.email,
                    subject: `⏰ ${cliente.nome?.split(' ')[0] || 'Ei'}, sua compra está pendente!`,
                    html,
                });

                if (result.success) {
                    await supabaseAdmin
                        .from('compras')
                        .update({ recovery_email_sent_at: new Date().toISOString() })
                        .eq('id', compra.id);
                    sent++;
                    console.log(`[CRON] Recovery email enviado para ${cliente.email} (compra ${compra.id})`);
                } else {
                    errors++;
                    console.error(`[CRON] Falha ao enviar para ${cliente.email}:`, result.error);
                }
            } catch (e) {
                errors++;
                console.error(`[CRON] Erro processando compra ${compra.id}:`, e);
            }
        }

        return NextResponse.json({
            sent,
            errors,
            total: comprasPendentes.length,
            message: `${sent} emails de recuperação enviados.`,
        });
    } catch (error) {
        console.error('[CRON] Erro geral:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
