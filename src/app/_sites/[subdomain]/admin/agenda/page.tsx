import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { SCHEDULE_STATUS_LABELS, DAYS_OF_WEEK } from "@/lib/constants";
import { addDays, format } from "date-fns";

interface Props {
  params: Promise<{ subdomain: string }>;
}

export default async function AgendaPage({ params }: Props) {
  const { subdomain } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { subdomain } });
  if (!tenant) notFound();

  const today = new Date();
  const weekEnd = addDays(today, 7);

  const [schedules, workingHours] = await Promise.all([
    prisma.schedule.findMany({
      where: {
        tenantId: tenant.id,
        date: { gte: today, lte: addDays(today, 30) },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      include: { order: true },
    }),
    prisma.workingHours.findMany({
      where: { tenantId: tenant.id },
      orderBy: { dayOfWeek: "asc" },
    }),
  ]);

  // Group schedules by date
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(today, i);
    const dateStr = format(date, "yyyy-MM-dd");
    const daySchedules = schedules.filter(
      (s) => format(s.date, "yyyy-MM-dd") === dateStr
    );
    weekDays.push({
      date,
      dateStr,
      dayName: DAYS_OF_WEEK[date.getDay()],
      schedules: daySchedules,
    });
  }

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Agenda</h1>
        <p className="admin-page-subtitle">Visualize e gerencie sua agenda de instalações</p>
      </div>

      {/* Working Hours Config */}
      <div style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "24px",
      }}>
        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#e2e8f0", marginBottom: "12px" }}>
          ⚙️ Horários de Trabalho
        </h3>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {DAYS_OF_WEEK.map((day, i) => {
            const config = workingHours.find((wh) => wh.dayOfWeek === i);
            return (
              <div key={i} style={{
                background: config ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${config ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.06)"}`,
                borderRadius: "8px",
                padding: "10px 16px",
                minWidth: "120px",
                textAlign: "center",
              }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: config ? "#818cf8" : "#475569", marginBottom: "4px" }}>
                  {day.slice(0, 3)}
                </div>
                {config ? (
                  <div style={{ fontSize: "13px", color: "#94a3b8" }}>
                    {config.startTime} - {config.endTime}
                  </div>
                ) : (
                  <div style={{ fontSize: "12px", color: "#475569" }}>Fechado</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Week View */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: "8px",
      }}>
        {weekDays.map((day) => (
          <div key={day.dateStr} style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "12px",
            overflow: "hidden",
            minHeight: "200px",
          }}>
            <div style={{
              padding: "12px",
              background: day.dateStr === format(today, "yyyy-MM-dd")
                ? "rgba(99,102,241,0.15)"
                : "rgba(0,0,0,0.2)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                {day.dayName.slice(0, 3)}
              </div>
              <div style={{
                fontSize: "20px",
                fontWeight: 800,
                color: day.dateStr === format(today, "yyyy-MM-dd") ? "#818cf8" : "#e2e8f0",
              }}>
                {day.date.getDate()}
              </div>
            </div>

            <div style={{ padding: "8px" }}>
              {day.schedules.length === 0 ? (
                <p style={{ fontSize: "11px", color: "#475569", textAlign: "center", padding: "16px 0" }}>
                  Sem agendamentos
                </p>
              ) : (
                day.schedules.map((schedule) => {
                  const status = SCHEDULE_STATUS_LABELS[schedule.status] || { label: schedule.status, color: "#94a3b8" };
                  return (
                    <div key={schedule.id} style={{
                      background: `${status.color}15`,
                      borderLeft: `3px solid ${status.color}`,
                      borderRadius: "4px",
                      padding: "6px 8px",
                      marginBottom: "4px",
                      fontSize: "11px",
                    }}>
                      <div style={{ fontWeight: 600, color: "#e2e8f0" }}>
                        {schedule.startTime}
                      </div>
                      <div style={{ color: "#94a3b8", marginTop: "2px" }}>
                        {schedule.order?.customerName || "—"}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
