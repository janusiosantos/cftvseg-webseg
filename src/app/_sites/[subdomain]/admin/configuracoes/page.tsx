import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ConfigForm } from "./ConfigForm";
import { DAYS_OF_WEEK } from "@/lib/constants";

interface Props {
  params: Promise<{ subdomain: string }>;
}

export default async function ConfiguracoesPage({ params }: Props) {
  const { subdomain } = await params;
  
  const tenant = await prisma.tenant.findUnique({ 
    where: { subdomain },
    select: {
      id: true,
      primaryColor: true,
      secondaryColor: true,
      customDomain: true,
      logo: true,
      bannerUrl: true,
      publicPhone: true,
      publicEmail: true,
      aboutText: true,
    }
  });
  
  if (!tenant) notFound();

  const workingHours = await prisma.workingHours.findMany({
    where: { tenantId: tenant.id },
    orderBy: { dayOfWeek: "asc" },
  });

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Configurações da Loja</h1>
        <p className="admin-page-subtitle">Personalize a identidade visual e os contatos do seu site.</p>
      </div>

      <div className="mt-8 space-y-8">
        <ConfigForm initialData={{
          primaryColor: tenant.primaryColor,
          secondaryColor: tenant.secondaryColor,
          customDomain: tenant.customDomain,
          logo: tenant.logo,
          bannerUrl: tenant.bannerUrl,
          publicPhone: tenant.publicPhone,
          publicEmail: tenant.publicEmail,
          aboutText: tenant.aboutText,
        }} />

        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "12px",
          padding: "24px",
        }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px", color: "#e2e8f0" }}>Horário de Instalação</h2>
          <p style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "24px" }}>
            Estes são os horários de operação que seus clientes podem selecionar no checkout.
          </p>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Dia da Semana", "Início", "Fim", "Capacidade (Jobs/Dia)"].map((h) => (
                  <th key={h} style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#64748b",
                    textTransform: "uppercase",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workingHours.map((wh) => (
                <tr key={wh.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: "14px 16px", fontSize: "14px", fontWeight: 600, color: "#cbd5e1" }}>
                    {DAYS_OF_WEEK[wh.dayOfWeek]}
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: "14px", color: "#94a3b8" }}>{wh.startTime}</td>
                  <td style={{ padding: "14px 16px", fontSize: "14px", color: "#94a3b8" }}>{wh.endTime}</td>
                  <td style={{ padding: "14px 16px", fontSize: "14px", color: "#94a3b8" }}>{wh.maxCapacity} instalações</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
