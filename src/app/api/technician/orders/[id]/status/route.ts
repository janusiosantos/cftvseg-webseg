import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TECHNICIAN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: orderId } = await params;
    const { status } = await req.json();

    if (!["IN_PROGRESS", "COMPLETED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Verify if order belongs to this technician
    const order = await prisma.order.findUnique({
      where: { id: orderId, technicianId: session.user.id },
      include: { schedule: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found or not assigned to you" }, { status: 404 });
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    // Update schedule status
    if (order.schedule) {
      await prisma.schedule.update({
        where: { id: order.schedule.id },
        data: { status },
      });
    }

    // Upsert ServiceRecord
    if (status === "IN_PROGRESS") {
      await prisma.serviceRecord.upsert({
        where: { orderId: orderId },
        update: { checkInTime: new Date() },
        create: {
          orderId: orderId,
          technicianId: session.user.id,
          checkInTime: new Date(),
        },
      });
    } else if (status === "COMPLETED") {
      await prisma.serviceRecord.update({
        where: { orderId: orderId },
        data: { checkOutTime: new Date() },
      });

      // Send review email
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const reviewUrl = `${appUrl}/pedido/${order.id}/avaliar`;
      
      const { sendEmail } = await import("@/lib/resend");
      
      // We need tenant info for the email subject
      const fullOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: { tenant: true }
      });

      if (fullOrder) {
        await sendEmail({
          to: order.customerEmail,
          subject: `Como foi o serviço da ${fullOrder.tenant.companyName}?`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Olá, ${order.customerName}!</h2>
              <p>O técnico informou que a instalação do seu pedido <strong>#${order.id.slice(-8).toUpperCase()}</strong> foi concluída.</p>
              <p>Sua opinião é muito importante para mantermos a qualidade dos nossos serviços.</p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${reviewUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Avaliar o Atendimento
                </a>
              </div>
              <p>Obrigado por escolher a ${fullOrder.tenant.companyName}!</p>
            </div>
          `,
        });
      }
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error("[Technician Status API] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
