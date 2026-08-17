import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { hash } from "bcryptjs";

const tenantSchema = z.object({
  companyName: z.string().min(3),
  cnpj: z.string().min(14),
  subdomain: z.string().min(3).regex(/^[a-z0-9-]+$/),
  responsible: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(10),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = tenantSchema.parse(body);

    // Check if CNPJ or Subdomain already exists
    const existingTenant = await prisma.tenant.findFirst({
      where: {
        OR: [{ cnpj: data.cnpj }, { subdomain: data.subdomain }],
      },
    });

    if (existingTenant) {
      return NextResponse.json({ error: "CNPJ ou Subdomínio já estão em uso." }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "O e-mail do responsável já está em uso." }, { status: 400 });
    }

    // Default password for new Partner Admins
    const passwordHash = await hash("Lojista@123", 12);

    // Create Tenant and Admin User inside a transaction
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          companyName: data.companyName,
          cnpj: data.cnpj,
          subdomain: data.subdomain,
          responsible: data.responsible,
          email: data.email,
          phone: data.phone,
          status: "TRIAL",
          plan: "FREE_TRIAL",
          publicEmail: data.email,
          publicPhone: data.phone,
        },
      });

      const user = await tx.user.create({
        data: {
          name: data.responsible,
          email: data.email,
          phone: data.phone,
          passwordHash,
          role: "PARTNER_ADMIN",
          tenantId: tenant.id,
        },
      });

      // Seed default working hours for the new tenant
      const defaultWorkingHours = [
        { dayOfWeek: 1, startTime: "08:00", endTime: "18:00", maxCapacity: 3, tenantId: tenant.id },
        { dayOfWeek: 2, startTime: "08:00", endTime: "18:00", maxCapacity: 3, tenantId: tenant.id },
        { dayOfWeek: 3, startTime: "08:00", endTime: "18:00", maxCapacity: 3, tenantId: tenant.id },
        { dayOfWeek: 4, startTime: "08:00", endTime: "18:00", maxCapacity: 3, tenantId: tenant.id },
        { dayOfWeek: 5, startTime: "08:00", endTime: "18:00", maxCapacity: 3, tenantId: tenant.id },
      ];

      await tx.workingHours.createMany({ data: defaultWorkingHours });

      return { tenant, user };
    });

    return NextResponse.json({ success: true, tenantId: result.tenant.id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: (error as any).errors }, { status: 400 });
    }
    console.error("[Create Tenant API] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
