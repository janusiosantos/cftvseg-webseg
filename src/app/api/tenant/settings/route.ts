import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const settingsSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  customDomain: z.string().optional().or(z.literal("")),
  logo: z.string().url().optional().or(z.literal("")),
  bannerUrl: z.string().url().optional().or(z.literal("")),
  publicPhone: z.string().optional(),
  publicEmail: z.string().email().optional().or(z.literal("")),
  aboutText: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || (session.user.role !== "PARTNER_ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "No tenant associated" }, { status: 403 });
    }

    const body = await req.json();
    const data = settingsSchema.parse(body);

    // Validate custom domain if provided
    if (data.customDomain) {
      // Very basic validation - must have at least one dot and not be localhost
      if (!data.customDomain.includes(".") || data.customDomain.includes("localhost")) {
        return NextResponse.json({ error: "Domínio personalizado inválido" }, { status: 400 });
      }

      // Check if another tenant is already using this domain
      const existing = await prisma.tenant.findUnique({
        where: { customDomain: data.customDomain },
      });

      if (existing && existing.id !== tenantId) {
        return NextResponse.json({ error: "Este domínio já está em uso por outro parceiro" }, { status: 400 });
      }
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        customDomain: data.customDomain || null,
        logo: data.logo || null,
        bannerUrl: data.bannerUrl || null,
        publicPhone: data.publicPhone || null,
        publicEmail: data.publicEmail || null,
        aboutText: data.aboutText || null,
      },
    });

    return NextResponse.json({ success: true, tenant: updatedTenant });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: (error as any).errors }, { status: 400 });
    }
    console.error("[Tenant Settings API] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
