const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendTwoFactorCode(toEmail, code) {
  await resend.emails.send({
    from: 'Sistema Administrativo Carnaval Experience <security@carnavalexperiencestore.com.br>',
    to: toEmail,
    subject: `Seu código de acesso: ${code}`,
    html: `
      <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:32px 24px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="margin:0 0 8px;font-size:1.25rem;color:#1a1a2e">Código de verificação</h2>
        <p style="color:#555;margin:0 0 24px;font-size:0.95rem">Use o código abaixo para acessar o sistema. Válido por <strong>10 minutos</strong>.</p>
        <div style="background:#f4f6ff;border:1px solid #c5caf5;border-radius:8px;padding:20px;text-align:center">
          <span style="font-size:2.2rem;font-weight:700;letter-spacing:0.35em;color:#3d4eac">${code}</span>
        </div>
        <p style="color:#999;font-size:0.8rem;margin:20px 0 0">Se você não tentou fazer login, ignore este email.</p>
      </div>
    `,
  });
}

module.exports = { sendTwoFactorCode };
