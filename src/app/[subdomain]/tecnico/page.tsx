import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { MapPin, Clock, Calendar, CheckSquare, RefreshCw, MessageCircle } from "lucide-react";
import { formatDateLong } from "@/lib/utils";
import { ActionButtons } from "./ActionButtons";

interface Props {
  params: Promise<{ subdomain: string }>;
}

export default async function TecnicoDashboardPage({ params }: Props) {
  const session = await auth();
  const { subdomain } = await params;

  if (!session) return null;

  const tenant = await prisma.tenant.findUnique({
    where: { subdomain },
  });

  if (!tenant) notFound();

  const orders = await prisma.order.findMany({
    where: {
      tenantId: tenant.id,
      technicianId: session.user.id,
      status: {
        in: ["SCHEDULED", "IN_PROGRESS"],
      },
    },
    include: {
      schedule: true,
      items: true,
    },
    orderBy: {
      scheduledDate: "asc",
    },
  });

  const completedOrdersCount = await prisma.order.count({
    where: {
      tenantId: tenant.id,
      technicianId: session.user.id,
      status: "COMPLETED",
    },
  });

  return (
    <>
      <div className="tech-summary">
        <div className="tech-summary-header">
          <div>
            <h2 className="tech-summary-title">Resumo de Hoje</h2>
            <p className="tech-summary-date">{formatDateLong(new Date())}</p>
          </div>
          <a href="/api/technician/calendar.ics" className="tech-summary-sync">
            <RefreshCw /> Sincronizar
          </a>
        </div>
        
        <div className="tech-stats">
          <div className="tech-stat-box blue">
            <div className="tech-stat-number">{orders.length}</div>
            <div className="tech-stat-label">Pendentes</div>
          </div>
          <div className="tech-stat-box green">
            <div className="tech-stat-number">{completedOrdersCount}</div>
            <div className="tech-stat-label">Concluídos</div>
          </div>
        </div>
      </div>

      <h3 className="tech-section-title">Próximos Serviços</h3>
      
      <div className="tech-services">
        {orders.length === 0 ? (
          <div className="tech-empty">
            <CheckSquare />
            <div className="tech-empty-text">Nenhum serviço pendente.<br/>Bom trabalho!</div>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="tech-service-card">
              <div className="tech-service-header">
                <div>
                  <h4 className="tech-service-name">{order.customerName}</h4>
                  <div className="tech-service-id">Pedido #{order.id.slice(-6).toUpperCase()}</div>
                </div>
                <div className={`tech-service-status ${order.status === "IN_PROGRESS" ? "in-progress" : "scheduled"}`}>
                  {order.status === "IN_PROGRESS" ? "Em Andamento" : "Agendado"}
                </div>
              </div>
              
              <div className="tech-service-body">
                <div className="tech-service-detail">
                  <Clock />
                  <div>
                    {order.scheduledDate ? formatDateLong(order.scheduledDate) : "Data não definida"}
                    {order.scheduledTimeStart && <div><strong>{order.scheduledTimeStart}</strong></div>}
                  </div>
                </div>
                
                <div className="tech-service-detail">
                  <MapPin />
                  <div>
                    <strong>{order.installAddress}, {order.installNumber || "S/N"}</strong>
                    <div style={{ fontSize: "12px", marginTop: "2px" }}>
                      {order.installCity} - {order.installState}
                    </div>
                  </div>
                </div>

                <a
                  href={`https://wa.me/55${order.customerPhone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tech-whatsapp-btn"
                >
                  <MessageCircle />
                  Falar no WhatsApp
                </a>
              </div>
              
              <div className="tech-service-actions">
                <ActionButtons orderId={order.id} status={order.status} />
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
