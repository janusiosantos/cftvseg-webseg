import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TECHNICIAN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const technicianId = session.user.id;

    const schedules = await prisma.schedule.findMany({
      where: {
        order: { technicianId },
        status: { in: ["RESERVED", "CONFIRMED", "IN_PROGRESS", "COMPLETED"] },
      },
      include: {
        order: {
          include: { tenant: true },
        },
      },
      orderBy: { date: "asc" },
    });

    let icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//CFTVSEG//NONSGML v1.0//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Minha Agenda - Técnico",
      "X-WR-TIMEZONE:America/Sao_Paulo",
    ];

    schedules.forEach((schedule) => {
      const { order } = schedule;
      if (!order) return;

      const dateStr = schedule.date.toISOString().split("T")[0].replace(/-/g, ""); // YYYYMMDD
      const startStr = schedule.startTime.replace(":", "") + "00";
      const endStr = schedule.endTime ? schedule.endTime.replace(":", "") + "00" : String(parseInt(startStr) + 20000).padStart(6, '0'); // default +2 hours

      const uid = schedule.id + "@cftvseg.com";
      const summary = `Instalação - ${order.customerName} (${order.tenant.companyName})`;
      const description = `Pedido #${order.id.slice(-8).toUpperCase()}\\nCliente: ${order.customerName}\\nTelefone: ${order.customerPhone}\\nEndereço: ${order.installAddress}, ${order.installNumber || "S/N"} - ${order.installCity}/${order.installState}\\nStatus: ${schedule.status}`;
      const location = `${order.installAddress}, ${order.installNumber || "S/N"}, ${order.installCity} - ${order.installState}, ${order.installZip}, Brasil`;

      icsContent.push(
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
        `DTSTART;TZID=America/Sao_Paulo:${dateStr}T${startStr}`,
        `DTEND;TZID=America/Sao_Paulo:${dateStr}T${endStr}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        `LOCATION:${location}`,
        "END:VEVENT"
      );
    });

    icsContent.push("END:VCALENDAR");

    const responseText = icsContent.join("\r\n");

    return new NextResponse(responseText, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="agenda_tecnico.ics"',
      },
    });
  } catch (error) {
    console.error("[ICS API Error]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
