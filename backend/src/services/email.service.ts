import nodemailer from 'nodemailer';
import { env } from '../config/env';

// ─── Transporter ─────────────────────────────────────────────────────────────

function createTransporter() {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    // Sem credenciais → log no console (útil em desenvolvimento)
    return null;
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

// ─── Envio de e-mail de verificação ──────────────────────────────────────────

export async function sendVerificationEmail(params: {
  to:          string;
  clientName:  string;
  tenantName:  string;
  verifyUrl:   string;
}): Promise<void> {
  const { to, clientName, tenantName, verifyUrl } = params;

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head><meta charset="UTF-8"/></head>
    <body style="font-family:sans-serif;background:#f4f4f5;margin:0;padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
        <tr><td align="center">
          <table width="540" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:540px;">
            <!-- Header -->
            <tr>
              <td style="padding:28px 32px 20px;background:#09090b;">
                <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">AgendePro</p>
                <p style="margin:4px 0 0;color:#a1a1aa;font-size:13px;">${tenantName}</p>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:32px;">
                <h2 style="margin:0 0 12px;font-size:22px;color:#09090b;">Confirme seu e-mail</h2>
                <p style="margin:0 0 20px;color:#52525b;font-size:15px;line-height:1.6;">
                  Olá, <strong>${clientName}</strong>! Clique no botão abaixo para confirmar
                  seu endereço de e-mail e ativar sua conta em <strong>${tenantName}</strong>.
                </p>
                <a href="${verifyUrl}"
                   style="display:inline-block;padding:14px 32px;background:#09090b;color:#ffffff;
                          text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">
                  Verificar e-mail
                </a>
                <p style="margin:24px 0 0;color:#a1a1aa;font-size:12px;">
                  Este link expira em 24 horas. Se você não solicitou este cadastro, ignore este e-mail.
                </p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  const transporter = createTransporter();

  if (!transporter) {
    // Desenvolvimento sem SMTP: apenas loga o link no console
    console.log('\n─────────────────────────────────────────────');
    console.log('[EMAIL] Verificação de e-mail (sem SMTP configurado)');
    console.log(`  Para:    ${to}`);
    console.log(`  Link:    ${verifyUrl}`);
    console.log('─────────────────────────────────────────────\n');
    return;
  }

  await transporter.sendMail({
    from:    env.SMTP_FROM,
    to,
    subject: `Confirme seu e-mail — ${tenantName}`,
    html,
  });
}
