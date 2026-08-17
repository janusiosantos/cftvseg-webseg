import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ subdomain: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subdomain, slug } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { subdomain } });
  if (!tenant) return { title: "Produto não encontrado" };
  const product = await prisma.product.findUnique({ where: { tenantId_slug: { tenantId: tenant.id, slug } } });
  if (!product) return { title: "Produto não encontrado" };
  return {
    title: `${product.name} | ${tenant.companyName}`,
    description: product.shortDescription || product.description || "",
  };
}

export default async function ProductPage({ params }: Props) {
  const { subdomain, slug } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { subdomain } });
  if (!tenant) notFound();

  const product = await prisma.product.findUnique({
    where: { tenantId_slug: { tenantId: tenant.id, slug } },
    include: {
      upsellsFrom: {
        include: { upsellProduct: true },
      },
    },
  });

  if (!product || !product.isActive) notFound();

  const price = Number(product.price);
  const comparePrice = product.compareAtPrice ? Number(product.compareAtPrice) : null;
  const discount = comparePrice ? Math.round((1 - price / comparePrice) * 100) : null;
  const durationHours = Math.floor(product.estimatedDurationMin / 60);
  const durationMins = product.estimatedDurationMin % 60;

  return (
    <>
      <style>{`
        .product-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 24px;
        }
        .product-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: start;
        }
        .product-gallery {
          aspect-ratio: 4/3;
          background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 80px;
          position: relative;
          overflow: hidden;
        }
        .product-discount-badge {
          position: absolute;
          top: 16px;
          left: 16px;
          background: #ef4444;
          color: #fff;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 700;
        }
        .product-info {
          padding-top: 8px;
        }
        .product-category-tag {
          display: inline-block;
          font-size: 12px;
          font-weight: 700;
          color: var(--store-primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }
        .product-title {
          font-size: 32px;
          font-weight: 900;
          color: #0f172a;
          margin-bottom: 12px;
          line-height: 1.2;
        }
        .product-short-desc {
          font-size: 16px;
          color: #475569;
          margin-bottom: 24px;
          line-height: 1.6;
        }
        .product-price-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
        }
        .product-current-price {
          font-size: 36px;
          font-weight: 900;
          color: var(--store-primary);
        }
        .product-old-price {
          font-size: 18px;
          color: #94a3b8;
          text-decoration: line-through;
          margin-left: 12px;
        }
        .product-savings {
          font-size: 14px;
          color: #22c55e;
          font-weight: 600;
          margin-top: 4px;
        }
        .product-meta {
          display: flex;
          gap: 24px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .product-meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #475569;
          background: #f1f5f9;
          padding: 8px 16px;
          border-radius: 8px;
        }
        .product-buy-btn {
          width: 100%;
          padding: 16px;
          background: var(--store-primary);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 18px;
          font-weight: 800;
          cursor: pointer;
          transition: all 250ms ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .product-buy-btn:hover {
          opacity: 0.9;
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
        }
        .product-description {
          margin-top: 32px;
          padding-top: 32px;
          border-top: 1px solid #e2e8f0;
        }
        .product-description h3 {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 16px;
        }
        .product-description-text {
          color: #475569;
          line-height: 1.8;
          white-space: pre-wrap;
        }
        .upsells {
          margin-top: 32px;
        }
        .upsells h3 {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 16px;
        }
        .upsell-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }
        .upsell-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
          text-decoration: none;
          color: inherit;
          transition: all 200ms;
        }
        .upsell-card:hover {
          border-color: var(--store-primary);
          transform: translateY(-2px);
        }
        .upsell-name {
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 4px;
        }
        .upsell-price {
          font-size: 16px;
          font-weight: 700;
          color: var(--store-primary);
        }
        @media (max-width: 768px) {
          .product-layout {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .product-title {
            font-size: 24px;
          }
        }
      `}</style>

      <div className="product-page">
        <div className="store-breadcrumb">
          <a href={`/?tenant=${subdomain}`}>Início</a> › <span>{product.name}</span>
        </div>

        <div className="product-layout">
          {/* Gallery */}
          <div className="product-gallery">
            {product.category === "CFTV" ? "📹" :
             product.category === "CERCA_ELETRICA" ? "⚡" :
             product.category === "ALARME" ? "🔔" :
             product.category === "SERVICO" ? "🔧" : "📦"}
            {discount && (
              <span className="product-discount-badge">-{discount}%</span>
            )}
          </div>

          {/* Info */}
          <div className="product-info">
            <span className="product-category-tag">
              {product.category === "CFTV" ? "CFTV / Câmeras" :
               product.category === "CERCA_ELETRICA" ? "Cerca Elétrica" :
               product.category === "ALARME" ? "Alarme" :
               product.category === "SERVICO" ? "Serviço" : product.category}
            </span>
            <h1 className="product-title">{product.name}</h1>
            <p className="product-short-desc">
              {product.shortDescription || ""}
            </p>

            <div className="product-price-box">
              <div>
                <span className="product-current-price">{formatCurrency(price)}</span>
                {comparePrice && (
                  <span className="product-old-price">{formatCurrency(comparePrice)}</span>
                )}
              </div>
              {comparePrice && (
                <div className="product-savings">
                  Economia de {formatCurrency(comparePrice - price)} ({discount}% OFF)
                </div>
              )}
            </div>

            <div className="product-meta">
              <div className="product-meta-item">
                ⏱️ Instalação: ~{durationHours}h{durationMins > 0 ? `${durationMins}min` : ""}
              </div>
              <div className="product-meta-item">
                ✅ Garantia inclusa
              </div>
              <div className="product-meta-item">
                💳 Mercado Pago
              </div>
            </div>

            <a
              href={`/checkout?tenant=${subdomain}&product=${product.id}`}
              className="product-buy-btn"
            >
              🛒 Comprar com Instalação →
            </a>

            {/* Upsells */}
            {product.upsellsFrom.length > 0 && (
              <div className="upsells">
                <h3>Adicione também:</h3>
                <div className="upsell-cards">
                  {product.upsellsFrom.map((upsell) => (
                    <a
                      key={upsell.id}
                      href={`/produto/${upsell.upsellProduct.slug}?tenant=${subdomain}`}
                      className="upsell-card"
                    >
                      <div className="upsell-name">{upsell.upsellProduct.name}</div>
                      <div className="upsell-price">
                        {formatCurrency(Number(upsell.upsellProduct.price))}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Full Description */}
        {product.description && (
          <div className="product-description">
            <h3>Descrição completa</h3>
            <div className="product-description-text">{product.description}</div>
          </div>
        )}
      </div>
    </>
  );
}
