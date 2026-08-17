import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addDays, format } from "date-fns";

export async function GET(req: NextRequest) {
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

  // Get working hours config
  const workingHours = await prisma.workingHours.findMany({
    where: { tenantId: tenant.id },
    orderBy: { dayOfWeek: "asc" },
  });

  if (workingHours.length === 0) {
    return NextResponse.json([]);
  }

  // Get existing reservations for next 30 days
  const today = new Date();
  const endDate = addDays(today, 30);

  const existingSchedules = await prisma.schedule.findMany({
    where: {
      tenantId: tenant.id,
      date: { gte: today, lte: endDate },
      status: { in: ["RESERVED", "CONFIRMED", "IN_PROGRESS"] },
    },
  });

  // Generate available slots
  const slots: { date: string; startTime: string; endTime: string; dateFormatted: string }[] = [];

  for (let d = 1; d <= 30; d++) {
    const date = addDays(today, d);
    const dayOfWeek = date.getDay();
    const dateStr = format(date, "yyyy-MM-dd");

    // Find working hours for this day
    const dayConfig = workingHours.find((wh) => wh.dayOfWeek === dayOfWeek);
    if (!dayConfig) continue;

    // Generate time slots
    const [startH, startM] = dayConfig.startTime.split(":").map(Number);
    const [endH, endM] = dayConfig.endTime.split(":").map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;

    for (let t = startMin; t + dayConfig.slotDurationMin <= endMin; t += dayConfig.slotDurationMin) {
      const slotStart = `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
      const slotEnd = `${String(Math.floor((t + dayConfig.slotDurationMin) / 60)).padStart(2, "0")}:${String((t + dayConfig.slotDurationMin) % 60).padStart(2, "0")}`;

      // Check capacity
      const reservationsAtSlot = existingSchedules.filter(
        (s) => format(s.date, "yyyy-MM-dd") === dateStr && s.startTime === slotStart
      ).length;

      if (reservationsAtSlot < dayConfig.maxCapacity) {
        slots.push({
          date: dateStr,
          startTime: slotStart,
          endTime: slotEnd,
          dateFormatted: date.toLocaleDateString("pt-BR", {
            weekday: "short",
            day: "numeric",
            month: "short",
          }),
        });
      }
    }
  }

  return NextResponse.json(slots);
}
