---
name: webseg-checkout-payments
description: Guia completo do fluxo de checkout, integração com Mercado Pago, gestão de estoque, cupons de desconto, agendamento e webhook de pagamento. Consulte este skill sempre que precisar modificar o checkout, adicionar novos métodos de pagamento, alterar lógica de estoque/cupons, ou debugar problemas com webhooks do Mercado Pago.
---

# Checkout, Pagamentos & Regras de Negócio

## 1. Fluxo Completo do Checkout

### Frontend: `src/app/_sites/[subdomain]/checkout/page.tsx`

O checkout é um componente client-side com 3 steps:

**Step 1 - Dados Pessoais:**
- Nome completo, CPF (validado com `validateCpf` do `@/lib/cpf`), E-mail, Telefone
- CPF é validado em tempo real no frontend antes de prosseguir

**Step 2 - Endereço de Instalação:**
- CEP, Estado, Cidade, Endereço, Número, Complemento, Bairro

**Step 3 - Agendamento + Pagamento:**
- Seletor de datas (próximos dias com slots disponíveis via `/api/schedule/slots`)
- Seletor de horários para a data escolhida
- Campo de cupom de desconto com validação via `/api/coupons/validate`
- Resumo do pedido com desconto aplicado
- Botão "Pagar com Mercado Pago"

### Estados do Cupom no Frontend
```typescript
const [couponCode, setCouponCode] = useState("");
const [appliedCoupon, setAppliedCoupon] = useState<{
  code: string;
  type: string;     // "PERCENTAGE" | "FIXED"
  value: number;
} | null>(null);
const [couponError, setCouponError] = useState("");
const [couponLoading, setCouponLoading] = useState(false);
```

O cupom é validado via GET `/api/coupons/validate?tenant=X&code=Y` e, se válido, o `appliedCoupon.code` é enviado no payload do checkout.

### Payload Enviado ao Backend
```typescript
const payload = {
  productId,
  quantity: 1,
  couponCode: appliedCoupon?.code || undefined,
  customerName, customerCpf, customerEmail, customerPhone,
  installAddress, installNumber, installComplement, installNeighborhood,
  installCity, installState, installZip,
  scheduledDate, scheduledTimeStart, scheduledTimeEnd,
};
```

## 2. API de Checkout (POST /api/checkout)

### Arquivo: `src/app/api/checkout/route.ts`

### Schema de Validação (Zod)
```typescript
const checkoutSchema = z.object({
  productId: z.string(),
  quantity: z.number().min(1).default(1),
  customerName: z.string().min(2),
  customerCpf: z.string().min(11),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(10),
  installAddress: z.string().min(3),
  installNumber: z.string().optional(),
  installComplement: z.string().optional(),
  installNeighborhood: z.string().optional(),
  installCity: z.string().min(2),
  installState: z.string().length(2),
  installZip: z.string().min(8),
  scheduledDate: z.string(),
  scheduledTimeStart: z.string().optional(),
  scheduledTimeEnd: z.string().optional(),
  couponCode: z.string().optional(),
});
```

### Sequência de Operações

```
1. Resolve tenant pelo subdomain
2. Verifica se tenant está ACTIVE ou TRIAL
3. Valida schema com Zod
4. Valida CPF (algoritmo + dígitos verificadores)
5. Busca produto (isActive: true)
6. Verifica estoque (se trackStock = true)
7. Calcula totalAmount (price × quantity)
8. Valida e aplica cupom (se couponCode presente)
9. ★ TRANSACTION ATÔMICA:
   a. Verifica capacidade do slot (maxCapacity)
   b. Cria Order (PENDING_PAYMENT)
   c. Cria Schedule (RESERVED)
   d. Subtrai stock (com double-check dentro da tx)
   e. Incrementa uses do Coupon
10. Cria Preference no Mercado Pago
11. Atualiza Order com mpPreferenceId
12. Retorna { orderId, preferenceId, initPoint }
```

### Tratamento de Erros Customizados
```typescript
// Erros lançados dentro da transaction:
"UNAVAILABLE_DAY" → 400 "Dia indisponível para instalação."
"SLOT_FULL"       → 409 "Horário esgotado! Por favor, escolha outro."
"OUT_OF_STOCK"    → 409 "Estoque esgotado no momento da compra."
```

## 3. Gestão de Estoque

### Campos no Model Product
```prisma
stock      Int     @default(0)    // Quantidade em estoque
trackStock Boolean @default(false) // Se true, controla estoque
```

### Regra: Estoque é subtraído no CHECKOUT, não na APROVAÇÃO
**Por quê?** Se subtraísse apenas na aprovação (webhook), dois clientes poderiam comprar o último item simultaneamente. Subtraindo no checkout (PENDING_PAYMENT) com double-check dentro da transaction, garantimos atomicidade.

### Fluxo de Estoque
```
Checkout:
  1. Verifica product.stock >= quantity (fora da tx, early return)
  2. Dentro da tx: re-verifica stock (double-check anti race condition)
  3. Dentro da tx: subtrai stock

Webhook (rejected/cancelled):
  1. Loop nos order.items
  2. Para cada item com productId, verifica trackStock
  3. Restaura stock: product.stock + item.quantity
```

### ⚠️ Observação
O estoque NÃO é restaurado se o pagamento ficar em "pending" indefinidamente. Para resolver isso no futuro, seria necessário um cron job que cancele pedidos PENDING_PAYMENT após X horas.

## 4. Cupons de Desconto

### Model Coupon
```prisma
model Coupon {
  id           String    @id @default(cuid())
  tenantId     String
  code         String                          // Ex: "PROMO10", "BEMVINDO"
  discountType String                          // "PERCENTAGE" ou "FIXED"
  discountValue Decimal  @db.Decimal(10, 2)    // Ex: 10.00 (10%) ou 50.00 (R$50)
  maxUses      Int?                            // null = ilimitado
  uses         Int       @default(0)           // Contador atual
  isActive     Boolean   @default(true)
  expiresAt    DateTime?                       // null = sem expiração
  @@unique([tenantId, code])                   // Código único por tenant
}
```

### API de Validação (GET /api/coupons/validate)
Parâmetros: `?tenant=X&code=Y`
Verifica: `isActive`, `expiresAt`, `maxUses vs uses`
Retorna: `{ code, discountType, discountValue }`

### API de CRUD (POST/GET /api/coupons, DELETE /api/coupons/[id])
- Requer role PARTNER_ADMIN ou SUPER_ADMIN
- Código é convertido para UPPERCASE automaticamente
- Verifica duplicata antes de criar

### Cálculo do Desconto no Backend
```typescript
if (coupon.discountType === "PERCENTAGE") {
  totalAmount = totalAmount - (totalAmount * (Number(coupon.discountValue) / 100));
} else {
  totalAmount = Math.max(0, totalAmount - Number(coupon.discountValue));
}
```

## 5. Agendamento de Slots

### API de Slots (GET /api/schedule/slots)
Gera slots dinâmicos com base em `WorkingHours` do tenant:
1. Busca WorkingHours para os próximos 14 dias
2. Para cada dia, gera slots baseados em `slotDurationMin` (ex: 120min)
3. Filtra slots que já estão lotados (count de schedules existentes >= maxCapacity)
4. Retorna array de `{ date, startTime, endTime, dateFormatted }`

### WorkingHours Model
```prisma
model WorkingHours {
  dayOfWeek       Int    // 0=Dom, 1=Seg, ..., 6=Sáb
  startTime       String // "08:00"
  endTime         String // "18:00"
  slotDurationMin Int    @default(120)
  maxCapacity     Int    @default(1)
  @@unique([tenantId, dayOfWeek])
}
```

## 6. Webhook do Mercado Pago

### Arquivo: `src/app/api/webhooks/mercadopago/route.ts`

### Validação de Assinatura
O webhook implementa verificação HMAC-SHA256 usando `MERCADOPAGO_WEBHOOK_SECRET`. Em produção, o check de assinatura deve ser descomentado.

### Fluxo por Status
```
"approved":
  → Order.status = SCHEDULED (se tem data) ou PAID
  → Schedule.status = CONFIRMED
  → Envia 3 emails: confirmação do pedido, confirmação de agendamento, notificação ao parceiro

"rejected" | "cancelled":
  → Order.status = CANCELLED
  → Schedule.status = CANCELLED
  → Restaura stock dos produtos
  → (Não decrementa uses do cupom - decisão proposital)

outros (pending, in_process, etc.):
  → Atualiza mpPaymentId e mpStatus na Order
```

### Mercado Pago Preference
```typescript
const result = await preference.create({
  body: {
    items: [{ id, title, unit_price: totalAmount, quantity: 1, currency_id: "BRL" }],
    payer: { name, email, identification: { type: "CPF", number: cpfClean } },
    back_urls: { success, failure, pending },
    auto_return: "approved",
    external_reference: order.id,    // ← Liga o pagamento ao pedido
    notification_url: `${appUrl}/api/webhooks/mercadopago`,
    statement_descriptor: "WEBSEG",
  },
});
```

## 7. Avaliação NPS

### Trigger
Quando o técnico muda status do pedido para COMPLETED via `PATCH /api/technician/orders/[id]/status`:
1. Atualiza `ServiceRecord.checkOutTime`
2. Dispara email ao cliente com link para `/pedido/[id]/avaliar`

### Página de Avaliação
- **Server Component:** `_sites/[subdomain]/pedido/[id]/avaliar/page.tsx`
- **Client Component:** `ReviewForm.tsx` (estrelas interativas com Lucide Star)
- **API:** `POST /api/reviews` → atualiza `ServiceRecord.reviewScore` e `reviewComment`
- **Proteção:** Se `reviewScore` já existe, mostra mensagem "Já avaliado"

## 8. Exportação ICS (Google Calendar)

### Arquivo: `src/app/api/technician/calendar.ics/route.ts`
- Requer autenticação como TECHNICIAN
- Busca todos os Schedules atribuídos ao técnico
- Gera arquivo `.ics` com VCALENDAR/VEVENT padrão
- Inclui: cliente, telefone, endereço, número do pedido
- Content-Type: `text/calendar; charset=utf-8`
