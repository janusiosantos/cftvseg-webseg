import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { checkPlanLimit } from "@/lib/plan-limits";

const productSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  shortDescription: z.string().min(5),
  price: z.number().min(0),
  category: z.string().min(2),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  estimatedDurationMin: z.number().min(15).default(60),
  stock: z.number().min(0).default(0),
  trackStock: z.boolean().default(false),
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

    const { allowed, limit } = await checkPlanLimit(tenantId, "products");
    if (!allowed) {
      return NextResponse.json(
        { error: `Limite do plano atingido. Seu plano permite até ${limit} produtos.` },
        { status: 403 }
      );
    }

    const body = await req.json();
    const data = productSchema.parse(body);

    const product = await prisma.product.create({
      data: {
        tenantId,
        name: data.name,
        slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: data.description || "",
        shortDescription: data.shortDescription,
        price: data.price,
        category: data.category as any,
        images: data.imageUrl ? [data.imageUrl] : [],
        isActive: data.isActive,
        estimatedDurationMin: data.estimatedDurationMin,
        stock: data.stock,
        trackStock: data.trackStock,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: (error as any).errors }, { status: 400 });
    }
    console.error("[Products API POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
