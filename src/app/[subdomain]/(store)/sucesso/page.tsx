import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Calendar, MapPin, Clock } from "lucide-react";
import { formatDateLong } from "@/lib/utils";

interface Props {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ order?: string; status?: string }>;
}

export default async function SucessoPage({ params, searchParams }: Props) {
  const { subdomain } = await params;
  const { order: orderId, status } = await searchParams;

  const tenant = await prisma.tenant.findUnique({
    where: { subdomain },
  });

  if (!tenant) notFound();

  let order = null;
  if (orderId) {
    order = await prisma.order.findUnique({
      where: { id: orderId, tenantId: tenant.id },
      include: { items: true },
    });
  }

  const isPending = status === "pending";

  return (
    <>
      <style>{`
        .success-page {
          min-height: 80vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .success-card {
          max-width: 480px;
          width: 100%;
          background: #fff;
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.08);
          overflow: hidden;
        }
        .success-banner {
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .success-icon-wrapper {
          position: absolute;
          bottom: -28px;
          background: #fff;
          padding: 8px;
          border-radius: 50%;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }
        .success-body {
          padding: 48px 32px 32px;
          text-align: center;
        }
        .success-title {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 8px;
        }
        .success-desc {
          font-size: 15px;
          color: #64748b;
          margin-bottom: 32px;
          line-height: 1.6;
        }
        .success-details {
          text-align: left;
          background: #f8fafc;
          border-radius: 14px;
          padding: 24px;
          margin-bottom: 32px;
          border: 1px solid #f1f5f9;
        }
        .success-details-title {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 16px;
          padding-bottom: 10px;
          border-bottom: 1px solid #e2e8f0;
        }
        .success-detail-row {
          display: flex;
          align-items: flex-start;
          margin-bottom: 14px;
        }
        .success-detail-row:last-child {
          margin-bottom: 0;
        }
        .success-detail-row svg {
          width: 18px;
          height: 18px;
          color: #94a3b8;
          margin-right: 12px;
          margin-top: 2px;
          flex-shrink: 0;
        }
        .success-detail-main {
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
        }
        .success-detail-sub {
          font-size: 13px;
          color: #64748b;
          margin-top: 2px;
        }
        .success-contact {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 32px;
          line-height: 1.6;
        }
        .success-contact strong {
          color: #0f172a;
        }
        .success-cta {
          display: block;
          width: 100%;
          text-align: center;
          padding: 14px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 15px;
          color: #fff;
          text-decoration: none;
          transition: all 200ms;
        }
        .success-cta:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
      `}</style>

      <div className="success-page">
        <div className="success-card">
          <div 
            className="success-banner"
            style={{ background: `linear-gradient(135deg, ${tenant.primaryColor}, ${tenant.secondaryColor})` }}
          >
            <div className="success-icon-wrapper">
              {isPending ? (
                <Clock size={56} color="#f59e0b" />
              ) : (
                <CheckCircle2 size={56} color="#22c55e" />
              )}
            </div>
          </div>
          
          <div className="success-body">
            <h1 className="success-title">
              {isPending ? "Pagamento em Processamento" : "Pedido Confirmado!"}
            </h1>
            <p className="success-desc">
              {isPending 
                ? "Estamos aguardando a confirmação do pagamento. Você receberá um e-mail em breve." 
                : `Obrigado por escolher a ${tenant.companyName}. Sua instalação foi agendada com sucesso.`}
            </p>
            
            {order && (
              <div className="success-details">
                <h3 className="success-details-title">Detalhes da Instalação</h3>
                
                <div className="success-detail-row">
                  <Calendar size={18} />
                  <div>
                    <p className="success-detail-main">
                      {order.scheduledDate ? formatDateLong(order.scheduledDate) : "Data a definir"}
                    </p>
                    {order.scheduledTimeStart && (
                      <p className="success-detail-sub">Entre {order.scheduledTimeStart} e {order.scheduledTimeEnd}</p>
                    )}
                  </div>
                </div>
                
                <div className="success-detail-row">
                  <MapPin size={18} />
                  <div>
                    <p className="success-detail-main">{order.installAddress}, {order.installNumber}</p>
                    <p className="success-detail-sub">{order.installCity} - {order.installState}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="success-contact">
              Em caso de dúvidas, entre em contato através do nosso WhatsApp: <br/>
              <strong>{tenant.publicPhone || tenant.phone}</strong>
            </div>

            <Link
              href={`/?tenant=${subdomain}`}
              className="success-cta"
              style={{ backgroundColor: tenant.primaryColor }}
            >
              Voltar para o site
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
