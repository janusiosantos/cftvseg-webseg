import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tenantSubdomain = req.headers.get("x-tenant-subdomain") ||
    req.nextUrl.searchParams.get("tenant");

  if (!tenantSubdomain) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { subdomain: tenantSubdomain },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const product = await prisma.product.findFirst({
    where: { id, tenantId: tenant.id },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "PARTNER_ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const data = productSchema.parse(body);

    const existing = await prisma.product.findUnique({
      where: { id, tenantId: session.user.tenantId || undefined },
    });
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
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

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: (error as any).errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "PARTNER_ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.product.findUnique({
      where: { id, tenantId: session.user.tenantId || undefined },
    });
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
