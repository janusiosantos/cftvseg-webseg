---
name: webseg-email-templates
description: Referência do sistema de envio de emails do WebSeg usando Resend. Contém todos os templates HTML disponíveis, como chamá-los, e quando são disparados automaticamente. Consulte este skill antes de criar novos emails, modificar templates existentes, ou debugar problemas de envio.
---

# Sistema de E-mails (Resend)

## Configuração

### Arquivo: `src/lib/resend.ts`

### Variáveis de Ambiente
```env
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@opensoftware.com.br
```

### Função Base de Envio
```typescript
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
  const { data, error } = await resend.emails.send({
    from: `WebSeg <${fromEmail}>`,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    replyTo,
  });
  // Logs e tratamento de erros...
}
```

## Templates Disponíveis

### 1. orderConfirmationEmail
**Quando:** Webhook do MP recebe status `approved`
**Para:** Cliente (order.customerEmail)
**Assunto:** `✅ Pedido confirmado - ${companyName}`
**Conteúdo:** Resumo do pedido, items, total, data de instalação, botão de tracking

```typescript
orderConfirmationEmail({
  customerName: "João Silva",
  orderId: "clxxx123",
  items: [{ name: "Kit 4 Câmeras", quantity: 1, price: "899.90" }],
  total: "899.90",
  scheduledDate: "10 de Agosto de 2026",
  scheduledTime: "08:00",
  partnerName: "Acme Segurança",
  partnerPhone: "(11) 99999-9999",
  trackingUrl: "https://acme.opensoftware.com.br/pedido/clxxx123",
});
```

### 2. welcomePartnerEmail
**Quando:** Super Admin cria um novo parceiro via `/api/partners`
**Para:** E-mail do responsável do parceiro
**Assunto:** `🎉 Bem-vindo ao WebSeg!`
**Conteúdo:** Credenciais de acesso, URL da loja, URL do admin, primeiros passos

```typescript
welcomePartnerEmail({
  responsibleName: "Maria Santos",
  companyName: "Acme Segurança",
  subdomain: "acme-seguranca",
  email: "maria@acme.com.br",
  temporaryPassword: "AbC@123xyz",
  rootDomain: "opensoftware.com.br",
});
```

### 3. scheduleConfirmationEmail
**Quando:** Webhook do MP recebe status `approved` E o pedido tem `scheduledDate`
**Para:** Cliente (order.customerEmail)
**Assunto:** `📅 Instalação agendada - ${companyName}`
**Conteúdo:** Data, horário, endereço, nome do técnico (se já atribuído)

```typescript
scheduleConfirmationEmail({
  customerName: "João Silva",
  scheduledDate: "10 de Agosto de 2026",
  scheduledTime: "08:00 - 10:00",
  address: "Rua das Flores, 123 - São Paulo/SP",
  technicianName: "Carlos Técnico", // opcional
  partnerName: "Acme Segurança",
  partnerPhone: "(11) 99999-9999",
});
```

### 4. welcomeTechnicianEmail
**Quando:** Admin cria um novo técnico via `/api/technicians`
**Para:** E-mail do técnico
**Assunto:** `👷 Bem-vindo à Equipe!`
**Conteúdo:** Credenciais de acesso, link do App do Técnico

```typescript
welcomeTechnicianEmail({
  technicianName: "Carlos Técnico",
  companyName: "Acme Segurança",
  loginUrl: "https://acme.opensoftware.com.br/login",
  email: "carlos@email.com",
  temporaryPassword: "xYz@456abc",
});
```

### 5. Email de Avaliação NPS (inline)
**Quando:** Técnico marca pedido como COMPLETED via `PATCH /api/technician/orders/[id]/status`
**Para:** Cliente (order.customerEmail)
**Assunto:** `Como foi o serviço da ${companyName}?`
**Arquivo:** Gerado inline em `src/app/api/technician/orders/[id]/status/route.ts`

```typescript
await sendEmail({
  to: order.customerEmail,
  subject: `Como foi o serviço da ${tenant.companyName}?`,
  html: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Olá, ${order.customerName}!</h2>
      <p>O técnico informou que a instalação foi concluída.</p>
      <a href="${reviewUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; ...">
        Avaliar o Atendimento
      </a>
    </div>
  `,
});
```

### 6. Notificação de Novo Pedido ao Parceiro (inline)
**Quando:** Webhook do MP recebe status `approved`
**Para:** Email admin do tenant (order.tenant.email)
**Assunto:** `🛒 Novo pedido recebido! #${orderId}`
**Arquivo:** `src/app/api/webhooks/mercadopago/route.ts`

## Disparos Automáticos

| Evento | Template | Destinatário |
|--------|----------|-------------|
| Pagamento aprovado (webhook) | orderConfirmationEmail | Cliente |
| Pagamento aprovado + agendamento | scheduleConfirmationEmail | Cliente |
| Pagamento aprovado | Inline (novo pedido) | Parceiro |
| Novo parceiro criado | welcomePartnerEmail | Parceiro |
| Novo técnico criado | welcomeTechnicianEmail | Técnico |
| Serviço finalizado (COMPLETED) | Inline (NPS review) | Cliente |

## Estilo Visual dos Templates
- **Font:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Container:** `max-width: 600px`, `border-radius: 12px`, `box-shadow`
- **Header gradient:** `linear-gradient(135deg, #6366f1, #818cf8)` (roxo, padrão WebSeg)
- **Botão CTA:** `background: #6366f1`, `border-radius: 8px`, `font-weight: 600`
- **Footer:** `background: #f9fafb`, texto `#6b7280`

## Como Adicionar Novos Templates
1. Criar a função no `src/lib/resend.ts`
2. Retornar string HTML completa (DOCTYPE, head com styles inline, body)
3. Usar inline styles (não CSS externo, e-mail clients não suportam)
4. Importar e chamar `sendEmail()` no local desejado
