import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import {
  DollarSign,
  ShoppingCart,
  Clock,
  CheckCircle,
  TrendingUp,
  Package,
  Users,
  CalendarDays,
} from "lucide-react";
import { RevenueChart } from "./RevenueChart";
import { subDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  params: Promise<{ subdomain: string }>;
}

export default async function AdminDashboardPage({ params }: Props) {
  const { subdomain } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { subdomain },
    select: { id: true, companyName: true, plan: true, status: true },
  });

  if (!tenant) notFound();

  const [
    totalOrders,
    pendingOrders,
    completedOrders,
    totalProducts,
    totalTechnicians,
    recentOrders,
    revenue,
    last7DaysOrders,
  ] = await Promise.all([
    prisma.order.count({ where: { tenantId: tenant.id } }),
    prisma.order.count({ where: { tenantId: tenant.id, status: { in: ["PENDING_PAYMENT", "PAID", "SCHEDULED"] } } }),
    prisma.order.count({ where: { tenantId: tenant.id, status: "COMPLETED" } }),
    prisma.product.count({ where: { tenantId: tenant.id } }),
    prisma.user.count({ where: { tenantId: tenant.id, role: "TECHNICIAN" } }),
    prisma.order.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        customerName: true,
        totalAmount: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.order.aggregate({
      where: { tenantId: tenant.id, status: { in: ["PAID", "SCHEDULED", "IN_PROGRESS", "COMPLETED"] } },
      _sum: { totalAmount: true },
    }),
    prisma.order.findMany({
      where: {
        tenantId: tenant.id,
        createdAt: { gte: subDays(new Date(), 7) },
        status: { in: ["PAID", "SCHEDULED", "IN_PROGRESS", "COMPLETED"] }
      },
      select: { createdAt: true, totalAmount: true }
    }),
  ]);

  const totalRevenue = Number(revenue._sum.totalAmount || 0);

  // Generate last 7 days chart data
  const chartDataMap: Record<string, { revenue: number; orders: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = subDays(new Date(), i);
    const dateStr = format(d, "dd/MM");
    chartDataMap[dateStr] = { revenue: 0, orders: 0 };
  }

  last7DaysOrders.forEach(order => {
    const dateStr = format(new Date(order.createdAt), "dd/MM");
    if (chartDataMap[dateStr]) {
      chartDataMap[dateStr].revenue += Number(order.totalAmount);
      chartDataMap[dateStr].orders += 1;
    }
  });

  const chartData = Object.keys(chartDataMap).map(date => ({
    date,
    revenue: chartDataMap[date].revenue,
    orders: chartDataMap[date].orders
  }));

  const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    PENDING_PAYMENT: { label: "Aguardando", color: "#f59e0b" },
    PAID: { label: "Pago", color: "#22c55e" },
    SCHEDULED: { label: "Agendado", color: "#3b82f6" },
    IN_PROGRESS: { label: "Em andamento", color: "#8b5cf6" },
    COMPLETED: { label: "Concluído", color: "#06d6a0" },
    CANCELLED: { label: "Cancelado", color: "#ef4444" },
    REFUNDED: { label: "Estornado", color: "#6b7280" },
  };

  return (
    <>
      <div className="admin-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-subtitle">Visão geral de {tenant.companyName}</p>
        </div>
        <Link href={`/admin/produtos/novo?tenant=${subdomain}`} className="admin-btn-primary">
          <Package />
          Novo Produto
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card" style={{ "--stat-accent": "#22c55e" } as React.CSSProperties}>
          <div className="admin-stat-icon" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>
            <DollarSign />
          </div>
          <div className="admin-stat-value">{formatCurrency(totalRevenue)}</div>
          <div className="admin-stat-label">Receita Total</div>
        </div>

        <div className="admin-stat-card" style={{ "--stat-accent": "#3b82f6" } as React.CSSProperties}>
          <div className="admin-stat-icon" style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>
            <ShoppingCart />
          </div>
          <div className="admin-stat-value">{totalOrders}</div>
          <div className="admin-stat-label">Total de Pedidos</div>
        </div>

        <div className="admin-stat-card" style={{ "--stat-accent": "#f59e0b" } as React.CSSProperties}>
          <div className="admin-stat-icon" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>
            <Clock />
          </div>
          <div className="admin-stat-value">{pendingOrders}</div>
          <div className="admin-stat-label">Pedidos Pendentes</div>
        </div>

        <div className="admin-stat-card" style={{ "--stat-accent": "#06d6a0" } as React.CSSProperties}>
          <div className="admin-stat-icon" style={{ background: "rgba(6,214,160,0.1)", color: "#06d6a0" }}>
            <CheckCircle />
          </div>
          <div className="admin-stat-value">{completedOrders}</div>
          <div className="admin-stat-label">Concluídos</div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "28px" }}>
        <div className="admin-stat-card">
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div className="admin-stat-icon" style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", marginBottom: 0 }}>
              <Package />
            </div>
            <div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#f1f5f9" }}>{totalProducts}</div>
              <div style={{ fontSize: "13px", color: "#64748b" }}>Produtos Cadastrados</div>
            </div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div className="admin-stat-icon" style={{ background: "rgba(139,92,246,0.1)", color: "#a78bfa", marginBottom: 0 }}>
              <Users />
            </div>
            <div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#f1f5f9" }}>{totalTechnicians}</div>
              <div style={{ fontSize: "13px", color: "#64748b" }}>Técnicos na Equipe</div>
            </div>
          </div>
        </div>
      </div>

      <RevenueChart data={chartData} />

      {/* Recent Orders Table */}
      <div className="admin-table-wrapper">
        <div className="admin-table-header">
          <h3 className="admin-table-title">Últimos Pedidos</h3>
          <Link href={`/admin/pedidos?tenant=${subdomain}`} className="admin-table-action">
            Ver todos →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">
              <ShoppingCart />
            </div>
            <h3 className="admin-empty-title">Nenhum pedido ainda</h3>
            <p className="admin-empty-desc">Os pedidos aparecerão aqui quando clientes comprarem na sua loja.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => {
                const st = STATUS_CONFIG[order.status] || { label: order.status, color: "#94a3b8" };
                return (
                  <tr key={order.id}>
                    <td>
                      <Link href={`/admin/pedidos/${order.id}?tenant=${subdomain}`} style={{ color: "#818cf8", fontFamily: "monospace", textDecoration: "none", fontWeight: 600 }}>
                        #{order.id.slice(-6).toUpperCase()}
                      </Link>
                    </td>
                    <td style={{ fontWeight: 600, color: "#e2e8f0" }}>{order.customerName}</td>
                    <td style={{ fontWeight: 700, color: "#f1f5f9" }}>{formatCurrency(Number(order.totalAmount))}</td>
                    <td>
                      <span className="admin-badge" style={{ background: `${st.color}18`, color: st.color }}>
                        <span className="admin-badge-dot" />
                        {st.label}
                      </span>
                    </td>
                    <td style={{ color: "#64748b" }}>
                      {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
