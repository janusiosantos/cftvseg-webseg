---
name: webseg-dev-environment
description: Guia de configuração do ambiente de desenvolvimento, comandos de build, deploy na Vercel, e troubleshooting de erros comuns no Windows. Consulte este skill ao configurar o projeto pela primeira vez, ao resolver erros de build/TypeScript, ou ao preparar o deploy para produção.
---

# Ambiente de Desenvolvimento e Deploy

## Requisitos
- Node.js 18+ (LTS)
- PostgreSQL (via Supabase ou local)
- Windows 10/11 (PowerShell)

## Setup Inicial

```bash
# Clonar/acessar o projeto
cd C:\CFTVSEG\webseg

# Instalar dependências
npm.cmd install

# Copiar variáveis de ambiente
cp .env.example .env.local

# Gerar Prisma Client
npx.cmd prisma generate

# Aplicar schema no banco
npx.cmd prisma db push

# Iniciar dev server
npm.cmd run dev
```

## Comandos Úteis

```bash
# Desenvolvimento
npm.cmd run dev            # Inicia dev server (Turbopack)

# Build & Verificação
npm.cmd run build          # Build de produção + type check
npm.cmd run lint           # ESLint

# Prisma
npx.cmd prisma studio      # UI visual do banco
npx.cmd prisma db push     # Aplicar schema
npx.cmd prisma generate    # Gerar client types
npx.cmd prisma db pull     # Introspect schema existente

# Instalação de pacotes
npm.cmd install <pacote>   # Usar npm.cmd no PowerShell!
```

## ⚠️ Gotchas do Windows/PowerShell

### Erro: "A execução de scripts foi desabilitada"
```
npm : O arquivo C:\Program Files\nodejs\npm.ps1 não pode ser carregado porque a execução
de scripts foi desabilitada neste sistema.
```
**Solução:** Usar `npm.cmd` ao invés de `npm`. Isso bypass o arquivo .ps1 e usa o .cmd diretamente.

### Erro: "rm -rf" não funciona
```bash
# ❌ Não funciona no PowerShell
rm -rf node_modules

# ✅ Equivalente no PowerShell
Remove-Item -Recurse -Force node_modules
```

### Paths com colchetes (Next.js dynamic routes)
PowerShell interpreta `[` e `]` como wildcards. Ao manipular arquivos em pastas como `[subdomain]` ou `[id]`, use aspas ou backtick:
```bash
# ❌ Pode falhar
Get-Content src\app\_sites\[subdomain]\page.tsx

# ✅ Funciona
Get-Content "src\app\_sites\[subdomain]\page.tsx"
```

## Erros de TypeScript Comuns

### ZodError.errors não existe (Zod v4)
```typescript
// ❌ Zod v4 não tem .errors nativamente
if (error instanceof z.ZodError) {
  return NextResponse.json({ details: error.errors }); // TS Error!
}

// ✅ Workaround
if (error instanceof z.ZodError) {
  return NextResponse.json({ details: (error as any).errors });
}
```

### Prisma Decimal como número
```typescript
// ❌ Prisma Decimal não é number
const total = product.price * quantity; // Error!

// ✅ Converter explicitamente
const total = Number(product.price) * quantity;
```

### Next.js 16 params como Promise
```typescript
// ❌ Padrão antigo (Next.js 14)
export default async function Page({ params }: { params: { id: string } }) {
  const { id } = params; // TypeError!

// ✅ Padrão novo (Next.js 16)
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
```

### Propriedade faltando na interface (TenantData)
Se adicionar campos novos ao Tenant, lembrar de atualizar:
1. `prisma/schema.prisma` (model)
2. A query `select` onde o tenant é buscado
3. A interface TypeScript onde o objeto é passado como prop

## Estrutura de Build

```
npm.cmd run build
▲ Next.js 16.3.0 (Turbopack)
✓ Compiled successfully
  Running TypeScript ...            ← TypeCheck rigoroso
  Finished TypeScript
  Collecting page data ...
  Generating static pages (23/23)   ← Static pages geradas
  Finalizing page optimization

Route (app)
├ ○ /                              ← Static (Landing)
├ ○ /login                         ← Static
├ ƒ /api/checkout                  ← Dynamic (API)
├ ƒ /api/webhooks/mercadopago      ← Dynamic (Webhook)
└ ƒ /super-admin                   ← Dynamic (Auth)

○ = Static (pre-rendered)
ƒ = Dynamic (server-rendered on demand)
```

## Deploy na Vercel

### Configuração Necessária

1. **Framework:** Next.js (auto-detectado)
2. **Build Command:** `npm run build` (padrão)
3. **Output Directory:** `.next` (padrão)
4. **Node.js Version:** 18.x ou 20.x

### Variáveis de Ambiente na Vercel
Todas as variáveis do `.env` devem ser configuradas no dashboard da Vercel:
- `DATABASE_URL` → URL do Supabase com PgBouncer
- `DIRECT_URL` → URL direta do Supabase
- `NEXTAUTH_SECRET` → Gerar com `openssl rand -base64 32`
- `NEXTAUTH_URL` → `https://cftveseg.opensoftware.com.br`
- `AUTH_TRUST_HOST` → `true`
- `MERCADOPAGO_ACCESS_TOKEN` → Token de produção do MP
- `RESEND_API_KEY` → Key da Resend
- `ENCRYPTION_KEY` → Gerar com `openssl rand -hex 32`
- Todas as `NEXT_PUBLIC_*` variáveis

### Domínios na Vercel
```
opensoftware.com.br                → Landing page
*.opensoftware.com.br              → Wildcard para subdomains
cftveseg.opensoftware.com.br       → Landing page (root)
admin.opensoftware.com.br          → Super Admin
acme.opensoftware.com.br           → Tenant "acme"
```

**⚠️ Wildcard subdomain** (`*.opensoftware.com.br`) requer plano Pro da Vercel.

### Supabase
1. Criar projeto no Supabase (região sa-east-1 para menor latência)
2. Copiar as URLs de conexão (Database Settings → Connection String)
3. Usar a URL do PgBouncer (porta 6543) como `DATABASE_URL`
4. Usar a URL direta (porta 5432) como `DIRECT_URL`
5. Rodar `npx prisma db push` para criar as tabelas

### Mercado Pago (Produção)
1. Criar aplicação no Mercado Pago Developers
2. Configurar webhook URL: `https://cftveseg.opensoftware.com.br/api/webhooks/mercadopago`
3. Selecionar eventos: `payment` (Pagamentos)
4. Usar Access Token de PRODUÇÃO (não TEST)
5. Configurar `MERCADOPAGO_WEBHOOK_SECRET` para validação de assinatura

### Resend (Produção)
1. Configurar domínio verificado no Resend (`opensoftware.com.br`)
2. Adicionar registros DNS (SPF, DKIM, DMARC)
3. Usar API Key de produção
4. Configurar `RESEND_FROM_EMAIL=noreply@opensoftware.com.br`

## Testes Manuais

### Fluxo de Checkout (Dev)
1. Acessar `http://localhost:3000/?tenant=SUBDOMAIN`
2. Clicar em um produto → "Contratar"
3. Preencher dados (CPF válido: `529.982.247-25`)
4. Preencher endereço
5. Selecionar data/horário
6. Clicar "Pagar com Mercado Pago"
7. Usar cartão de teste do MP: `5031 4332 1540 6351`

### Fluxo Admin (Dev)
1. Login: `http://localhost:3000/login`
2. Email/senha do PARTNER_ADMIN
3. Acessar: `http://localhost:3000/admin?tenant=SUBDOMAIN`

### Fluxo Técnico (Dev)
1. Login com credenciais do TECHNICIAN
2. Acessar: `http://localhost:3000/tecnico?tenant=SUBDOMAIN`
