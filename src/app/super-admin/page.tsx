import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default async function SuperAdminDashboard() {
  // Fetch stats
  const [totalPartners, activePartners, trialPartners, totalOrders, recentPartners] =
    await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: "ACTIVE" } }),
      prisma.tenant.count({ where: { status: "TRIAL" } }),
      prisma.order.count(),
      prisma.tenant.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { orders: true, products: true } },
        },
      }),
    ]);

  // Calculate MRR (simple estimate)
  const planPrices: Record<string, number> = {
    BASIC: 99,
    PROFESSIONAL: 199,
    ENTERPRISE: 499,
  };

  const activeTenants = await prisma.tenant.findMany({
    where: { status: "ACTIVE" },
    select: { plan: true },
  });

  const mrr = activeTenants.reduce(
    (sum, t) => sum + (planPrices[t.plan] || 0),
    0
  );

  return (
    <>
      <div className="admin-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-subtitle">Visão geral da plataforma WebSeg</p>
        </div>
        <Link
          href="/super-admin/parceiros/novo"
          className="btn-admin-primary"
          style={{
            padding: "10px 24px",
            background: "linear-gradient(135deg, #2563eb, #3b82f6)",
            color: "#fff",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          + Nova Loja
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon">🏢</div>
          </div>
          <div className="stat-card-value">{totalPartners}</div>
          <div className="stat-card-label">Parceiros Totais</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon">✅</div>
          </div>
          <div className="stat-card-value">{activePartners}</div>
          <div className="stat-card-label">Parceiros Ativos</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon">💰</div>
          </div>
          <div className="stat-card-value">{formatCurrency(mrr)}</div>
          <div className="stat-card-label">MRR (Receita Mensal)</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon">🧪</div>
          </div>
          <div className="stat-card-value">{trialPartners}</div>
          <div className="stat-card-label">Em Período Trial</div>
        </div>
      </div>

      {/* Recent Partners Table */}
      <div className="data-table-wrapper">
        <div className="data-table-header">
          <h3 className="data-table-title">Últimos Parceiros</h3>
          <Link href="/super-admin/parceiros" className="action-btn primary">
            Ver todos →
          </Link>
        </div>

        {recentPartners.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏢</div>
            <h3 className="empty-state-title">Nenhum parceiro cadastrado</h3>
            <p className="empty-state-desc">Cadastre o primeiro parceiro para começar.</p>
            <Link href="/super-admin/parceiros/novo" className="btn-admin-primary">
              + Novo Parceiro
            </Link>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Subdomínio</th>
                <th>Plano</th>
                <th>Status</th>
                <th>Produtos</th>
                <th>Pedidos</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {recentPartners.map((partner) => (
                <tr key={partner.id}>
                  <td>
                    <strong>{partner.companyName}</strong>
                    <br />
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      {partner.responsible}
                    </span>
                  </td>
                  <td>
                    <code style={{ fontSize: "12px", color: "#818cf8" }}>
                      {partner.subdomain}
                    </code>
                  </td>
                  <td>{partner.plan}</td>
                  <td>
                    <span
                      className={`status-badge ${partner.status.toLowerCase()}`}
                    >
                      <span className="status-dot" />
                      {partner.status === "ACTIVE"
                        ? "Ativo"
                        : partner.status === "TRIAL"
                        ? "Trial"
                        : partner.status === "INACTIVE"
                        ? "Inativo"
                        : "Suspenso"}
                    </span>
                  </td>
                  <td>{partner._count.products}</td>
                  <td>{partner._count.orders}</td>
                  <td>
                    <Link
                      href={`/?tenant=${partner.subdomain}`}
                      target="_blank"
                      className="action-btn"
                    >
                      🔗 Loja
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
