import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import "../../admin.css";
import {
  LayoutDashboard,
  Package,
  CalendarDays,
  ShoppingBag,
  Users,
  Ticket,
  Settings,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { AdminMobileToggle } from "./AdminMobileToggle";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ subdomain: string }>;
}

const NAV_ITEMS = [
  { section: "Principal", items: [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/pedidos", icon: Package, label: "Pedidos" },
    { href: "/admin/agenda", icon: CalendarDays, label: "Agenda" },
  ]},
  { section: "Catálogo", items: [
    { href: "/admin/produtos", icon: ShoppingBag, label: "Produtos" },
    { href: "/admin/cupons", icon: Ticket, label: "Cupons" },
  ]},
  { section: "Equipe", items: [
    { href: "/admin/tecnicos", icon: Users, label: "Técnicos" },
  ]},
  { section: "Sistema", items: [
    { href: "/admin/configuracoes", icon: Settings, label: "Configurações" },
  ]},
];

export default async function PartnerAdminLayout({ children, params }: LayoutProps) {
  const { subdomain } = await params;
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "PARTNER_ADMIN") {
    redirect("/login");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { subdomain },
  });

  if (!tenant) {
    notFound();
  }

  // Verify tenant access (unless super admin)
  if (session.user.role === "PARTNER_ADMIN" && session.user.tenantId !== tenant.id) {
    redirect("/login");
  }

  return (
    <>
      <style>{`
        .admin-sidebar-logo-icon {
          background: linear-gradient(135deg, ${tenant.primaryColor}, ${tenant.secondaryColor});
        }
      `}</style>

      <div className="admin-layout">
        {/* Mobile Header */}
        <div className="admin-mobile-header">
          <AdminMobileToggle />
          <div className="admin-mobile-logo">
            <div className="admin-sidebar-logo-icon" style={{ width: 32, height: 32, fontSize: 13 }}>
              {tenant.companyName[0]}
            </div>
            {tenant.companyName}
          </div>
          <div style={{ width: 40 }} />
        </div>

        {/* Sidebar */}
        <aside className="admin-sidebar" id="admin-sidebar">
          <div className="admin-sidebar-logo">
            <div className="admin-sidebar-logo-icon">
              {tenant.companyName[0]}
            </div>
            <span className="admin-sidebar-company">{tenant.companyName}</span>
          </div>

          <nav className="admin-sidebar-nav">
            {NAV_ITEMS.map((group) => (
              <div key={group.section}>
                <div className="admin-sidebar-section">{group.section}</div>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={`${item.href}?tenant=${subdomain}`}
                      className="admin-sidebar-link"
                    >
                      <Icon />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="admin-sidebar-footer">
            <Link
              href={`/?tenant=${subdomain}`}
              target="_blank"
              className="admin-sidebar-store-btn"
            >
              <ExternalLink />
              Ver minha loja
            </Link>
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="admin-sidebar-signout">
                <LogOut />
                Sair da conta
              </button>
            </form>
          </div>
        </aside>

        {/* Overlay (mobile) */}
        <div className="admin-mobile-overlay" id="admin-overlay" />

        {/* Main Content */}
        <main className="admin-main">
          {children}
        </main>
      </div>
    </>
  );
}
