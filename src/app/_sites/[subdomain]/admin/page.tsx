import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import Link from "next/link";

interface Props {
  params: Promise<{ subdomain: string }>;
}

export default async function PartnerDashboard({ params }: Props) {
  const { subdomain } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { subdomain },
  });

  if (!tenant) notFound();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalOrders, monthOrders, totalRevenue, recentOrders, upcomingSchedules] = await Promise.all([
    prisma.order.count({ where: { tenantId: tenant.id } }),
    prisma.order.count({
      where: { tenantId: tenant.id, createdAt: { gte: monthStart } },
    }),
    prisma.order.aggregate({
      where: { tenantId: tenant.id, status: { in: ["PAID", "SCHEDULED", "COMPLETED"] } },
      _sum: { totalAmount: true },
    }),
    prisma.order.findMany({
      where: { tenantId: tenant.id },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { items: true },
    }),
    prisma.schedule.findMany({
      where: {
        tenantId: tenant.id,
        date: { gte: now },
        status: { in: ["CONFIRMED", "RESERVED"] },
      },
      take: 5,
      orderBy: { date: "asc" },
      include: { order: true },
    }),
  ]);

  const revenue = Number(totalRevenue._sum.totalAmount || 0);
  const ticketMedio = totalOrders > 0 ? revenue / totalOrders : 0;

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Dashboard</h1>
        <p className="admin-page-subtitle">Visão geral de {tenant.companyName}</p>
      </div>

      {/* Stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "16px",
        marginBottom: "32px",
      }}>
        {[
          { icon: "📦", value: monthOrders, label: "Pedidos este mês" },
          { icon: "💰", value: formatCurrency(revenue), label: "Receita total" },
          { icon: "🎯", value: formatCurrency(ticketMedio), label: "Ticket médio" },
          { icon: "📅", value: upcomingSchedules.length, label: "Próximas instalações" },
        ].map((stat, i) => (
          <div key={i} style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "12px",
            padding: "20px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <span style={{ fontSize: "20px" }}>{stat.icon}</span>
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#f1f5f9", marginBottom: "4px" }}>
              {stat.value}
            </div>
            <div style={{ fontSize: "13px", color: "#64748b" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Recent Orders */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "12px",
          overflow: "hidden",
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#e2e8f0" }}>Últimos Pedidos</h3>
            <Link href={`/admin/pedidos?tenant=${subdomain}`} style={{ fontSize: "13px", color: "#818cf8" }}>
              Ver todos →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#475569" }}>
              <p style={{ fontSize: "32px", marginBottom: "8px" }}>📦</p>
              <p>Nenhum pedido ainda</p>
            </div>
          ) : (
            <div>
              {recentOrders.map((order) => {
                const status = ORDER_STATUS_LABELS[order.status] || { label: order.status, color: "#94a3b8" };
                return (
                  <div key={order.id} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 20px",
                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                  }}>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#e2e8f0" }}>
                        {order.customerName}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        #{order.id.slice(-6).toUpperCase()}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "#f1f5f9" }}>
                        {formatCurrency(Number(order.totalAmount))}
                      </div>
                      <span style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: status.color,
                        background: `${status.color}1a`,
                        padding: "2px 8px",
                        borderRadius: "20px",
                      }}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming Installations */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "12px",
          overflow: "hidden",
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#e2e8f0" }}>Próximas Instalações</h3>
            <Link href={`/admin/agenda?tenant=${subdomain}`} style={{ fontSize: "13px", color: "#818cf8" }}>
              Ver agenda →
            </Link>
          </div>

          {upcomingSchedules.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#475569" }}>
              <p style={{ fontSize: "32px", marginBottom: "8px" }}>📅</p>
              <p>Nenhuma instalação agendada</p>
            </div>
          ) : (
            <div>
              {upcomingSchedules.map((schedule) => (
                <div key={schedule.id} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 20px",
                  borderBottom: "1px solid rgba(255,255,255,0.03)",
                }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#e2e8f0" }}>
                      {schedule.order?.customerName || "—"}
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                      {schedule.startTime} - {schedule.endTime}
                    </div>
                  </div>
                  <div style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#818cf8",
                    background: "rgba(99,102,241,0.1)",
                    padding: "4px 12px",
                    borderRadius: "20px",
                  }}>
                    {new Date(schedule.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
