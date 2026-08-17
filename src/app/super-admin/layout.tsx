import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
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
          <span className="logo-icon">🛡️</span>
          <span>WebSeg</span>
          <span className="sidebar-badge">Admin</span>
        </div>

        <nav className="sidebar-nav">
          <a href="/super-admin" className="sidebar-link">
            <span className="sidebar-icon">📊</span>
            Dashboard
          </a>
          <a href="/super-admin/parceiros" className="sidebar-link">
            <span className="sidebar-icon">🏢</span>
            Parceiros
          </a>
          <a href="/super-admin/mensagens" className="sidebar-link">
            <span className="sidebar-icon">💬</span>
            Mensagens
          </a>
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
