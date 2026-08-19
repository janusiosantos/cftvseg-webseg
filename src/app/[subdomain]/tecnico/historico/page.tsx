import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { MapPin, Clock, CheckCircle2 } from "lucide-react";
import { formatDateLong } from "@/lib/utils";
import Link from "next/link";

interface Props {
  params: Promise<{ subdomain: string }>;
}

export default async function TecnicoHistoricoPage({ params }: Props) {
  const session = await auth();
  const { subdomain } = await params;

  if (!session) return null;

  const tenant = await prisma.tenant.findUnique({
    where: { subdomain },
  });

  if (!tenant) notFound();

  // Find completed orders for this technician
  const orders = await prisma.order.findMany({
    where: {
      tenantId: tenant.id,
      technicianId: session.user.id,
      status: "COMPLETED",
    },
    include: {
      schedule: true,
      serviceRecord: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 50,
  });

  return (
    <>
      <div className="tech-history-header">
        <h3 className="tech-history-title">Serviços Concluídos</h3>
        <span className="tech-history-count">
          {orders.length} total
        </span>
      </div>
      
      {orders.length === 0 ? (
        <div className="tech-history-empty">
          <CheckCircle2 size={40} />
          <p>Nenhum serviço concluído ainda.</p>
        </div>
      ) : (
        <div className="tech-history-list">
          {orders.map((order) => (
            <div key={order.id} className="tech-history-card">
              <div className="tech-history-card-header">
                <div>
                  <h4 className="tech-history-name">{order.customerName}</h4>
                  <p className="tech-history-order-id">Pedido #{order.id.slice(-6).toUpperCase()}</p>
                </div>
                <span className="tech-completed-badge">
                  <CheckCircle2 size={12} />
                  CONCLUÍDO
                </span>
              </div>
              
              <div className="tech-history-card-body">
                <div className="tech-history-detail">
                  <Clock size={14} />
                  <span>
                    {order.serviceRecord?.checkOutTime 
                      ? formatDateLong(order.serviceRecord.checkOutTime)
                      : order.updatedAt 
                        ? formatDateLong(order.updatedAt) 
                        : "Data não definida"}
                  </span>
                </div>
                
                <div className="tech-history-detail">
                  <MapPin size={14} />
                  <span>
                    {order.installAddress}, {order.installCity}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
