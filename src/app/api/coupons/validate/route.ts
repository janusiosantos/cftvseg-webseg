import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const tenantSubdomain = req.headers.get("x-tenant-subdomain") ||
      req.nextUrl.searchParams.get("tenant");

    const code = req.nextUrl.searchParams.get("code");

    if (!tenantSubdomain || !code) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { subdomain: tenantSubdomain },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { tenantId_code: { tenantId: tenant.id, code: code.toUpperCase() } },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Cupom inválido." }, { status: 404 });
    }

    if (!coupon.isActive) {
      return NextResponse.json({ error: "Cupom inativo." }, { status: 400 });
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Cupom expirado." }, { status: 400 });
    }

    if (coupon.maxUses && coupon.uses >= coupon.maxUses) {
      return NextResponse.json({ error: "Limite de uso do cupom esgotado." }, { status: 400 });
    }

    return NextResponse.json({
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
