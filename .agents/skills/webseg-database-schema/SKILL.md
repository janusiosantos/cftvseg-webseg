---
name: webseg-database-schema
description: Referência completa do schema Prisma do WebSeg com todos os models, enums, relacionamentos, índices e constraints. Consulte este skill antes de criar migrations, adicionar novos campos, ou entender como os dados se relacionam entre si. Inclui padrões de queries comuns e gotchas do Prisma com PostgreSQL.
---

# Schema do Banco de Dados - Referência Completa

## Conexão com Supabase

```env
# PgBouncer (connection pooling) - usado pelo Prisma Client
DATABASE_URL="postgresql://postgres.xxxxx:senha@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Conexão direta - usado pelo Prisma Migrate/Push
DIRECT_URL="postgresql://postgres.xxxxx:senha@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"
```

## Comandos de Schema

```bash
# Aplicar mudanças no schema (dev)
npx prisma db push

# Gerar Prisma Client após mudanças no schema
npx prisma generate

# Abrir Prisma Studio (UI visual do banco)
npx prisma studio

# Resetar banco (DANGER - apaga tudo)
npx prisma db push --force-reset
```

**⚠️ No Windows PowerShell, usar `npx.cmd` ao invés de `npx` caso haja erro de execução de scripts.**

## Models Completos

### User
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String                         // bcryptjs hash
  name          String
  phone         String?
  role          UserRole  @default(CUSTOMER)    // SUPER_ADMIN, PARTNER_ADMIN, TECHNICIAN, CUSTOMER
  tenantId      String?                         // null para SUPER_ADMIN
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relacionamentos
  tenant              Tenant?            @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  orders              Order[]            @relation("CustomerOrders")
  assignedOrders      Order[]            @relation("TechnicianOrders")
  technicianProfile   TechnicianProfile?
  serviceRecords      ServiceRecord[]

  @@index([tenantId])
  @@index([email])
  @@index([role])
}
```

**Notas:**
- User com role SUPER_ADMIN tem `tenantId = null`
- Um User PARTNER_ADMIN é o "dono" da loja (tenant)
- Um User TECHNICIAN tem também um TechnicianProfile (1:1)
- `passwordHash` é gerado com `bcryptjs.hash(password, 12)`

### Tenant
```prisma
model Tenant {
  id              String       @id @default(cuid())
  companyName     String
  cnpj            String       @unique
  subdomain       String       @unique              // Ex: "acme-seguranca"
  customDomain    String?      @unique              // Ex: "www.acmeloja.com.br"
  responsible     String                             // Nome do responsável
  phone           String
  email           String                             // Email admin do parceiro
  status          TenantStatus @default(TRIAL)       // TRIAL, ACTIVE, INACTIVE, SUSPENDED
  plan            TenantPlan   @default(FREE_TRIAL)  // FREE_TRIAL, BASIC, PROFESSIONAL, ENTERPRISE

  // Personalização da loja
  logo            String?
  favicon         String?
  primaryColor    String       @default("#6366f1")
  secondaryColor  String       @default("#818cf8")
  accentColor     String       @default("#06d6a0")
  bannerUrl       String?
  bannerTitle     String?
  bannerSubtitle  String?
  aboutText       String?

  // Endereço
  addressStreet   String?
  addressCity     String?
  addressState    String?
  addressZip      String?

  // Contato visível na loja
  publicPhone     String?
  publicEmail     String?

  trialEndsAt     DateTime?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  // Relacionamentos
  users           User[]
  products        Product[]
  orders          Order[]
  workingHours    WorkingHours[]
  schedules       Schedule[]
  coupons         Coupon[]

  @@index([subdomain])
  @@index([status])
}
```

### Product
```prisma
model Product {
  id                   String          @id @default(cuid())
  tenantId             String
  name                 String
  slug                 String                              // URL-safe, gerado com slugify()
  description          String?         @db.Text
  shortDescription     String?
  price                Decimal         @db.Decimal(10, 2)
  compareAtPrice       Decimal?        @db.Decimal(10, 2)  // "De R$ X" (preço riscado)
  images               String[]                             // Array de URLs
  category             ProductCategory @default(CFTV)
  estimatedDurationMin Int             @default(120)        // Duração estimada da instalação
  stock                Int             @default(0)          // Quantidade em estoque
  trackStock           Boolean         @default(false)      // Se true, controla estoque
  isActive             Boolean         @default(true)
  isFeatured           Boolean         @default(false)
  sortOrder            Int             @default(0)
  createdAt            DateTime        @default(now())
  updatedAt            DateTime        @updatedAt

  @@unique([tenantId, slug])
  @@index([tenantId])
  @@index([category])
  @@index([isActive])
}
```

### Order
```prisma
model Order {
  id                  String      @id @default(cuid())
  tenantId            String
  customerId          String?                             // Pode ser null (guest checkout)
  technicianId        String?                             // Atribuído depois pelo admin
  status              OrderStatus @default(PENDING_PAYMENT)
  totalAmount         Decimal     @db.Decimal(10, 2)      // Valor final (com desconto de cupom)

  // Mercado Pago
  mpPreferenceId      String?                             // ID da preference
  mpPaymentId         String?                             // ID do pagamento
  mpStatus            String?                             // approved, rejected, pending, etc.

  // Agendamento
  scheduledDate       DateTime?
  scheduledTimeStart  String?
  scheduledTimeEnd    String?

  // Dados do cliente (snapshot no pedido)
  customerName        String
  customerCpfEncrypted String                             // AES-256-GCM ciphertext
  customerEmail       String
  customerPhone       String

  // Endereço de instalação
  installAddress      String
  installNumber       String?
  installComplement   String?
  installNeighborhood String?
  installCity         String
  installState        String
  installZip          String

  notes               String?    @db.Text
  createdAt           DateTime   @default(now())
  updatedAt           DateTime   @updatedAt

  @@index([tenantId])
  @@index([status])
  @@index([customerId])
  @@index([technicianId])
  @@index([createdAt])
}
```

### Schedule
```prisma
model Schedule {
  id           String         @id @default(cuid())
  tenantId     String
  date         DateTime       @db.Date                  // Apenas data (sem hora)
  startTime    String                                    // "08:00"
  endTime      String                                    // "10:00"
  technicianId String?                                   // Atribuído pelo admin
  orderId      String?        @unique                    // Relação 1:1 com Order
  status       ScheduleStatus @default(AVAILABLE)
  createdAt    DateTime       @default(now())

  @@index([tenantId, date])
  @@index([status])
}
```

### ServiceRecord (NPS)
```prisma
model ServiceRecord {
  id              String    @id @default(cuid())
  orderId         String    @unique                      // 1:1 com Order
  technicianId    String
  checkInTime     DateTime?                              // Quando o técnico chegou
  checkOutTime    DateTime?                              // Quando o técnico finalizou
  photos          String[]                               // Fotos do serviço
  clientSignature String?                                // Assinatura digital (futuro)
  notes           String?   @db.Text
  reviewScore     Int?                                   // 1-5 estrelas (NPS)
  reviewComment   String?   @db.Text                     // Comentário do cliente
  createdAt       DateTime  @default(now())

  @@index([technicianId])
}
```

### Coupon
```prisma
model Coupon {
  id            String    @id @default(cuid())
  tenantId      String
  code          String                                   // "PROMO10", "BLACKFRIDAY"
  discountType  String                                   // "PERCENTAGE" ou "FIXED"
  discountValue Decimal   @db.Decimal(10, 2)             // 10.00 = 10% ou R$10
  maxUses       Int?                                     // null = ilimitado
  uses          Int       @default(0)                    // Incrementado na transaction
  isActive      Boolean   @default(true)
  expiresAt     DateTime?                                // null = sem expiração

  @@unique([tenantId, code])                             // Código único por tenant
  @@index([tenantId])
}
```

### Outros Models
- **OrderItem:** Items de um pedido (productId, productName, quantity, unitPrice)
- **ProductVariant:** Variantes de produto (nome, preço alternativo)
- **UpsellProduct:** Relação N:N de upsell entre produtos
- **WorkingHours:** Horários de funcionamento por dia da semana
- **TechnicianProfile:** Especialidades e info extra do técnico
- **ContactMessage:** Mensagens do formulário de contato da landing

## Queries Comuns

### Buscar pedidos do tenant com includes
```typescript
const orders = await prisma.order.findMany({
  where: { tenantId: tenant.id },
  include: {
    items: true,
    schedule: true,
    technician: true,
    serviceRecord: true,
  },
  orderBy: { createdAt: "desc" },
});
```

### Transaction atômica (checkout)
```typescript
const result = await prisma.$transaction(async (tx) => {
  // Todas as operações aqui são atômicas
  // Se qualquer throw ocorrer, tudo é revertido
  const order = await tx.order.create({ ... });
  await tx.product.update({ ... }); // Subtrai estoque
  return order;
});
```

### Buscar cupom por tenant + código
```typescript
const coupon = await prisma.coupon.findUnique({
  where: {
    tenantId_code: {        // Compound unique key
      tenantId: tenant.id,
      code: "PROMO10",
    },
  },
});
```
