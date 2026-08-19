import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Building } from "lucide-react";
import { formatCurrency, formatCnpj } from "@/lib/utils";
import { TenantActions } from "./TenantActions";

export default async function ParceirosPage() {
  const partners = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { orders: true, products: true, users: true } },
    },
  });

  return (
    <>
      <div className="admin-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="admin-page-title">Parceiros</h1>
          <p className="admin-page-subtitle">Gerencie os parceiros da plataforma</p>
        </div>
        <Link href="/super-admin/parceiros/novo" className="btn-admin-primary">
          + Novo Parceiro
        </Link>
      </div>

      <div className="data-table-wrapper">
        {partners.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", color: "#64748b" }}><Building size={48} /></div>
            <h3 className="empty-state-title">Nenhum parceiro cadastrado</h3>
            <p className="empty-state-desc">Clique no botão acima para cadastrar o primeiro parceiro.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>CNPJ</th>
                <th>Subdomínio</th>
                <th>Plano</th>
                <th>Status</th>
                <th>Produtos</th>
                <th>Pedidos</th>
                <th>Criado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((partner) => (
                <tr key={partner.id}>
                  <td>
                    <strong>{partner.companyName}</strong>
                    <br />
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      {partner.responsible} • {partner.email}
                    </span>
                  </td>
                  <td style={{ fontSize: "13px", fontFamily: "monospace" }}>
                    {formatCnpj(partner.cnpj)}
                  </td>
                  <td>
                    <code style={{ fontSize: "12px", color: "#818cf8" }}>
                      {partner.subdomain}
                    </code>
                  </td>
                  <td>
                    <span style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: partner.plan === "PROFESSIONAL" ? "#818cf8" :
                             partner.plan === "ENTERPRISE" ? "#f59e0b" : "#94a3b8"
                    }}>
                      {partner.plan === "FREE_TRIAL" ? "Trial" :
                       partner.plan === "BASIC" ? "Básico" :
                       partner.plan === "PROFESSIONAL" ? "Profissional" : "Enterprise"}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${partner.status.toLowerCase()}`}>
                      <span className="status-dot" />
                      {partner.status === "ACTIVE" ? "Ativo" :
                       partner.status === "TRIAL" ? "Trial" :
                       partner.status === "INACTIVE" ? "Inativo" : "Suspenso"}
                    </span>
                  </td>
                  <td>{partner._count.products}</td>
                  <td>{partner._count.orders}</td>
                  <td style={{ fontSize: "13px", color: "#64748b" }}>
                    {new Date(partner.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td>
                    <TenantActions tenant={partner} />
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
