import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Video, Zap, Bell, Radio, Home, Wrench, Package, Phone, Mail, MapPin } from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  CFTV: <Video />,
  CERCA_ELETRICA: <Zap />,
  ALARME: <Bell />,
  SENSOR: <Radio />,
  AUTOMACAO: <Home />,
  SERVICO: <Wrench />,
  OUTROS: <Package />,
};

const CATEGORY_LABELS: Record<string, string> = {
  CFTV: "CFTV",
  CERCA_ELETRICA: "Cerca Elétrica",
  ALARME: "Alarme",
  SENSOR: "Sensores",
  AUTOMACAO: "Automação",
  SERVICO: "Serviço",
  OUTROS: "Outros",
};

interface Props {
  params: Promise<{ subdomain: string }>;
}

export default async function StorePage({ params }: Props) {
  const { subdomain } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { subdomain },
  });

  if (!tenant) notFound();

  const products = await prisma.product.findMany({
    where: { tenantId: tenant.id, isActive: true },
    orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
  });

  return (
    <>
      {/* Banner */}
      <section className="store-banner">
        <div className="store-content">
          <h1>{tenant.bannerTitle || `Bem-vindo à ${tenant.companyName}`}</h1>
          <p>{tenant.bannerSubtitle || "Soluções completas em segurança eletrônica"}</p>
        </div>
      </section>

      {/* Products */}
      <section id="produtos" className="store-content">
        <div style={{ paddingTop: "32px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", marginBottom: "4px" }}>
            Nossos Produtos
          </h2>
          <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "8px" }}>
            Kits completos com instalação profissional inclusa
          </p>
        </div>

        {products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 0", color: "#94a3b8" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px", color: "#cbd5e1" }}>
              <Package size={48} />
            </div>
            <p style={{ fontSize: "18px", fontWeight: 600 }}>Produtos em breve!</p>
            <p>Estamos preparando nosso catálogo.</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((product) => {
              const price = Number(product.price);
              const comparePrice = product.compareAtPrice ? Number(product.compareAtPrice) : null;
              const discount = comparePrice ? Math.round((1 - price / comparePrice) * 100) : null;

              return (
                <Link
                  key={product.id}
                  href={`/produto/${product.slug}?tenant=${subdomain}`}
                  className="product-card"
                >
                  <div className="product-card-img">
                    {CATEGORY_ICONS[product.category] || <Package />}
                    {discount && (
                      <span className="product-card-badge">-{discount}%</span>
                    )}
                  </div>
                  <div className="product-card-body">
                    <div className="product-card-category">
                      {CATEGORY_LABELS[product.category] || product.category}
                    </div>
                    <div className="product-card-name">{product.name}</div>
                    <div className="product-card-desc">
                      {product.shortDescription || product.description}
                    </div>
                    <div className="product-card-footer">
                      <div>
                        <span className="product-card-price">{formatCurrency(price)}</span>
                        {comparePrice && (
                          <span className="product-card-old-price">
                            {formatCurrency(comparePrice)}
                          </span>
                        )}
                      </div>
                      <span className="product-card-cta">Ver detalhes</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* About */}
      {tenant.aboutText && (
        <section id="sobre" className="store-about">
          <div className="store-content">
            <h2>Sobre {tenant.companyName}</h2>
            <p>{tenant.aboutText}</p>

            <div className="store-contact-info">
              {tenant.publicPhone && (
                <div className="store-contact-item"><Phone /> {tenant.publicPhone}</div>
              )}
              {tenant.publicEmail && (
                <div className="store-contact-item"><Mail /> {tenant.publicEmail}</div>
              )}
              {tenant.addressCity && (
                <div className="store-contact-item">
                  <MapPin /> {tenant.addressCity}/{tenant.addressState}
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
