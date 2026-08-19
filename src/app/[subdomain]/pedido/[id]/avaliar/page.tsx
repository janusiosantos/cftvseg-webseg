import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ReviewForm } from "./ReviewForm";
import { Star, AlertCircle, CheckCircle } from "lucide-react";
import "../../../../store.css";

export default async function AvaliarPedidoPage({ params }: { params: Promise<{ subdomain: string; id: string }> }) {
  const { subdomain, id } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { subdomain },
  });

  if (!tenant) notFound();

  const order = await prisma.order.findUnique({
    where: { id, tenantId: tenant.id },
    include: {
      serviceRecord: {
        include: { technician: true }
      },
      items: true,
    }
  });

  if (!order || !order.serviceRecord) {
    return (
      <div className="store-page">
        <div className="checkout-container" style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="checkout-glass-card" style={{ textAlign: "center", padding: "48px", maxWidth: "500px" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px", color: "#64748b" }}>
              <AlertCircle size={48} />
            </div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>Avaliação Indisponível</h1>
            <p style={{ color: "#64748b" }}>O serviço ainda não foi finalizado ou o pedido não existe.</p>
          </div>
        </div>
      </div>
    );
  }

  if (order.serviceRecord.reviewScore) {
    return (
      <div className="store-page">
        <div className="checkout-container" style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="checkout-glass-card" style={{ textAlign: "center", padding: "48px", maxWidth: "500px" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px", color: "#22c55e" }}>
              <CheckCircle size={64} />
            </div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>Avaliação Registrada!</h1>
            <p style={{ color: "#475569", marginBottom: "16px" }}>Você já avaliou este serviço com {order.serviceRecord.reviewScore} estrela(s).</p>
            <div style={{ display: "flex", justifyContent: "center", gap: "4px", marginBottom: "16px" }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={24} fill={i < (order.serviceRecord?.reviewScore || 0) ? "#f59e0b" : "transparent"} color={i < (order.serviceRecord?.reviewScore || 0) ? "#f59e0b" : "#cbd5e1"} />
              ))}
            </div>
            <p style={{ color: "#64748b", fontSize: "14px" }}>Muito obrigado pelo seu feedback!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="store-page">
      <div className="checkout-container" style={{ padding: "40px 20px", maxWidth: "600px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em" }}>Avalie seu Serviço</h1>
          <p style={{ color: "#64748b", marginTop: "8px" }}>Sua opinião é muito importante para nós.</p>
        </div>

        <div className="checkout-glass-card" style={{ padding: "32px" }}>
          <div style={{ marginBottom: "24px", paddingBottom: "24px", borderBottom: "1px solid rgba(0,0,0,0.06)", textAlign: "center" }}>
            <h3 style={{ fontWeight: 700, color: "#0f172a", fontSize: "18px" }}>{order.items[0]?.productName}</h3>
            <p style={{ fontSize: "14px", color: "#64748b", marginTop: "6px" }}>
              Técnico: <span style={{ fontWeight: 600, color: "#334155" }}>{order.serviceRecord.technician.name}</span>
            </p>
          </div>

          <ReviewForm serviceRecordId={order.serviceRecord.id} />
        </div>
      </div>
    </div>
  );
}
