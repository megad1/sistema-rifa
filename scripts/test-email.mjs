// Script de teste para enviar email de recuperação via Resend API
const RESEND_API_KEY = 're_74xo2BV9_HM7u5P5qjcFdqL4tGuumKPXU';
const EMAIL_FROM = 'Pix do Milhão <noreply@sortedemilhao.space>';
const TO = 'ivesmateusps@gmail.com';

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Finalize sua compra</title>
</head>
<body style="margin:0;padding:0;background-color:#F3F4F6;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F3F4F6;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color:#EBAB2B;padding:24px;text-align:center;">
              <h1 style="margin:0;font-size:20px;font-weight:800;color:#212121;font-style:italic;letter-spacing:-0.5px;">PIX DO MILHÃO</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px;">
              <h2 style="margin:0 0 8px;font-size:20px;font-weight:bold;color:#111827;">Ives, você esqueceu algo! 👋</h2>
              <p style="margin:0 0 20px;font-size:14px;color:#6B7280;line-height:1.6;">
                Notamos que você iniciou uma compra mas ainda não finalizou o pagamento. Seus números da sorte estão te esperando!
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF7ED;border-radius:8px;padding:16px;border:1px solid #FED7AA;margin-bottom:20px;">
                <tr>
                  <td>
                    <p style="margin:0 0 6px;font-size:13px;font-weight:bold;color:#C2410C;text-transform:uppercase;letter-spacing:0.5px;">Sua compra pendente</p>
                    <p style="margin:0 0 2px;font-size:15px;color:#111827;font-weight:600;">Sorte de Milhão</p>
                    <p style="margin:0;font-size:14px;color:#6B7280;">50 cotas • R$ 5,50</p>
                  </td>
                </tr>
              </table>
              <div style="text-align:center;">
                <a href="https://sistema-rifapm.pages.dev/rifa" style="display:inline-block;background-color:#059669;color:#FFFFFF;font-size:15px;font-weight:bold;padding:14px 32px;border-radius:8px;text-decoration:none;box-shadow:0 2px 4px rgba(5,150,105,0.3);">
                  Finalizar minha compra →
                </a>
              </div>
              <p style="margin:20px 0 0;font-size:13px;color:#9CA3AF;text-align:center;">
                Não perca essa chance. Boa sorte! 🍀
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#F9FAFB;padding:16px 24px;text-align:center;border-top:1px solid #E5E7EB;">
              <p style="margin:0;font-size:11px;color:#D1D5DB;">Este email foi enviado automaticamente. Não responda.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

async function main() {
  console.log('Enviando email de recuperação para', TO, '...');
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [TO],
      subject: '⏰ Ives, sua compra está pendente!',
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
