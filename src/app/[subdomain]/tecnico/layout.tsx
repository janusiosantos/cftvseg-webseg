import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { LogOut, CalendarDays, CheckSquare, User } from "lucide-react";
import "../../tecnico.css";

export default async function TecnicoLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ subdomain: string }>;
}) {
  const session = await auth();
  const { subdomain } = await params;

  if (!session) {
    redirect(`/login?callbackUrl=/?tenant=${subdomain}`);
  }

  if (!["TECHNICIAN", "PARTNER_ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect(`/?tenant=${subdomain}`);
  }

  const tenant = await prisma.tenant.findUnique({
    where: { subdomain },
    select: { primaryColor: true },
  });

  if (!tenant) notFound();

  return (
    <>
      <style>{`
        :root {
          --tenant-primary: ${tenant.primaryColor};
        }
      `}</style>

      <div className="tech-app">
        <header className="tech-header">
          <div className="tech-header-inner">
            <div>
              <h1 className="tech-header-title">App do Técnico</h1>
              <p className="tech-header-greeting">Olá, {session.user.name}</p>
            </div>
            <Link
              href={`/api/auth/signout?callbackUrl=/?tenant=${subdomain}`}
              className="tech-header-logout"
            >
              <LogOut />
            </Link>
          </div>
        </header>

        <main className="tech-main">
          {children}
        </main>

        <nav className="tech-bottom-nav">
          <div className="tech-bottom-nav-inner">
            <Link href={`/tecnico?tenant=${subdomain}`} className="tech-nav-link active">
              <CalendarDays />
              <span className="tech-nav-label">Agenda</span>
            </Link>
            <Link href={`/tecnico/historico?tenant=${subdomain}`} className="tech-nav-link">
              <CheckSquare />
              <span className="tech-nav-label">Histórico</span>
            </Link>
            <Link href={`/tecnico/perfil?tenant=${subdomain}`} className="tech-nav-link">
              <User />
              <span className="tech-nav-label">Perfil</span>
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}
