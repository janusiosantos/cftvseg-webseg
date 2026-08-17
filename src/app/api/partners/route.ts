import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hash } from "bcryptjs";
import { z } from "zod";
import { generatePassword, onlyDigits } from "@/lib/utils";
import { sendEmail, welcomePartnerEmail } from "@/lib/resend";

const createPartnerSchema = z.object({
  companyName: z.string().min(2),
  cnpj: z.string().min(14),
  responsible: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  subdomain: z.string().min(3).max(30).regex(/^[a-z0-9-]+$/),
  plan: z.enum(["FREE_TRIAL", "BASIC", "PROFESSIONAL", "ENTERPRISE"]),
});

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const partners = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { orders: true, products: true } },
    },
  });

  return NextResponse.json(partners);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = createPartnerSchema.parse(body);

    // Check if subdomain already exists
    const existing = await prisma.tenant.findUnique({
      where: { subdomain: data.subdomain },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Subdomínio já está em uso." },
        { status: 400 }
      );
    }

    // Check if CNPJ already exists
    const cnpjClean = onlyDigits(data.cnpj);
    const existingCnpj = await prisma.tenant.findUnique({
      where: { cnpj: cnpjClean },
    });

    if (existingCnpj) {
      return NextResponse.json(
        { error: "CNPJ já cadastrado na plataforma." },
        { status: 400 }
      );
    }

    // Generate temporary password
    const tempPassword = generatePassword(10);
    const passwordHash = await hash(tempPassword, 12);

    // Create tenant and admin user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          companyName: data.companyName,
          cnpj: cnpjClean,
          subdomain: data.subdomain,
          responsible: data.responsible,
          phone: onlyDigits(data.phone),
          email: data.email,
          plan: data.plan,
          status: data.plan === "FREE_TRIAL" ? "TRIAL" : "ACTIVE",
          trialEndsAt:
            data.plan === "FREE_TRIAL"
              ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
              : null,
        },
      });

      // Create admin user for the partner
      const adminUser = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          name: data.responsible,
          phone: onlyDigits(data.phone),
          role: "PARTNER_ADMIN",
          tenantId: tenant.id,
          isActive: true,
        },
      });

      // Create default working hours (Mon-Fri 8h-18h)
      const days = [1, 2, 3, 4, 5]; // Mon to Fri
      for (const day of days) {
        await tx.workingHours.create({
          data: {
            tenantId: tenant.id,
            dayOfWeek: day,
            startTime: "08:00",
            endTime: "18:00",
            slotDurationMin: 120,
            maxCapacity: 1,
          },
        });
      }

      return { tenant, adminUser };
    });

    // Send welcome email (async, don't block response)
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "opensoftware.com.br";
    sendEmail({
      to: data.email,
      subject: `🎉 Bem-vindo ao WebSeg, ${data.responsible}!`,
      html: welcomePartnerEmail({
        responsibleName: data.responsible,
        companyName: data.companyName,
        subdomain: data.subdomain,
        email: data.email,
        temporaryPassword: tempPassword,
        rootDomain,
      }),
    }).catch((err) => console.error("[Partners API] Email error:", err));

    return NextResponse.json(
      {
        success: true,
        partner: result.tenant,
        credentials: {
          email: data.email,
          temporaryPassword: tempPassword,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: (error as any).errors },
        { status: 400 }
      );
    }
    console.error("[Partners API] Error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
