import { auth } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart, Building, MessageCircle, Shield } from "lucide-react";
import "./super-admin.css";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon"><Shield size={24} /></span>
          <span>WebSeg</span>
          <span className="sidebar-badge">Admin</span>
        </div>

        <nav className="sidebar-nav">
          <Link href="/super-admin" className="sidebar-link">
            <span className="sidebar-icon" style={{ display: "flex", alignItems: "center" }}><BarChart size={18} /></span>
            Dashboard
          </Link>
          <Link href="/super-admin/parceiros" className="sidebar-link">
            <span className="sidebar-icon" style={{ display: "flex", alignItems: "center" }}><Building size={18} /></span>
            Parceiros (Tenants)
          </Link>
          <Link href="/super-admin/contatos" className="sidebar-link">
            <span className="sidebar-icon" style={{ display: "flex", alignItems: "center" }}><MessageCircle size={18} /></span>
            Mensagens
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {session.user.name?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{session.user.name}</div>
              <div className="sidebar-user-role">Super Admin</div>
            </div>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="sidebar-logout">Sair</button>
          </form>
        </div>
      </aside>

      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
