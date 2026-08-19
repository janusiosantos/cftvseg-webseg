import { notFound } from "next/navigation";
import { getTenantBySubdomain } from "@/lib/tenant";
import { MessageCircle, Phone, Mail, MapPin } from "lucide-react";
import "@/app/store.css";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ subdomain: string }>;
}

export default async function StoreLayout({ children, params }: LayoutProps) {
  const { subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);

  if (!tenant || (tenant.status !== "ACTIVE" && tenant.status !== "TRIAL")) {
    notFound();
  }

  return (
    <div className="store-layout">
      {/* Store Header */}
      <header className="store-header">
        <div className="store-header-inner">
          <a href={`/?tenant=${subdomain}`} className="store-logo">
            <div className="store-logo-img">
              {tenant.companyName[0]}
            </div>
            <span className="store-logo-text">{tenant.companyName}</span>
          </a>

          <nav className="store-nav">
            <a href={`/?tenant=${subdomain}`}>Início</a>
            <a href={`/?tenant=${subdomain}#produtos`}>Produtos</a>
            <a href={`/?tenant=${subdomain}#sobre`}>Sobre</a>
            {tenant.publicPhone ? (
              <a 
                href={`https://wa.me/${tenant.publicPhone.replace(/\D/g, '')}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="store-cart-btn"
                style={{ background: "#25D366" }}
              >
                <MessageCircle size={18} /> Atendimento
              </a>
            ) : (
              <a href={`/login`} className="store-cart-btn">
                Área do Cliente
              </a>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Store Footer */}
      <footer className="store-footer">
        <div className="store-footer-inner">
          <div className="store-footer-grid">
            <div>
              <h4>{tenant.companyName}</h4>
              <p>{tenant.aboutText || "Empresa de segurança eletrônica."}</p>
            </div>
            <div>
              <h4>Contato</h4>
              {tenant.publicPhone && <p><Phone size={16} /> {tenant.publicPhone}</p>}
              {tenant.publicEmail && <p><Mail size={16} /> {tenant.publicEmail}</p>}
              {tenant.addressCity && <p><MapPin size={16} /> {tenant.addressCity}/{tenant.addressState}</p>}
            </div>
            <div>
              <h4>Links</h4>
              <p><a href={`/?tenant=${subdomain}`}>Início</a></p>
              <p><a href={`/?tenant=${subdomain}#produtos`}>Produtos</a></p>
              <p><a href={`/?tenant=${subdomain}#sobre`}>Sobre nós</a></p>
            </div>
          </div>
          <div className="store-footer-bottom">
            <p>© {new Date().getFullYear()} {tenant.companyName}. Powered by <a href="https://cftveseg.opensoftware.com.br" style={{ color: "#818cf8" }}>WebSeg</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
