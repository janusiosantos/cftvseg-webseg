import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ subdomain: string }>;
}

export default async function PartnerAdminLayout({ children, params }: LayoutProps) {
  const { subdomain } = await params;
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // Allow Super Admin or Partner Admin of this tenant
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "PARTNER_ADMIN") {
    redirect("/login");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { subdomain },
  });

  if (!tenant) notFound();

  // Verify tenant access (unless super admin)
  if (session.user.role === "PARTNER_ADMIN" && session.user.tenantId !== tenant.id) {
    redirect("/login");
  }

  return (
    <>
      <style>{`
        .partner-admin {
          display: flex;
          min-height: 100vh;
          background: #0f1117;
          color: #f1f5f9;
          font-family: 'Inter', -apple-system, sans-serif;
        }
        .partner-sidebar {
          width: 260px;
          background: #0a0d14;
          border-right: 1px solid rgba(255,255,255,0.06);
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          z-index: 40;
        }
        .partner-sidebar-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .partner-sidebar-logo-icon {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, ${tenant.primaryColor}, ${tenant.secondaryColor});
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          color: #fff;
          font-weight: 800;
        }
        .partner-sidebar-name {
          font-size: 15px;
          font-weight: 700;
          color: #e2e8f0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .partner-sidebar-nav {
          flex: 1;
          padding: 12px 8px;
        }
        .partner-sidebar-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          color: #94a3b8;
          font-size: 14px;
          font-weight: 500;
          border-radius: 8px;
          transition: all 150ms;
          text-decoration: none;
          margin-bottom: 2px;
        }
        .partner-sidebar-link:hover {
          background: rgba(99,102,241,0.1);
          color: #e2e8f0;
        }
        .partner-sidebar-section {
          font-size: 11px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 16px 16px 8px;
        }
        .partner-sidebar-footer {
          padding: 16px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .partner-main {
          flex: 1;
          margin-left: 260px;
          padding: 32px;
        }
        .admin-page-header { margin-bottom: 32px; }
        .admin-page-title { font-size: 28px; font-weight: 800; color: #f1f5f9; margin-bottom: 4px; }
        .admin-page-subtitle { font-size: 14px; color: #64748b; }
        @media (max-width: 768px) {
          .partner-sidebar { display: none; }
          .partner-main { margin-left: 0; padding: 20px; }
        }
      `}</style>

      <div className="partner-admin">
        <aside className="partner-sidebar">
          <div className="partner-sidebar-logo">
            <div className="partner-sidebar-logo-icon">
              {tenant.companyName[0]}
            </div>
            <span className="partner-sidebar-name">{tenant.companyName}</span>
          </div>

          <nav className="partner-sidebar-nav">
            <div className="partner-sidebar-section">Principal</div>
            <Link href={`/admin?tenant=${subdomain}`} className="partner-sidebar-link">
              📊 Dashboard
            </Link>
            <Link href={`/admin/pedidos?tenant=${subdomain}`} className="partner-sidebar-link">
              📦 Pedidos
            </Link>
            <Link href={`/admin/agenda?tenant=${subdomain}`} className="partner-sidebar-link">
              📅 Agenda
            </Link>

            <div className="partner-sidebar-section">Catálogo</div>
            <Link href={`/admin/produtos?tenant=${subdomain}`} className="partner-sidebar-link">
              📋 Produtos
            </Link>

            <div className="partner-sidebar-section">Equipe</div>
            <Link href={`/admin/tecnicos?tenant=${subdomain}`} className="partner-sidebar-link">
              👷 Técnicos
            </Link>

            <div className="partner-sidebar-section">Configurações</div>
            <Link href={`/admin/configuracoes?tenant=${subdomain}`} className="partner-sidebar-link">
              ⚙️ Configurações
            </Link>
          </nav>

          <div className="partner-sidebar-footer">
            <Link
              href={`/?tenant=${subdomain}`}
              target="_blank"
              style={{
                display: "block",
                padding: "8px 12px",
                background: "rgba(99,102,241,0.1)",
                color: "#818cf8",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
                textAlign: "center",
                textDecoration: "none",
                marginBottom: "8px",
              }}
            >
              🔗 Ver minha loja
            </Link>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "rgba(239,68,68,0.08)",
                  color: "#f87171",
                  border: "1px solid rgba(239,68,68,0.15)",
                  borderRadius: "8px",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Sair
              </button>
            </form>
          </div>
        </aside>

        <main className="partner-main">
          {children}
        </main>
      </div>
    </>
  );
}
