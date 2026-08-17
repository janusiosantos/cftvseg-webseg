import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: `WebSeg <${fromEmail}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      replyTo,
    });

    if (error) {
      console.error("[Resend] Error sending email:", error);
      throw error;
    }

    console.log("[Resend] Email sent:", data?.id);
    return data;
  } catch (err) {
    console.error("[Resend] Failed to send email:", err);
    throw err;
  }
}

// ============================================
// Email Templates (HTML)
// ============================================

export function orderConfirmationEmail(params: {
  customerName: string;
  orderId: string;
  items: { name: string; quantity: number; price: string }[];
  total: string;
  scheduledDate?: string;
  scheduledTime?: string;
  partnerName: string;
  partnerPhone?: string;
  trackingUrl: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #6366f1, #818cf8); padding: 32px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 24px; }
        .content { padding: 32px; }
        .badge { display: inline-block; background: #dcfce7; color: #16a34a; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 600; }
        .items { width: 100%; border-collapse: collapse; margin: 16px 0; }
        .items td { padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
        .total { font-size: 20px; font-weight: 700; color: #6366f1; }
        .schedule-box { background: #f0f0ff; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .btn { display: inline-block; background: #6366f1; color: #fff !important; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; margin: 16px 0; text-align: center; }
        .footer { background: #f9fafb; padding: 24px; text-align: center; font-size: 13px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Pedido Confirmado!</h1>
        </div>
        <div class="content">
          <p>Olá <strong>${params.customerName}</strong>,</p>
          <p>Seu pedido foi confirmado com sucesso! <span class="badge">Pago</span></p>
          
          <p><strong>Pedido:</strong> #${params.orderId.slice(-8).toUpperCase()}</p>
          
          <table class="items">
            <tbody>
              ${params.items.map(item => `
                <tr>
                  <td>${item.name} (x${item.quantity})</td>
                  <td style="text-align:right">R$ ${item.price}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          
          <p class="total">Total: R$ ${params.total}</p>
          
          ${params.scheduledDate ? `
            <div class="schedule-box">
              <p style="margin:0 0 8px"><strong>📅 Instalação agendada:</strong></p>
              <p style="margin:0"><strong>Data:</strong> ${params.scheduledDate}</p>
              ${params.scheduledTime ? `<p style="margin:4px 0 0"><strong>Horário:</strong> ${params.scheduledTime}</p>` : ""}
            </div>
          ` : ""}
          
          <p style="text-align: center;">
            <a href="${params.trackingUrl}" class="btn">Acompanhar meu Pedido →</a>
          </p>

          <p>A equipe da <strong>${params.partnerName}</strong> entrará em contato para confirmar os detalhes.
          ${params.partnerPhone ? `<br>Telefone: ${params.partnerPhone}` : ""}</p>
        </div>
        <div class="footer">
          <p>Este e-mail foi enviado automaticamente pelo sistema WebSeg.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function welcomePartnerEmail(params: {
  responsibleName: string;
  companyName: string;
  subdomain: string;
  email: string;
  temporaryPassword: string;
  rootDomain: string;
}) {
  const storeUrl = `https://${params.subdomain}.${params.rootDomain}`;
  const adminUrl = `${storeUrl}/admin`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #6366f1, #818cf8); padding: 32px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 24px; }
        .content { padding: 32px; }
        .cred-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .cred-box code { background: #e5e7eb; padding: 2px 8px; border-radius: 4px; font-size: 14px; }
        .btn { display: inline-block; background: #6366f1; color: #fff !important; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; margin: 16px 0; }
        .steps { counter-reset: step; list-style: none; padding: 0; }
        .steps li { counter-increment: step; padding: 8px 0 8px 40px; position: relative; }
        .steps li::before { content: counter(step); position: absolute; left: 0; top: 8px; width: 28px; height: 28px; background: #6366f1; color: #fff; border-radius: 50%; text-align: center; line-height: 28px; font-size: 14px; font-weight: 600; }
        .footer { background: #f9fafb; padding: 24px; text-align: center; font-size: 13px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Bem-vindo ao WebSeg!</h1>
        </div>
        <div class="content">
          <p>Olá <strong>${params.responsibleName}</strong>,</p>
          <p>A conta da <strong>${params.companyName}</strong> foi criada com sucesso na plataforma WebSeg!</p>
          
          <div class="cred-box">
            <p style="margin:0 0 8px"><strong>🔐 Credenciais de acesso:</strong></p>
            <p style="margin:4px 0"><strong>E-mail:</strong> <code>${params.email}</code></p>
            <p style="margin:4px 0"><strong>Senha temporária:</strong> <code>${params.temporaryPassword}</code></p>
            <p style="margin:8px 0 0; color: #dc2626; font-size: 13px;">⚠️ Altere sua senha no primeiro acesso!</p>
          </div>
          
          <p><strong>Sua loja:</strong> <a href="${storeUrl}">${storeUrl}</a></p>
          <p><strong>Painel admin:</strong> <a href="${adminUrl}">${adminUrl}</a></p>
          
          <a href="${adminUrl}" class="btn">Acessar meu painel →</a>
          
          <h3>Primeiros passos:</h3>
          <ol class="steps">
            <li>Faça login com as credenciais acima</li>
            <li>Personalize sua loja (logo, cores, banner)</li>
            <li>Cadastre seus produtos/kits</li>
            <li>Configure seus horários de atendimento</li>
            <li>Comece a receber pedidos!</li>
          </ol>
        </div>
        <div class="footer">
          <p>Equipe WebSeg<br>
          <a href="https://cftveseg.opensoftware.com.br">cftveseg.opensoftware.com.br</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function scheduleConfirmationEmail(params: {
  customerName: string;
  scheduledDate: string;
  scheduledTime: string;
  address: string;
  technicianName?: string;
  partnerName: string;
  partnerPhone?: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #06d6a0, #00b4d8); padding: 32px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 24px; }
        .content { padding: 32px; }
        .schedule-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 16px 0; }
        .schedule-card .date { font-size: 20px; font-weight: 700; color: #16a34a; }
        .footer { background: #f9fafb; padding: 24px; text-align: center; font-size: 13px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📅 Instalação Agendada!</h1>
        </div>
        <div class="content">
          <p>Olá <strong>${params.customerName}</strong>,</p>
          <p>Sua instalação foi agendada com sucesso!</p>
          
          <div class="schedule-card">
            <p class="date">📅 ${params.scheduledDate}</p>
            <p><strong>⏰ Horário:</strong> ${params.scheduledTime}</p>
            <p><strong>📍 Local:</strong> ${params.address}</p>
            ${params.technicianName ? `<p><strong>👷 Técnico:</strong> ${params.technicianName}</p>` : ""}
          </div>
          
          <p>A equipe da <strong>${params.partnerName}</strong> estará no local no horário combinado.
          ${params.partnerPhone ? `<br>Em caso de dúvidas, ligue: ${params.partnerPhone}` : ""}</p>
        </div>
        <div class="footer">
          <p>Este e-mail foi enviado automaticamente pelo sistema WebSeg.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function welcomeTechnicianEmail(params: {
  technicianName: string;
  companyName: string;
  loginUrl: string;
  email: string;
  temporaryPassword: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #10b981, #34d399); padding: 32px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 24px; }
        .content { padding: 32px; }
        .cred-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .cred-box code { background: #e5e7eb; padding: 2px 8px; border-radius: 4px; font-size: 14px; font-weight: 600; }
        .btn { display: inline-block; background: #10b981; color: #fff !important; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; margin: 16px 0; text-align: center; }
        .footer { background: #f9fafb; padding: 24px; text-align: center; font-size: 13px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>👷 Bem-vindo à Equipe!</h1>
        </div>
        <div class="content">
          <p>Olá <strong>${params.technicianName}</strong>,</p>
          <p>Você foi adicionado(a) como técnico(a) da equipe <strong>${params.companyName}</strong>.</p>
          
          <div class="cred-box">
            <p style="margin:0 0 8px"><strong>🔐 Suas credenciais de acesso:</strong></p>
            <p style="margin:4px 0"><strong>E-mail:</strong> <code>${params.email}</code></p>
            <p style="margin:4px 0"><strong>Senha temporária:</strong> <code>${params.temporaryPassword}</code></p>
            <p style="margin:8px 0 0; color: #dc2626; font-size: 13px;">⚠️ Por motivos de segurança, você deve alterar sua senha no App em "Perfil" após o primeiro acesso.</p>
          </div>
          
          <p style="text-align: center">
            <a href="${params.loginUrl}" class="btn">Acessar App do Técnico →</a>
          </p>
        </div>
        <div class="footer">
          <p>Sistema WebSeg</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
