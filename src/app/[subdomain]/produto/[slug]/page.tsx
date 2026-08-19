import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import type { Metadata } from "next";
import { Video, Zap, Bell, Radio, Home, Wrench, Package, Clock, ShieldCheck, CreditCard, ShoppingCart } from "lucide-react";

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
        .product-page { max-width: 1200px; margin: 0 auto; padding: 32px 24px; }
        .product-layout { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 48px; align-items: start; margin-top: 24px; }
        .product-gallery { aspect-ratio: 4/3; background: #f1f5f9; border-radius: 16px; display: flex; align-items: center; justify-content: center; color: #cbd5e1; position: relative; }
        .product-discount-badge { position: absolute; top: 16px; left: 16px; background: #ef4444; color: #fff; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 700; }
        .product-category { display: inline-block; font-size: 12px; font-weight: 700; color: var(--store-primary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
        .product-title { font-size: 32px; font-weight: 900; color: #0f172a; margin-bottom: 12px; line-height: 1.2; }
        .product-short-desc { font-size: 16px; color: #475569; margin-bottom: 24px; line-height: 1.6; }
        .product-price-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
        .product-current-price { font-size: 36px; font-weight: 900; color: var(--store-primary); }
        .product-old-price { font-size: 18px; color: #94a3b8; text-decoration: line-through; margin-left: 12px; }
        .product-savings { font-size: 14px; color: #22c55e; font-weight: 600; margin-top: 4px; }
        .product-meta { display: flex; gap: 24px; margin-bottom: 24px; flex-wrap: wrap; }
        .product-meta-item { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #475569; background: #f1f5f9; padding: 8px 16px; border-radius: 8px; }
        .product-description { margin-top: 32px; padding-top: 32px; border-top: 1px solid #e2e8f0; }
        .product-description h3 { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 16px; }
        .product-description-text { color: #475569; line-height: 1.8; white-space: pre-wrap; }
        .upsells { margin-top: 32px; }
        .upsells h3 { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 16px; }
        .upsell-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
      `}</style>

      <div className="product-page">
        <div className="store-breadcrumb">
          <a href={`/?tenant=${subdomain}`}>Início</a> › <span>{product.name}</span>
        </div>

        <div className="product-layout">
          <div className="product-gallery">
            {product.category === "CFTV" ? <Video size={80} /> :
             product.category === "CERCA_ELETRICA" ? <Zap size={80} /> :
             product.category === "ALARME" ? <Bell size={80} /> :
             product.category === "SERVICO" ? <Wrench size={80} /> : <Package size={80} />}
            {discount && (
              <span className="product-discount-badge">-{discount}%</span>
            )}
          </div>

          {/* Info */}
          <div style={{ paddingTop: "8px" }}>
            <span style={{ 
              display: "inline-block", 
              fontSize: "12px", 
              fontWeight: 700, 
              color: "var(--store-primary)", 
              textTransform: "uppercase", 
              letterSpacing: "0.05em", 
              marginBottom: "8px" 
            }}>
              {product.category === "CFTV" ? "CFTV / Câmeras" :
               product.category === "CERCA_ELETRICA" ? "Cerca Elétrica" :
               product.category === "ALARME" ? "Alarme" :
               product.category === "SERVICO" ? "Serviço" : product.category}
            </span>
            <h1 style={{ fontSize: "32px", fontWeight: 900, color: "#0f172a", marginBottom: "12px", lineHeight: 1.2 }}>
              {product.name}
            </h1>
            <p style={{ fontSize: "16px", color: "#475569", marginBottom: "24px", lineHeight: 1.6 }}>
              {product.shortDescription || ""}
            </p>

            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", marginBottom: "24px" }}>
              <div>
                <span style={{ fontSize: "36px", fontWeight: 900, color: "var(--store-primary)" }}>
                  {formatCurrency(price)}
                </span>
                {comparePrice && (
                  <span style={{ fontSize: "18px", color: "#94a3b8", textDecoration: "line-through", marginLeft: "12px" }}>
                    {formatCurrency(comparePrice)}
                  </span>
                )}
              </div>
              {comparePrice && (
                <div style={{ fontSize: "14px", color: "#22c55e", fontWeight: 600, marginTop: "4px" }}>
                  Economia de {formatCurrency(comparePrice - price)} ({discount}% OFF)
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "24px", marginBottom: "24px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#475569", background: "#f1f5f9", padding: "8px 16px", borderRadius: "8px" }}>
                <Clock size={16} /> Instalação: ~{durationHours}h{durationMins > 0 ? `${durationMins}min` : ""}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#475569", background: "#f1f5f9", padding: "8px 16px", borderRadius: "8px" }}>
                <ShieldCheck size={16} /> Garantia inclusa
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#475569", background: "#f1f5f9", padding: "8px 16px", borderRadius: "8px" }}>
                <CreditCard size={16} /> Mercado Pago
              </div>
            </div>

            <a
              href={`/checkout?tenant=${subdomain}&product=${product.id}`}
              className="store-cart-btn"
              style={{ padding: "16px", fontSize: "18px", justifyContent: "center", width: "100%", borderRadius: "12px" }}
            >
              <ShoppingCart size={20} /> Comprar com Instalação
            </a>

            {/* Upsells */}
            {product.upsellsFrom.length > 0 && (
              <div style={{ marginTop: "32px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: "16px" }}>Adicione também:</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
                  {product.upsellsFrom.map((upsell) => (
                    <a
                      key={upsell.id}
                      href={`/produto/${upsell.upsellProduct.slug}?tenant=${subdomain}`}
                      className="product-card"
                      style={{ padding: "16px", borderRadius: "12px" }}
                    >
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", marginBottom: "4px" }}>{upsell.upsellProduct.name}</div>
                      <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--store-primary)" }}>
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
          <div style={{ marginTop: "32px", paddingTop: "32px", borderTop: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a", marginBottom: "16px" }}>Descrição completa</h3>
            <div style={{ color: "#475569", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{product.description}</div>
          </div>
        )}
      </div>
    </>
  );
}
