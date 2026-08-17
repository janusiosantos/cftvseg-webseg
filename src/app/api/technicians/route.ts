import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { hash } from "bcryptjs";
import { checkPlanLimit } from "@/lib/plan-limits";

const techSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(10),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || (session.user.role !== "PARTNER_ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "No tenant associated" }, { status: 403 });
    }

    const { allowed, limit } = await checkPlanLimit(tenantId, "technicians");
    if (!allowed) {
      return NextResponse.json(
        { error: `Limite do plano atingido. Seu plano permite até ${limit} técnicos.` },
        { status: 403 }
      );
    }

    const body = await req.json();
    const data = techSchema.parse(body);

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return NextResponse.json({ error: "Este e-mail já está em uso por outro usuário." }, { status: 400 });
    }

    // Default password for new technicians
    const passwordHash = await hash("Tecnico@123", 12);

    const tech = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash,
        role: "TECHNICIAN",
        tenantId,
      },
    });

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { companyName: true, subdomain: true, customDomain: true },
    });

    if (tenant) {
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "webseg.com.br";
      const loginUrl = tenant.customDomain 
        ? `https://${tenant.customDomain}/login`
        : `https://${tenant.subdomain}.${rootDomain}/login`;

      const { sendEmail, welcomeTechnicianEmail } = await import("@/lib/resend");
      
      try {
        await sendEmail({
          to: data.email,
          subject: `Bem-vindo à equipe da ${tenant.companyName}`,
          html: welcomeTechnicianEmail({
            technicianName: data.name,
            companyName: tenant.companyName,
            loginUrl,
            email: data.email,
            temporaryPassword: "Tecnico@123",
          }),
        });
      } catch (emailErr) {
        console.error("Erro ao enviar email para técnico:", emailErr);
      }
    }

    return NextResponse.json({ success: true, technicianId: tech.id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: (error as any).errors }, { status: 400 });
    }
    console.error("[Create Technician API] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
