import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || (session.user.role !== "PARTNER_ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: orderId } = await params;
    const { technicianId } = await req.json();

    const order = await prisma.order.findUnique({
      where: { id: orderId, tenantId: session.user.tenantId || undefined },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Assigning logic
    if (technicianId) {
      // Verify technician exists and belongs to the same tenant
      const tech = await prisma.user.findUnique({
        where: {
          id: technicianId,
          role: "TECHNICIAN",
          tenantId: session.user.tenantId || undefined,
        },
      });

      if (!tech) {
        return NextResponse.json({ error: "Técnico inválido ou não pertence a esta loja." }, { status: 400 });
      }

      await prisma.order.update({
        where: { id: orderId },
        data: { technicianId },
      });
      
      return NextResponse.json({ success: true, message: "Técnico atribuído com sucesso." });
    } else {
      // Unassign technician
      await prisma.order.update({
        where: { id: orderId },
        data: { technicianId: null },
      });
      
      return NextResponse.json({ success: true, message: "Técnico removido com sucesso." });
    }
  } catch (error) {
    console.error("[Assign Technician API] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
