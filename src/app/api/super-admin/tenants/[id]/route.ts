import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { PLANS } from "@/lib/constants";

const updateSchema = z.object({
  status: z.enum(["TRIAL", "ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
  plan: z.enum(["FREE_TRIAL", "BASIC", "PROFESSIONAL", "ENTERPRISE"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);

    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.plan && { plan: data.plan }),
      },
    });

    return NextResponse.json({ success: true, tenant });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: (error as any).errors }, { status: 400 });
    }
    console.error("[Super Admin Tenant API] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
