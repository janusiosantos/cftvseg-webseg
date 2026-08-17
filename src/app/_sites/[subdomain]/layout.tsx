import { prisma } from "@/lib/prisma";
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

export default async function StoreLayout({ children, params }: LayoutProps) {
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
        }

        .store-layout {
          min-height: 100vh;
          background: #f8fafc;
          color: #0f172a;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        /* Store Header */
        .store-header {
          background: #fff;
          border-bottom: 1px solid #e2e8f0;
          padding: 16px 0;
          position: sticky;
          top: 0;
          z-index: 40;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .store-header-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .store-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: #0f172a;
        }

        .store-logo-img {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, var(--store-primary), var(--store-secondary));
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: #fff;
          font-weight: 800;
        }

        .store-logo-text {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
        }

        .store-nav {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .store-nav a {
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          transition: color 150ms;
        }

        .store-nav a:hover {
          color: var(--store-primary);
        }

        .store-cart-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: var(--store-primary);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          transition: all 200ms;
        }

        .store-cart-btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
          color: #fff;
        }

        /* Store Footer */
        .store-footer {
          background: #0f172a;
          color: #94a3b8;
          padding: 48px 0 24px;
          margin-top: 64px;
        }

        .store-footer-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .store-footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 48px;
          margin-bottom: 32px;
        }

        .store-footer h4 {
          color: #e2e8f0;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 16px;
        }

        .store-footer p, .store-footer a {
          font-size: 14px;
          color: #64748b;
          line-height: 1.7;
          text-decoration: none;
        }

        .store-footer a:hover {
          color: var(--store-primary);
        }

        .store-footer-bottom {
          border-top: 1px solid rgba(255,255,255,0.06);
          padding-top: 20px;
          text-align: center;
          font-size: 12px;
          color: #475569;
        }

        /* Breadcrumb */
        .store-breadcrumb {
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px 24px;
          font-size: 13px;
          color: #94a3b8;
        }

        .store-breadcrumb a {
          color: #64748b;
          text-decoration: none;
        }

        .store-breadcrumb a:hover {
          color: var(--store-primary);
        }

        /* Content */
        .store-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* Product Grid */
        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
          padding: 32px 0;
        }

        .product-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          transition: all 250ms ease;
          cursor: pointer;
          text-decoration: none;
          color: inherit;
          display: block;
        }

        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.08);
          border-color: var(--store-primary);
        }

        .product-card-img {
          aspect-ratio: 4/3;
          background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          position: relative;
          overflow: hidden;
        }

        .product-card-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: var(--store-accent, #06d6a0);
          color: #fff;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
        }

        .product-card-body {
          padding: 20px;
        }

        .product-card-category {
          font-size: 12px;
          font-weight: 600;
          color: var(--store-primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }

        .product-card-name {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 4px;
        }

        .product-card-desc {
          font-size: 13px;
          color: #64748b;
          margin-bottom: 12px;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .product-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .product-card-price {
          font-size: 20px;
          font-weight: 800;
          color: var(--store-primary);
        }

        .product-card-old-price {
          font-size: 13px;
          color: #94a3b8;
          text-decoration: line-through;
          margin-left: 8px;
        }

        .product-card-cta {
          padding: 8px 16px;
          background: var(--store-primary);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 200ms;
        }

        .product-card-cta:hover {
          opacity: 0.9;
        }

        /* Banner */
        .store-banner {
          background: linear-gradient(135deg, var(--store-primary), var(--store-secondary));
          color: #fff;
          padding: 64px 0;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .store-banner::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%);
        }

        .store-banner h1 {
          font-size: 36px;
          font-weight: 900;
          margin-bottom: 8px;
          position: relative;
        }

        .store-banner p {
          font-size: 18px;
          opacity: 0.9;
          position: relative;
        }

        /* About Section */
        .store-about {
          background: #fff;
          padding: 48px 0;
          margin-top: 32px;
          border-top: 1px solid #e2e8f0;
        }

        .store-about h2 {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 16px;
        }

        .store-about p {
          color: #475569;
          line-height: 1.8;
          max-width: 700px;
        }

        .store-contact-info {
          display: flex;
          gap: 32px;
          margin-top: 24px;
          flex-wrap: wrap;
        }

        .store-contact-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #475569;
        }

        @media (max-width: 768px) {
          .store-header-inner {
            flex-wrap: wrap;
            gap: 12px;
          }
          .store-nav {
            gap: 16px;
          }
          .store-footer-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .store-banner h1 {
            font-size: 24px;
          }
          .products-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="store-layout">
        {/* Header */}
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
                  style={{ background: "#25D366" }} // WhatsApp green
                >
                  📞 Atendimento
                </a>
              ) : (
                <a href={`/login`} className="store-cart-btn">
                  Área do Cliente
                </a>
              )}
            </nav>
          </div>
        </header>

        {/* Content */}
        {children}

        {/* Footer */}
        <footer className="store-footer">
          <div className="store-footer-inner">
            <div className="store-footer-grid">
              <div>
                <h4>{tenant.companyName}</h4>
                <p>{tenant.aboutText || "Empresa de segurança eletrônica."}</p>
              </div>
              <div>
                <h4>Contato</h4>
                {tenant.publicPhone && <p>📞 {tenant.publicPhone}</p>}
                {tenant.publicEmail && <p>📧 {tenant.publicEmail}</p>}
                {tenant.addressCity && <p>📍 {tenant.addressCity}/{tenant.addressState}</p>}
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
    </div>
  );
}
