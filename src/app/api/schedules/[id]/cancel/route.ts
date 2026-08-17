import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || (session.user.role !== "PARTNER_ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: scheduleId } = await params;

    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId, tenantId: session.user.tenantId || undefined },
    });

    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    // Cancel schedule (free the time slot) and remove the date from the order
    await prisma.$transaction([
      prisma.schedule.update({
        where: { id: scheduleId },
        data: {
          status: "AVAILABLE",
          orderId: null,
          technicianId: null,
        },
      }),
      prisma.order.update({
        where: { id: schedule.orderId! },
        data: {
          scheduledDate: null,
          scheduledTimeStart: null,
          scheduledTimeEnd: null,
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Cancel Schedule API] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
