import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Users, Plus, Star, Phone } from "lucide-react";

interface Props {
  params: Promise<{ subdomain: string }>;
}

export default async function TecnicosPage({ params }: Props) {
  const { subdomain } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { subdomain } });
  if (!tenant) notFound();

  const technicians = await prisma.user.findMany({
    where: { tenantId: tenant.id, role: "TECHNICIAN" },
    include: { 
      technicianProfile: true,
      serviceRecords: {
        where: { reviewScore: { not: null } },
        select: { reviewScore: true }
      }
    },
  });

  return (
    <>
      <div className="admin-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="admin-page-title">Técnicos</h1>
          <p className="admin-page-subtitle">Gerencie sua equipe de instalação e avaliações</p>
        </div>
        <Link href={`/admin/tecnicos/novo?tenant=${subdomain}`} className="btn-admin-primary" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
          <Plus size={18} /> Novo Técnico
        </Link>
      </div>

      <div style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "12px",
        overflow: "hidden",
      }}>
        {technicians.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#475569" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px", color: "#64748b" }}>
              <Users size={48} />
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#94a3b8" }}>Nenhum técnico cadastrado</h3>
            <p style={{ fontSize: "14px" }}>Adicione técnicos para realizar as instalações dos pedidos.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Técnico", "Contato", "Avaliação NPS", "Especialidades", "Status"].map((h) => (
                  <th key={h} style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#64748b",
                    textTransform: "uppercase" as const,
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
              {technicians.map((tech) => (
                <tr key={tech.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "32px", height: "32px", borderRadius: "50%",
                        background: "linear-gradient(135deg, #6366f1, #818cf8)",
                        color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "14px", fontWeight: 700,
                      }}>
                        {tech.name[0]}
                      </div>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#e2e8f0" }}>{tech.name}</div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>{tech.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", color: "#cbd5e1" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Phone size={14} /> {tech.phone || tech.technicianProfile?.phone || "—"}
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    {(() => {
                      const records = tech.serviceRecords;
                      if (!records || records.length === 0) return <span style={{ color: "#64748b", fontSize: "13px" }}>Sem avaliações</span>;
                      
                      const avgScore = records.reduce((acc, curr) => acc + (curr.reviewScore || 0), 0) / records.length;
                      return (
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <Star size={16} fill="#fbbf24" color="#fbbf24" />
                          <span style={{ fontSize: "14px", fontWeight: 700, color: "#f1f5f9" }}>{avgScore.toFixed(1)}</span>
                          <span style={{ fontSize: "12px", color: "#64748b" }}>({records.length})</span>
                        </div>
                      );
                    })()}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      {tech.technicianProfile?.specialties.map((spec) => (
                        <span key={spec} style={{
                          fontSize: "11px",
                          background: "rgba(255,255,255,0.05)",
                          color: "#94a3b8",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}>
                          {spec}
                        </span>
                      )) || <span style={{ color: "#64748b", fontSize: "13px" }}>—</span>}
                    </div>
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
                      background: tech.isActive ? "rgba(34,197,94,0.12)" : "rgba(107,114,128,0.12)",
                      color: tech.isActive ? "#22c55e" : "#6b7280",
                    }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "currentColor" }} />
                      {tech.isActive ? "Ativo" : "Inativo"}
                    </span>
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
