---
name: webseg-architecture
description: Guia completo da arquitetura multi-tenant do WebSeg SaaS. Explica como o middleware roteia subdomínios para /_sites/[subdomain], como a autenticação NextAuth v5 funciona com JWT e roles (SUPER_ADMIN, PARTNER_ADMIN, TECHNICIAN, CUSTOMER), como o Prisma isola dados por tenantId, e como as APIs são organizadas. Consulte este skill sempre que precisar entender o fluxo de request do sistema, criar novas rotas, ou modificar a lógica de roteamento.
---

# Arquitetura WebSeg - Guia Detalhado

## 1. Roteamento Multi-Tenant (middleware.ts)

O arquivo `middleware.ts` na raiz do projeto é responsável por todo o roteamento baseado em subdomínio.

### Modo Desenvolvimento (localhost)
```
http://localhost:3000/?tenant=acme → reescrita interna para /_sites/acme/
http://localhost:3000/admin/pedidos?tenant=acme → /_sites/acme/admin/pedidos
http://localhost:3000/tecnico?tenant=acme → /_sites/acme/tecnico
http://localhost:3000/super-admin → /super-admin (sem reescrita)
http://localhost:3000/login → /login (sem reescrita)
http://localhost:3000/api/products?tenant=acme → header x-tenant-subdomain: acme
```

### Modo Produção (subdomínios)
```
acme.opensoftware.com.br → /_sites/acme/
admin.opensoftware.com.br → /super-admin/
www.opensoftware.com.br → / (landing page)
cftveseg.opensoftware.com.br → / (landing page)
customdomain.com.br → /_sites/customdomain/ (custom domain)
```

### Identificação do Tenant nas APIs
O tenant é identificado de duas formas complementares:
1. **Header:** `x-tenant-subdomain` (setado pelo middleware)
2. **Query param:** `?tenant=subdomain` (fallback para dev mode)

Padrão em toda API Route:
```typescript
const tenantSubdomain = req.headers.get("x-tenant-subdomain") ||
  req.nextUrl.searchParams.get("tenant");
```

## 2. Autenticação (NextAuth v5)

### Configuração Principal: `src/lib/auth.ts`
- **Provider:** Credentials (email + senha)
- **Hash:** bcryptjs
- **Strategy:** JWT (não usa session no banco)
- **Expiration:** 30 dias
- **Páginas customizadas:** `/login`

### Campos Customizados na Session
```typescript
session.user.id            // cuid do User
session.user.role          // UserRole enum
session.user.tenantId      // ID do tenant (null para SUPER_ADMIN)
session.user.tenantSubdomain // subdomain do tenant
```

### Type Augmentation: `src/types/next-auth.d.ts`
O arquivo estende as interfaces `Session`, `User` e `JWT` do NextAuth para incluir `role`, `tenantId` e `tenantSubdomain`.

### Verificação de Tenant Ativo
No `authorize()`, se o usuário não é SUPER_ADMIN, o sistema verifica se o tenant está ACTIVE ou TRIAL. Tenants INACTIVE ou SUSPENDED bloqueiam login.

### Como Usar em Server Components
```typescript
import { auth } from "@/lib/auth";

export default async function Page() {
  const session = await auth();
  if (!session || session.user.role !== "PARTNER_ADMIN") redirect("/login");
  // session.user.tenantId disponível para queries
}
```

### Como Usar em API Routes
```typescript
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "PARTNER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const tenantId = session.user.tenantId;
  // ...
}
```

## 3. Banco de Dados (Prisma + Supabase)

### Conexão Pooling (Supabase)
O Supabase requer dois URLs distintos:
- `DATABASE_URL` → URL com PgBouncer (porta 6543) para connections via Prisma Client
- `DIRECT_URL` → URL direta (porta 5432) para migrations/introspections

### Singleton Pattern: `src/lib/prisma.ts`
O Prisma Client é instanciado como singleton para evitar múltiplas conexões em desenvolvimento (hot reload).

### Isolamento de Dados (CRÍTICO)
**TODA** query ao banco deve incluir `tenantId` na cláusula `where`. Isto é responsabilidade do desenvolvedor, não é automático. Exemplo:
```typescript
// ✅ CORRETO
const products = await prisma.product.findMany({
  where: { tenantId: tenant.id, isActive: true },
});

// ❌ INCORRETO (vaza dados entre tenants!)
const products = await prisma.product.findMany({
  where: { isActive: true },
});
```

### Campos Decimal do Prisma
Campos `@db.Decimal(10, 2)` retornam um objeto `Prisma.Decimal`, não um `number`. Sempre converter:
```typescript
const price = Number(product.price); // ✅
const total = product.price * 2;     // ❌ Erro de tipo
```

## 4. Organização das API Routes

### Padrão de API Route
```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const mySchema = z.object({ /* ... */ });

export async function POST(req: NextRequest) {
  try {
    // 1. Autenticação
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 2. Validação
    const body = await req.json();
    const data = mySchema.parse(body);

    // 3. Lógica de negócio
    const result = await prisma.myModel.create({ data: { ... } });

    // 4. Resposta
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: (error as any).errors }, { status: 400 });
    }
    console.error("[API] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### Nota sobre Zod v4
Na versão 4 do Zod, `ZodError.errors` não é uma propriedade nativa. Usar `(error as any).errors` como workaround.

## 5. Layout do Tenant (`_sites/[subdomain]/layout.tsx`)

O layout principal de cada loja:
1. Faz query ao banco para buscar o tenant pelo subdomain
2. Define CSS custom properties (variáveis) baseadas nas cores do tenant:
   ```css
   --store-primary: #6366f1;
   --store-secondary: #818cf8;
   --tenant-primary: #6366f1;
   ```
3. Renderiza header/footer da loja
4. Aplica `font-family: 'Inter'` via Google Fonts

## 6. Next.js 16 - Padrões Específicos

### Params são Promises
Em Server Components, `params` é uma `Promise`:
```typescript
// ✅ CORRETO (Next.js 16)
export default async function Page({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params;
}

// ❌ INCORRETO (Next.js 14 pattern)
export default async function Page({ params }: { params: { subdomain: string } }) {
  const { subdomain } = params; // TypeError!
}
```

### API Routes com Dynamic Params
```typescript
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
}
```
