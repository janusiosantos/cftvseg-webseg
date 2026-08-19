import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { DeleteProductButton } from "./DeleteProductButton";
import { Package } from "lucide-react";

interface Props {
  params: Promise<{ subdomain: string }>;
}

export default async function ProdutosAdminPage({ params }: Props) {
  const { subdomain } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { subdomain } });
  if (!tenant) notFound();

  const products = await prisma.product.findMany({
    where: { tenantId: tenant.id },
    orderBy: { sortOrder: "asc" },
  });

  const CATEGORY_LABELS: Record<string, string> = {
    CFTV: "CFTV",
    CERCA_ELETRICA: "Cerca Elétrica",
    ALARME: "Alarme",
    SENSOR: "Sensores",
    AUTOMACAO: "Automação",
    SERVICO: "Serviço",
    OUTROS: "Outros",
  };

  return (
    <>
      <div className="admin-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="admin-page-title">Produtos</h1>
          <p className="admin-page-subtitle">{products.length} produtos cadastrados</p>
        </div>
        <Link
          href={`/admin/produtos/novo?tenant=${subdomain}`}
          style={{
            padding: "10px 24px",
            background: "linear-gradient(135deg, #6366f1, #818cf8)",
            color: "#fff",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          + Novo Produto
        </Link>
      </div>

      <div style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "12px",
        overflow: "hidden",
      }}>
        {products.length === 0 ? (
          <div className="admin-empty-state" style={{ padding: "48px", textAlign: "center", color: "#475569" }}>
            <div className="admin-empty-icon" style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
              <Package size={48} />
            </div>
            <h3 className="admin-empty-title" style={{ fontSize: "18px", fontWeight: 600, color: "#94a3b8" }}>Nenhum produto cadastrado</h3>
            <p style={{ fontSize: "14px" }}>Adicione seus kits e serviços para começar a vender.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Produto", "Categoria", "Preço", "Duração", "Status", "Ações"].map((h) => (
                  <th key={h} style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#64748b",
                    textTransform: "uppercase" as const,
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    background: "rgba(0,0,0,0.2)",
                    letterSpacing: "0.05em",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#e2e8f0" }}>{product.name}</div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>{product.shortDescription}</div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#818cf8",
                      background: "rgba(99,102,241,0.1)",
                      padding: "4px 10px",
                      borderRadius: "20px",
                    }}>
                      {CATEGORY_LABELS[product.category] || product.category}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: "14px", fontWeight: 700, color: "#f1f5f9" }}>
                    {formatCurrency(Number(product.price))}
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", color: "#94a3b8" }}>
                    {Math.floor(product.estimatedDurationMin / 60)}h{product.estimatedDurationMin % 60 > 0 ? `${product.estimatedDurationMin % 60}min` : ""}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "12px",
                      fontWeight: 600,
                      padding: "4px 12px",
                      borderRadius: "20px",
                      background: product.isActive ? "rgba(34,197,94,0.12)" : "rgba(107,114,128,0.12)",
                      color: product.isActive ? "#22c55e" : "#6b7280",
                    }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "currentColor" }} />
                      {product.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div className="flex gap-3 items-center">
                      <Link
                        href={`/admin/produtos/${product.id}/editar?tenant=${subdomain}`}
                        className="text-blue-500 hover:text-blue-700 font-medium text-xs"
                      >
                        Editar
                      </Link>
                      <DeleteProductButton productId={product.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
