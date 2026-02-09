// Script de teste para enviar email de confirmação de compra via Resend API
const RESEND_API_KEY = 're_74xo2BV9_HM7u5P5qjcFdqL4tGuumKPXU';
const EMAIL_FROM = 'Pix do Milhão <noreply@sortedemilhao.space>';
const TO = 'ivesmateusps@gmail.com';

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Compra Confirmada</title>
</head>
<body style="margin:0;padding:0;background-color:#F3F4F6;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F3F4F6;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color:#EBAB2B;padding:24px;text-align:center;">
              <h1 style="margin:0;font-size:20px;font-weight:800;color:#212121;font-style:italic;letter-spacing:-0.5px;">PIX DO MILHÃO</h1>
            </td>
          </tr>

          <!-- Ícone de sucesso -->
          <tr>
            <td style="padding:28px 24px 0;text-align:center;">
              <div style="width:56px;height:56px;background-color:#DEF7EC;border-radius:50%;display:inline-block;line-height:56px;text-align:center;margin-bottom:12px;">
                <span style="font-size:28px;color:#059669;">✓</span>
              </div>
              <h2 style="margin:0 0 4px;font-size:22px;font-weight:bold;color:#111827;">Pagamento Confirmado!</h2>
              <p style="margin:0;font-size:14px;color:#6B7280;">Sua compra foi processada com sucesso</p>
            </td>
          </tr>

          <!-- Detalhes da compra -->
          <tr>
            <td style="padding:20px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F9FAFB;border-radius:8px;padding:16px;border:1px solid #E5E7EB;">
                <tr>
                  <td style="padding:4px 0;">
                    <span style="font-size:12px;color:#6B7280;text-transform:uppercase;font-weight:bold;letter-spacing:0.5px;">Comprador</span><br>
                    <span style="font-size:15px;color:#111827;font-weight:600;">Ives Mateus</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0 4px;border-top:1px solid #E5E7EB;">
                    <span style="font-size:12px;color:#6B7280;text-transform:uppercase;font-weight:bold;letter-spacing:0.5px;">Campanha</span><br>
                    <span style="font-size:15px;color:#111827;font-weight:600;">Sorte de Milhão</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0 4px;border-top:1px solid #E5E7EB;">
                    <table role="presentation" width="100%"><tr>
                      <td>
                        <span style="font-size:12px;color:#6B7280;text-transform:uppercase;font-weight:bold;letter-spacing:0.5px;">Cotas</span><br>
                        <span style="font-size:15px;color:#111827;font-weight:600;">50</span>
                      </td>
                      <td style="text-align:right;">
                        <span style="font-size:12px;color:#6B7280;text-transform:uppercase;font-weight:bold;letter-spacing:0.5px;">Valor</span><br>
                        <span style="font-size:15px;color:#111827;font-weight:600;">R$ 5,50</span>
                      </td>
                    </tr></table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Números da sorte -->
          <tr>
            <td style="padding:0 24px 20px;">
              <div style="background-color:#EFF6FF;border-radius:8px;padding:16px;border:1px solid #BFDBFE;">
                <p style="margin:0 0 10px;font-size:13px;font-weight:bold;color:#1E40AF;text-transform:uppercase;letter-spacing:0.5px;">🎟️ Seus números da sorte</p>
                <div style="line-height:2.2;">
                  <span style="display:inline-block;background:#EBF5FF;border:1px solid #BFDBFE;color:#1E3A5F;font-family:'Courier New',monospace;font-weight:bold;font-size:14px;padding:4px 10px;border-radius:6px;margin:3px;">123456</span>
                  <span style="display:inline-block;background:#EBF5FF;border:1px solid #BFDBFE;color:#1E3A5F;font-family:'Courier New',monospace;font-weight:bold;font-size:14px;padding:4px 10px;border-radius:6px;margin:3px;">234567</span>
                  <span style="display:inline-block;background:#EBF5FF;border:1px solid #BFDBFE;color:#1E3A5F;font-family:'Courier New',monospace;font-weight:bold;font-size:14px;padding:4px 10px;border-radius:6px;margin:3px;">345678</span>
                </div>
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 24px 24px;text-align:center;">
              <a href="https://sistema-rifapm.pages.dev/meus-titulos" style="display:inline-block;background-color:#059669;color:#FFFFFF;font-size:15px;font-weight:bold;padding:14px 32px;border-radius:8px;text-decoration:none;box-shadow:0 2px 4px rgba(5,150,105,0.3);">
                Ver minhas cotas →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F9FAFB;padding:16px 24px;text-align:center;border-top:1px solid #E5E7EB;">
              <p style="margin:0;font-size:12px;color:#9CA3AF;">Boa sorte! 🍀</p>
              <p style="margin:4px 0 0;font-size:11px;color:#D1D5DB;">Este email foi enviado automaticamente. Não responda.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

async function main() {
    console.log('Enviando email de confirmação para', TO, '...');
    const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: EMAIL_FROM,
            to: [TO],
            subject: '✅ Compra confirmada — 50 cotas',
            html,
        }),
    });

    const data = await resp.json();
    if (resp.ok) {
        console.log('✅ Email enviado com sucesso! ID:', data.id);
    } else {
        console.error('❌ Erro ao enviar:', resp.status, data);
    }
}

main();
