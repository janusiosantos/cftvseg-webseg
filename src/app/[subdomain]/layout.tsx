import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTenantBySubdomain } from "@/lib/tenant";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ subdomain: string }>;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);

  if (!tenant) return { title: "Loja não encontrada" };

  return {
    title: `${tenant.companyName} | WebSeg`,
    description: tenant.aboutText || `Loja de segurança eletrônica - ${tenant.companyName}`,
  };
}

export default async function SubdomainRootLayout({ children, params }: LayoutProps) {
  const { subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);

  if (!tenant || (tenant.status !== "ACTIVE" && tenant.status !== "TRIAL")) {
    notFound();
  }

  return (
    <div data-theme="light">
      <style>{`
        :root {
          --store-primary: ${tenant.primaryColor};
          --store-secondary: ${tenant.secondaryColor};
          --store-accent: ${tenant.accentColor};
          --tenant-primary: ${tenant.primaryColor};
          --tenant-secondary: ${tenant.secondaryColor};
        }
      `}</style>
      {children}
    </div>
  );
}
