import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { LogOut, Calendar, CheckSquare, User } from "lucide-react";

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

  // Only TECHNICIAN and PARTNER_ADMIN/SUPER_ADMIN can access
  if (!["TECHNICIAN", "PARTNER_ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect(`/?tenant=${subdomain}`);
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <header className="bg-[var(--tenant-primary)] text-white shadow-md p-4 sticky top-0 z-10">
        <div className="flex justify-between items-center max-w-lg mx-auto">
          <div>
            <h1 className="text-lg font-bold">App do Técnico</h1>
            <p className="text-xs opacity-80">Olá, {session.user.name}</p>
          </div>
          <Link
            href={`/api/auth/signout?callbackUrl=/?tenant=${subdomain}`}
            className="p-2 rounded-full hover:bg-white/10"
          >
            <LogOut size={20} />
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto w-full p-4">
        {children}
      </main>

      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 pb-safe">
        <div className="flex justify-around max-w-lg mx-auto">
          <Link href={`/tecnico?tenant=${subdomain}`} className="flex flex-col items-center py-3 px-6 text-[var(--tenant-primary)]">
            <Calendar size={24} />
            <span className="text-[10px] mt-1 font-medium">Agenda</span>
          </Link>
          <Link href={`/tecnico/historico?tenant=${subdomain}`} className="flex flex-col items-center py-3 px-6 text-gray-500 hover:text-[var(--tenant-primary)]">
            <CheckSquare size={24} />
            <span className="text-[10px] mt-1 font-medium">Histórico</span>
          </Link>
          <Link href={`/tecnico/perfil?tenant=${subdomain}`} className="flex flex-col items-center py-3 px-6 text-gray-500 hover:text-[var(--tenant-primary)]">
            <User size={24} />
            <span className="text-[10px] mt-1 font-medium">Perfil</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
