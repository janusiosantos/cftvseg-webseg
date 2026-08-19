# WebSeg - Memória do Projeto (AGENTS.md)

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# 📋 Visão Geral do Projeto

**Nome:** WebSeg (CFTV e Segurança)  
**Tipo:** SaaS Multi-Tenant para lojas de segurança eletrônica (CFTV, alarmes, cercas elétricas)  
**Domínio:** `opensoftware.com.br`  
**Stack:** Next.js 16.3.0 + Prisma + PostgreSQL (Supabase) + Mercado Pago + Resend  
**Repositório Local:** `C:\CFTVSEG\webseg`  
**Deploy Target:** Vercel + Supabase (PostgreSQL)

---

## 🏗️ Arquitetura Multi-Tenant

O sistema usa **subdomain-based routing** em produção e **query param** (`?tenant=subdomain`) em desenvolvimento.

### Roteamento (proxy.ts)
- **Dev (localhost):** `?tenant=acme` → reescrita para `/[subdomain]/...`
- **Prod:** `acme.opensoftware.com.br` → reescrita para `/[subdomain]/...`
- **Custom Domain:** `www.acmeloja.com.br` → reescrita para `/[subdomain]/...`
- **Admin:** `admin.opensoftware.com.br` → `/super-admin/...`
- **Root:** `cftveseg.opensoftware.com.br` ou `www.opensoftware.com.br` → Landing Page (/)

### Hierarquia de Roles
```
SUPER_ADMIN → Dono da plataforma WebSeg. Gerencia todos os tenants.
PARTNER_ADMIN → Lojista/Parceiro. Cada um tem seu tenant (loja).
TECHNICIAN → Técnico de campo. Vinculado a um tenant.
CUSTOMER → Cliente final (placeholder, não faz login hoje).
```

---

## 📁 Estrutura de Diretórios Detalhada

```
c:\CFTVSEG\webseg\
├── prisma/schema.prisma            # Schema do banco de dados
├── src/
│   ├── proxy.ts                    # Roteamento multi-tenant
│   ├── app/
│   │   ├── (landing)/              # Landing page institucional (grupo de rota)
│   │   ├── page.tsx                # Landing page principal (/)
│   │   ├── globals.css             # CSS global do app
│   │   ├── landing.css             # CSS específico da landing page
│   │   ├── layout.tsx              # Layout raiz
│   │   ├── login/                  # Página de login (/login)
│   │   ├── super-admin/            # Painel do Super Admin
│   │   │   ├── page.tsx            # Dashboard principal
│   │   │   ├── parceiros/          # CRUD de parceiros/tenants
│   │   │   │   └── novo/           # Formulário de criação
│   │   ├── [subdomain]/            # ★ ROTAS DO TENANT (core do SaaS)
│   │   │   ├── layout.tsx          # Layout da loja (CSS vars com cores do tenant)
│   │   │   ├── page.tsx            # Vitrine/catálogo de produtos
│   │   │   ├── produto/[slug]/     # Página de detalhe do produto
│   │   │   ├── checkout/           # Checkout com steps wizard
│   │   │   │   ├── page.tsx        # Formulário multi-step + cupom
│   │   │   │   └── success/        # Pós-checkout
│   │   │   ├── sucesso/            # Página de sucesso (MP redirect)
│   │   │   ├── pedido/[id]/        # Tracking do pedido pelo cliente
│   │   │   │   └── avaliar/        # Página pública de avaliação NPS
│   │   │   ├── admin/              # ★ Painel Admin do Parceiro
│   │   │   │   ├── layout.tsx      # Sidebar com navegação
│   │   │   │   ├── page.tsx        # Dashboard com métricas
│   │   │   │   ├── pedidos/        # Lista/gerenciamento de pedidos
│   │   │   │   ├── produtos/       # CRUD de produtos
│   │   │   │   │   ├── novo/       # Formulário de criação
│   │   │   │   │   └── editar/     # Formulário de edição
│   │   │   │   ├── tecnicos/       # CRUD de técnicos
│   │   │   │   ├── agenda/         # Visualização de agenda
│   │   │   │   ├── cupons/         # Gerenciamento de cupons
│   │   │   │   └── configuracoes/  # Configurações da loja (cores, logo, etc.)
│   │   │   └── tecnico/            # ★ App do Técnico (mobile-first)
│   │   │       ├── layout.tsx      # Layout mobile com bottom nav
│   │   │       ├── page.tsx        # Dashboard com serviços do dia
│   │   │       ├── historico/      # Histórico de serviços
│   │   │       └── perfil/         # Perfil do técnico
│   │   └── api/                    # ★ API Routes
│   │       ├── auth/[...nextauth]/ # NextAuth.js handlers
│   │       ├── checkout/           # POST: cria pedido + preference MP
│   │       ├── coupons/            # CRUD de cupons + validação
│   │       ├── orders/[id]/assign/ # Atribuição de técnico a pedido
│   │       ├── partners/           # CRUD de parceiros (super admin)
│   │       ├── products/           # CRUD de produtos
│   │       ├── reviews/            # POST: registrar avaliação NPS
│   │       ├── schedule/slots/     # GET: slots disponíveis
│   │       ├── schedules/[id]/cancel/ # POST: cancelar agendamento
│   │       ├── super-admin/tenants/   # CRUD de tenants (super admin)
│   │       ├── technician/         # APIs do técnico
│   │       │   ├── orders/[id]/status/ # PATCH: atualizar status
│   │       │   ├── profile/        # GET/PATCH: perfil do técnico
│   │       │   └── calendar.ics/   # GET: exportação .ics
│   │       ├── technicians/        # CRUD de técnicos (admin)
│   │       ├── tenant/settings/    # PATCH: configurações do tenant
│   │       ├── webhooks/mercadopago/ # POST: webhook do Mercado Pago
│   │       └── contact/            # POST: formulário de contato
│   ├── lib/                        # Bibliotecas compartilhadas
│   │   ├── auth.ts                 # Configuração NextAuth v5
│   │   ├── constants.ts            # Planos, categorias, status labels
│   │   ├── cpf.ts                  # Encrypt/decrypt/validate CPF (AES-256-GCM)
│   │   ├── plan-limits.ts          # Verificação de limites por plano
│   │   ├── prisma.ts               # Singleton do Prisma Client
│   │   ├── resend.ts               # Envio de emails + templates HTML
│   │   ├── tenant.ts               # Helpers para resolução de tenant
│   │   └── utils.ts                # Funções utilitárias (slug, formatação, etc.)
│   └── types/
│       └── next-auth.d.ts          # Extensão dos tipos do NextAuth
```

---

## 🗃️ Schema do Banco de Dados (Prisma)

### Models e Relacionamentos
```
User (1:N) ←→ Tenant
  ├── orders (Customer relation)
  ├── assignedOrders (Technician relation)
  ├── technicianProfile (1:1)
  └── serviceRecords (1:N)

Tenant (1:N) ←→ User, Product, Order, WorkingHours, Schedule, Coupon

Product (1:N) ←→ OrderItem, ProductVariant, UpsellProduct
  ├── stock: Int (gestão de estoque físico)
  └── trackStock: Boolean (flag para habilitar controle)

Order (1:1) ←→ Schedule, ServiceRecord
  ├── items: OrderItem[]
  ├── customerCpfEncrypted: String (AES-256-GCM)
  └── mpPreferenceId / mpPaymentId / mpStatus (Mercado Pago)

ServiceRecord (1:1) ←→ Order
  ├── checkInTime / checkOutTime (registro do técnico)
  ├── reviewScore: Int? (1-5 estrelas, NPS)
  └── reviewComment: String? (feedback do cliente)

Coupon (N:1) ←→ Tenant
  ├── discountType: "PERCENTAGE" | "FIXED"
  ├── maxUses: Int? (limite de usos)
  └── uses: Int (contador incrementado na transação)
```

### Enums Importantes
- **UserRole:** SUPER_ADMIN, PARTNER_ADMIN, TECHNICIAN, CUSTOMER
- **TenantStatus:** TRIAL, ACTIVE, INACTIVE, SUSPENDED
- **TenantPlan:** FREE_TRIAL, BASIC, PROFESSIONAL, ENTERPRISE
- **OrderStatus:** PENDING_PAYMENT → PAID → SCHEDULED → IN_PROGRESS → COMPLETED (ou CANCELLED/REFUNDED)
- **ScheduleStatus:** AVAILABLE → RESERVED → CONFIRMED → IN_PROGRESS → COMPLETED (ou CANCELLED)

---

## 💳 Fluxo de Checkout (Crítico)

### Sequência Completa
```
1. Cliente seleciona produto na vitrine
2. Preenche dados pessoais (CPF validado) → Step 1
3. Preenche endereço de instalação → Step 2
4. Escolhe data/horário + aplica cupom → Step 3
5. POST /api/checkout (dentro de prisma.$transaction):
   a. Verifica capacidade do slot (WorkingHours.maxCapacity)
   b. Cria Order (status: PENDING_PAYMENT)
   c. Cria Schedule (status: RESERVED)
   d. Subtrai stock (se trackStock = true, com double-check)
   e. Incrementa uses do Coupon (se aplicável)
   f. Cria Preference no Mercado Pago
6. Redireciona para checkout do Mercado Pago (init_point)
7. MP processa pagamento e envia webhook
```

### Webhook do Mercado Pago (POST /api/webhooks/mercadopago)
```
status === "approved":
  → Order.status = SCHEDULED (se tem data) ou PAID
  → Schedule.status = CONFIRMED
  → Envia email de confirmação ao cliente
  → Envia email de notificação ao parceiro

status === "rejected" | "cancelled":
  → Order.status = CANCELLED
  → Schedule.status = CANCELLED
  → Restaura stock dos produtos (loop nos items)
  → (cupom NÃO é decrementado no cancel - decisão de design)

status === outros (pending, etc.):
  → Apenas atualiza mpPaymentId e mpStatus
```

### ⚠️ Regras de Negócio Críticas
- **Estoque é subtraído no checkout** (PENDING_PAYMENT), não na aprovação, para evitar overselling.
- **Estoque é devolvido** apenas se o pagamento for rejected/cancelled via webhook.
- **Double-check de estoque** dentro da transaction para prevenir race conditions.
- **Validação de slot** verifica `maxCapacity` da WorkingHours antes de criar schedule.
- **Cupom é validado** antes da transação e o `uses` é incrementado dentro dela.

---

## 🔐 Autenticação e Segurança

### NextAuth v5 (Auth.js)
- **Provider:** Credentials (email + senha com bcryptjs)
- **Strategy:** JWT (30 dias de expiração)
- **Páginas:** `/login` (sign in e error)
- **Session Custom Fields:** `id`, `role`, `tenantId`, `tenantSubdomain`
- **Type Extensions:** `src/types/next-auth.d.ts`

### Proteção de CPF (LGPD)
- **Algoritmo:** AES-256-GCM
- **Formato:** `iv:tag:encrypted` (hex)
- **Chave:** `ENCRYPTION_KEY` (32 bytes hex em .env)
- **Mascaramento:** `***.456.789-**` para exibição

### Proteção de Rotas
- **Admin:** Verificação de `session.user.role` in `["PARTNER_ADMIN", "SUPER_ADMIN"]`
- **Técnico:** Verificação de `session.user.role === "TECHNICIAN"`
- **Super Admin:** Verificação de `session.user.role === "SUPER_ADMIN"`
- **Tenant Isolation:** Todas as queries filtram por `tenantId`

---

## 📧 Sistema de E-mails (Resend)

### Templates Disponíveis (src/lib/resend.ts)
1. **orderConfirmationEmail** - Confirmação de pedido pago
2. **welcomePartnerEmail** - Boas-vindas ao novo parceiro (com credenciais)
3. **scheduleConfirmationEmail** - Confirmação de agendamento
4. **welcomeTechnicianEmail** - Boas-vindas ao novo técnico (com credenciais)
5. **Review Email** - Disparado inline no `technician/orders/[id]/status/route.ts` quando status = COMPLETED

### Configuração
```env
RESEND_API_KEY=re_xxxx
RESEND_FROM_EMAIL=noreply@opensoftware.com.br
```

---

## 📦 Dependências Principais

| Pacote | Versão | Uso |
|--------|--------|-----|
| next | 16.3.0 | Framework principal |
| react / react-dom | 19.2.8 | UI |
| @prisma/client | ^5.22.0 | ORM / DB |
| next-auth | ^5.0.0-beta.32 | Autenticação |
| mercadopago | ^3.3.0 | SDK do Mercado Pago |
| resend | ^6.18.1 | Envio de e-mails |
| zod | ^4.4.3 | Validação de schemas |
| bcryptjs | ^3.0.3 | Hash de senhas |
| lucide-react | ^1.31.0 | Ícones |
| sharp | ^0.35.3 | Processamento de imagens |
| date-fns | ^4.4.0 | Manipulação de datas |

---

## 🔧 Variáveis de Ambiente Necessárias

```env
# Banco de Dados (Supabase)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."  # Connection pooling do Supabase

# NextAuth
NEXTAUTH_URL="https://cftveseg.opensoftware.com.br"
NEXTAUTH_SECRET="..."
AUTH_TRUST_HOST=true

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN="..."
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY="..."
MERCADOPAGO_WEBHOOK_SECRET="..." (opcional, para validar assinatura)

# Resend
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="noreply@opensoftware.com.br"

# App
NEXT_PUBLIC_ROOT_DOMAIN="opensoftware.com.br"
NEXT_PUBLIC_APP_NAME="WebSeg"
NEXT_PUBLIC_APP_URL="https://cftveseg.opensoftware.com.br"

# Segurança
ENCRYPTION_KEY="..." (32 bytes hex para AES-256-GCM do CPF)
```

---

## 📊 Planos e Limites

| Plano | Preço | Produtos | Técnicos |
|-------|-------|----------|----------|
| FREE_TRIAL | R$ 0 (14 dias) | 3 | 1 |
| BASIC | R$ 99/mês | 5 | 1 |
| PROFESSIONAL | R$ 199/mês | ∞ | ∞ |
| ENTERPRISE | Sob consulta | ∞ | ∞ |

Limites verificados em `src/lib/plan-limits.ts` via `checkPlanLimit()`.

---

## 🎯 Funcionalidades Implementadas

### Fase 1-3: Core
- [x] Landing Page institucional com planos
- [x] Login com NextAuth Credentials
- [x] CRUD de Tenants (Super Admin)
- [x] Multi-tenant routing (subdomain + query param)

### Fase 4: Loja do Parceiro
- [x] Vitrine de produtos personalizada por tenant
- [x] Página de detalhe do produto
- [x] CRUD de produtos com categorias, imagens e variantes

### Fase 5: Checkout + Mercado Pago
- [x] Checkout multi-step (dados → endereço → agendamento)
- [x] Integração com Mercado Pago (Preference API)
- [x] Webhook de pagamento com envio de emails
- [x] Validação de CPF (algoritmo + criptografia AES-256-GCM)

### Fase 6: Agendamento
- [x] WorkingHours configuráveis por dia da semana
- [x] Geração dinâmica de slots disponíveis
- [x] Prevenção de overbooking (maxCapacity check em transaction)
- [x] Cancelamento de agendamento com liberação de slot

### Fase 7: App do Técnico
- [x] Dashboard mobile-first com serviços do dia
- [x] Check-in / Check-out (ServiceRecord)
- [x] Histórico de serviços
- [x] Perfil do técnico editável
- [x] Painel Admin: gerenciamento de equipe e atribuição de pedidos

### Fase 8: Recursos Avançados
- [x] Gestão de estoque físico (stock/trackStock)
- [x] Cupons de desconto (PERCENTAGE / FIXED, com limites)
- [x] Avaliação do Técnico (NPS 1-5 estrelas + comentário)
- [x] Email automático pós-serviço convidando para avaliação
- [x] Exportação .ics para Google Calendar (agenda do técnico)

---

## ⚠️ Regras e Padrões do Projeto

1. **PowerShell no Windows:** Use `npm.cmd` ao invés de `npm`. O comando `rm -rf` não funciona; use `Remove-Item -Recurse -Force`.
2. **Zod v4:** A propriedade `.errors` não existe diretamente no `ZodError`. Usar `(error as any).errors` como workaround.
3. **Next.js 16 params:** Em Server Components, `params` é uma `Promise`. Usar `const { subdomain } = await params;`.
4. **Prisma Decimal:** Campos `Decimal` retornam objetos do Prisma. Sempre converter com `Number()` antes de cálculos.
5. **Tailwind NÃO é usado:** O projeto usa CSS vanilla (`globals.css`, `landing.css`) e classes inline do estilo utilitário.
6. **Multi-tenant isolation:** TODA query ao banco DEVE filtrar por `tenantId` para garantir isolamento de dados.
7. **Autenticação:** Usar `await auth()` do `@/lib/auth` para obter a sessão em Server Components e API Routes.
8. **Validação de CPF:** Sempre validar no frontend (`@/lib/cpf`) E no backend (`/api/checkout`).

---

## 🚀 Próximos Passos (Pendentes)

1. **Deploy na Vercel** - Configurar projeto, variáveis de ambiente e domínio `opensoftware.com.br`
2. **Supabase** - Configurar PostgreSQL com connection pooling (DATABASE_URL e DIRECT_URL)
3. **Ranking de Técnicos** - Exibir média de avaliações NPS no painel admin
4. **Notificações Push** - PWA notifications para técnicos
5. **Relatórios Financeiros** - Gráficos de faturamento por período
6. **Busca de CEP (ViaCEP)** - Auto-preencher endereço no checkout
