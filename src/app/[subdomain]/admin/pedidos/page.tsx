import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { AssignTechnicianSelect } from "./AssignTechnicianSelect";
import { OrderFilter } from "./OrderFilter";

interface Props {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PedidosPage(props: Props) {
  const { subdomain } = await props.params;
  const searchParams = await props.searchParams;
  
  const tenant = await prisma.tenant.findUnique({ where: { subdomain } });
  if (!tenant) notFound();

  // Pagination logic
  const page = typeof searchParams.page === "string" ? parseInt(searchParams.page, 10) : 1;
  const statusFilter = typeof searchParams.status === "string" ? searchParams.status : undefined;
  const limit = 10;
  const skip = (page - 1) * limit;

  const whereClause: any = { tenantId: tenant.id };
  if (statusFilter && statusFilter !== "ALL") {
    whereClause.status = statusFilter;
  }

  const [totalCount, orders, technicians] = await Promise.all([
    prisma.order.count({ where: whereClause }),
    prisma.order.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: { items: true, technician: true },
      skip,
      take: limit,
    }),
    prisma.user.findMany({
      where: { tenantId: tenant.id, role: "TECHNICIAN", isActive: true },
      select: { id: true, name: true },
    })
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Pedidos</h1>
        <p className="admin-page-subtitle">{totalCount} pedidos encontrados</p>
      </div>

      <OrderFilter tenant={subdomain} />

      <div style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "12px",
        overflow: "hidden",
      }}>
        {orders.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon" style={{ display: "flex", justifyContent: "center", marginBottom: "16px", color: "#475569" }}>
              <ShoppingCart size={48} />
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#94a3b8", textAlign: "center" }}>Nenhum pedido ainda</h3>
            <p style={{ fontSize: "14px", textAlign: "center", color: "#64748b" }}>Os pedidos aparecerão aqui quando clientes comprarem na sua loja.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
              <thead>
                <tr>
                  {["Pedido", "Cliente", "Produtos", "Valor", "Status", "Instalação", "Técnico"].map((h) => (
                    <th key={h} style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#64748b",
                      textTransform: "uppercase",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      background: "rgba(0,0,0,0.2)",
                      letterSpacing: "0.05em",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const status = ORDER_STATUS_LABELS[order.status] || { label: order.status, color: "#94a3b8" };
                  return (
                    <tr key={order.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      <td style={{ padding: "14px 16px", fontSize: "13px" }}>
                        <Link href={`/admin/pedidos/${order.id}?tenant=${subdomain}`} style={{ color: "#818cf8", fontFamily: "monospace", textDecoration: "none" }}>
                          #{order.id.slice(-6).toUpperCase()}
                        </Link>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#e2e8f0" }}>{order.customerName}</div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>{order.customerEmail}</div>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "13px", color: "#cbd5e1" }}>
                        {order.items.map((i) => i.productName).join(", ")}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "14px", fontWeight: 700, color: "#f1f5f9" }}>
                        {formatCurrency(Number(order.totalAmount))}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "12px",
                          fontWeight: 600,
                          padding: "4px 12px",
                          borderRadius: "20px",
                          background: `${status.color}1a`,
                          color: status.color,
                        }}>
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "currentColor" }} />
                          {status.label}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "13px", color: "#94a3b8" }}>
                        {order.scheduledDate
                          ? `${new Date(order.scheduledDate).toLocaleDateString("pt-BR")} ${order.scheduledTimeStart || ""}`
                          : "—"}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "13px", color: "#64748b" }}>
                        <AssignTechnicianSelect 
                          orderId={order.id} 
                          currentTechnicianId={order.technicianId} 
                          technicians={technicians} 
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: "24px", gap: "8px" }}>
          {page > 1 && (
            <Link 
              href={`/admin/pedidos?tenant=${subdomain}&page=${page - 1}`}
              style={{ padding: "8px 16px", background: "rgba(255,255,255,0.05)", borderRadius: "6px", color: "#cbd5e1", textDecoration: "none", fontSize: "14px" }}
            >
              Anterior
            </Link>
          )}
          <span style={{ padding: "8px 16px", color: "#94a3b8", fontSize: "14px" }}>
            Página {page} de {totalPages}
          </span>
          {page < totalPages && (
            <Link 
              href={`/admin/pedidos?tenant=${subdomain}&page=${page + 1}`}
              style={{ padding: "8px 16px", background: "rgba(255,255,255,0.05)", borderRadius: "6px", color: "#cbd5e1", textDecoration: "none", fontSize: "14px" }}
            >
              Próxima
            </Link>
          )}
        </div>
      )}
    </>
  );
}
