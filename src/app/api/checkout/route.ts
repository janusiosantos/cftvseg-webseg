import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { encryptCpf, validateCpf } from "@/lib/cpf";
import { onlyDigits } from "@/lib/utils";
import { MercadoPagoConfig, Preference } from "mercadopago";

const checkoutSchema = z.object({
  productId: z.string(),
  quantity: z.number().min(1, "A quantidade deve ser maior que zero").default(1),
  customerName: z.string().min(2),
  customerCpf: z.string().min(11),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(10),
  installAddress: z.string().min(3),
  installNumber: z.string().optional(),
  installComplement: z.string().optional(),
  installNeighborhood: z.string().optional(),
  installCity: z.string().min(2),
  installState: z.string().length(2),
  installZip: z.string().min(8),
  scheduledDate: z.string(),
  scheduledTimeStart: z.string().optional(),
  scheduledTimeEnd: z.string().optional(),
  couponCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
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

    if (tenant.status !== "ACTIVE" && tenant.status !== "TRIAL") {
      return NextResponse.json({ error: "Loja suspensa ou inativa." }, { status: 403 });
    }

    const body = await req.json();
    const data = checkoutSchema.parse(body);

    // Validate CPF
    const cpfClean = onlyDigits(data.customerCpf);
    if (!validateCpf(cpfClean)) {
      return NextResponse.json({ error: "CPF inválido" }, { status: 400 });
    }

    // Get product
    const product = await prisma.product.findFirst({
      where: { id: data.productId, tenantId: tenant.id, isActive: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    if (product.trackStock && product.stock < data.quantity) {
      return NextResponse.json({ error: "Estoque insuficiente para este produto." }, { status: 409 });
    }

    let totalAmount = Number(product.price) * data.quantity;
    
    // Validate and Apply Coupon
    let coupon = null;
    if (data.couponCode) {
      coupon = await prisma.coupon.findUnique({
        where: { tenantId_code: { tenantId: tenant.id, code: data.couponCode } },
      });
      
      if (coupon && coupon.isActive) {
        let isValid = true;
        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) isValid = false;
        if (coupon.maxUses && coupon.uses >= coupon.maxUses) isValid = false;
        
        if (isValid) {
          if (coupon.discountType === "PERCENTAGE") {
            totalAmount = totalAmount - (totalAmount * (Number(coupon.discountValue) / 100));
          } else {
            totalAmount = Math.max(0, totalAmount - Number(coupon.discountValue));
          }
        } else {
          coupon = null; // invalid coupon
        }
      } else {
        coupon = null;
      }
    }

    // Use interactive transaction to prevent overbooking and overselling
    const { order, schedule } = await prisma.$transaction(async (tx) => {
      // 1. Verify capacity if scheduling
      if (data.scheduledDate && data.scheduledTimeStart) {
        const dateObj = new Date(data.scheduledDate);
        const dayOfWeek = dateObj.getDay();

        const workingHours = await tx.workingHours.findFirst({
          where: { tenantId: tenant.id, dayOfWeek },
        });

        if (!workingHours) {
          throw new Error("UNAVAILABLE_DAY");
        }

        const existingCount = await tx.schedule.count({
          where: {
            tenantId: tenant.id,
            date: dateObj,
            startTime: data.scheduledTimeStart,
            status: { in: ["RESERVED", "CONFIRMED", "IN_PROGRESS"] },
          },
        });

        if (existingCount >= workingHours.maxCapacity) {
          throw new Error("SLOT_FULL");
        }
      }

      // 2. Create order
      const newOrder = await tx.order.create({
        data: {
          tenantId: tenant.id,
          status: "PENDING_PAYMENT",
          totalAmount,
          customerName: data.customerName,
          customerCpfEncrypted: encryptCpf(cpfClean),
          customerEmail: data.customerEmail,
          customerPhone: onlyDigits(data.customerPhone),
          installAddress: data.installAddress,
          installNumber: data.installNumber || null,
          installComplement: data.installComplement || null,
          installNeighborhood: data.installNeighborhood || null,
          installCity: data.installCity,
          installState: data.installState.toUpperCase(),
          installZip: onlyDigits(data.installZip),
          scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
          scheduledTimeStart: data.scheduledTimeStart || null,
          scheduledTimeEnd: data.scheduledTimeEnd || null,
          items: {
            create: {
              productId: product.id,
              productName: product.name,
              quantity: data.quantity,
              unitPrice: product.price,
            },
          },
        },
      });

      // 3. Create schedule slot
      let newSchedule = null;
      if (data.scheduledDate && data.scheduledTimeStart) {
        newSchedule = await tx.schedule.create({
          data: {
            tenantId: tenant.id,
            date: new Date(data.scheduledDate),
            startTime: data.scheduledTimeStart,
            endTime: data.scheduledTimeEnd || "",
            orderId: newOrder.id,
            status: "RESERVED",
          },
        });
      }

      // 4. Subtract stock
      if (product.trackStock) {
        // Double check stock to prevent race conditions
        const currentProduct = await tx.product.findUnique({ where: { id: product.id } });
        if (!currentProduct || currentProduct.stock < data.quantity) {
          throw new Error("OUT_OF_STOCK");
        }
        await tx.product.update({
          where: { id: product.id },
          data: { stock: currentProduct.stock - data.quantity },
        });
      }

      // 5. Increment coupon usage
      if (coupon) {
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { uses: { increment: 1 } },
        });
      }

      return { order: newOrder, schedule: newSchedule };
    });

    // Create Mercado Pago preference
    const mpClient = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    });

    const preference = new Preference(mpClient);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const result = await preference.create({
      body: {
        items: [
          {
            id: product.id,
            title: `${product.name} - ${tenant.companyName}`,
            unit_price: totalAmount,
            quantity: 1,
            currency_id: "BRL",
          },
        ],
        payer: {
          name: data.customerName,
          email: data.customerEmail,
          identification: {
            type: "CPF",
            number: cpfClean,
          },
        },
        back_urls: {
          success: `${appUrl}/sucesso?tenant=${tenantSubdomain}&order=${order.id}`,
          failure: `${appUrl}/checkout?tenant=${tenantSubdomain}&product=${data.productId}&error=payment`,
          pending: `${appUrl}/sucesso?tenant=${tenantSubdomain}&order=${order.id}&status=pending`,
        },
        auto_return: "approved",
        external_reference: order.id,
        notification_url: `${appUrl}/api/webhooks/mercadopago`,
        statement_descriptor: "WEBSEG",
      },
    });

    // Update order with MP preference ID
    await prisma.order.update({
      where: { id: order.id },
      data: {
        mpPreferenceId: result.id || null,
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      preferenceId: result.id,
      initPoint: result.init_point,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAVAILABLE_DAY") {
      return NextResponse.json({ error: "Dia indisponível para instalação." }, { status: 400 });
    }
    if (error instanceof Error && error.message === "SLOT_FULL") {
      return NextResponse.json({ error: "Horário esgotado! Por favor, escolha outro." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "OUT_OF_STOCK") {
      return NextResponse.json({ error: "Estoque esgotado no momento da compra." }, { status: 409 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: (error as any).errors },
        { status: 400 }
      );
    }
    console.error("[Checkout API] Error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
