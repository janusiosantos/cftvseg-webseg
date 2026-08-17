import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { MapPin, Clock, CreditCard, CheckCircle2 } from "lucide-react";
import { formatDateLong, formatCurrency } from "@/lib/utils";

interface Props {
  params: Promise<{ subdomain: string; id: string }>;
}

export default async function OrderTrackingPage({ params }: Props) {
  const { subdomain, id } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { subdomain },
  });

  if (!tenant) notFound();

  // Find order
  const order = await prisma.order.findUnique({
    where: { id, tenantId: tenant.id },
    include: {
      items: true,
      technician: {
        select: { name: true }
      },
      serviceRecord: true,
    }
  });

  if (!order) notFound();

  // Hide part of CPF for privacy
  const maskedCpf = order.customerCpfEncrypted ? `***.***.${order.customerCpfEncrypted.slice(-2)}` : "***";

  // Determine status color/icon
  let statusBadge = null;
  if (order.status === "PENDING_PAYMENT") {
    statusBadge = <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">Aguardando Pagamento</span>;
  } else if (order.status === "PAID" || order.status === "SCHEDULED") {
    statusBadge = <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">Agendado</span>;
  } else if (order.status === "IN_PROGRESS") {
    statusBadge = <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">Em Andamento</span>;
  } else if (order.status === "COMPLETED") {
    statusBadge = <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold flex items-center gap-1"><CheckCircle2 size={16} /> Concluído</span>;
  } else {
    statusBadge = <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">Cancelado</span>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Acompanhamento de Pedido</h1>
          <p className="text-gray-500 mt-1">{tenant.companyName}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-[var(--store-primary,#6366f1)] p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-white/80 text-sm font-medium">Pedido #{order.id.slice(-8).toUpperCase()}</p>
              <h2 className="text-xl font-bold mt-1">Olá, {order.customerName.split(" ")[0]}!</h2>
            </div>
            <div>
              {statusBadge}
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            
            {/* Timeline / Status (Simplified) */}
            {order.status === "IN_PROGRESS" && (
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex items-start gap-4">
                <div className="bg-purple-200 p-2 rounded-full text-purple-700">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-purple-900">Técnico em Check-in</h3>
                  <p className="text-sm text-purple-800 mt-1">O técnico {order.technician?.name || ""} registrou chegada no local. O serviço está em andamento.</p>
                </div>
              </div>
            )}

            {order.status === "COMPLETED" && (
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-start gap-4">
                <div className="bg-green-200 p-2 rounded-full text-green-700">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-green-900">Serviço Concluído!</h3>
                  <p className="text-sm text-green-800 mt-1">A instalação foi finalizada com sucesso. Obrigado por confiar em nossos serviços.</p>
                </div>
              </div>
            )}

            {/* Install Details */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin className="text-gray-400" />
                Local da Instalação
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700">
                <p><strong>Endereço:</strong> {order.installAddress}, {order.installNumber || "S/N"} {order.installComplement ? `- ${order.installComplement}` : ""}</p>
                <p>{order.installCity} / {order.installState}</p>
                <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 mb-1">Agendamento</p>
                    {order.scheduledDate ? (
                      <p className="font-semibold text-gray-900">
                        {formatDateLong(order.scheduledDate)} <br />
                        {order.scheduledTimeStart && order.scheduledTimeEnd ? `${order.scheduledTimeStart} às ${order.scheduledTimeEnd}` : ""}
                      </p>
                    ) : (
                      <p className="text-yellow-600 font-medium">A definir</p>
                    )}
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Técnico</p>
                    <p className="font-semibold text-gray-900">{order.technician?.name || "Aguardando atribuição"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment & Items */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CreditCard className="text-gray-400" />
                Resumo do Pedido
              </h3>
              
              <div className="space-y-3 mb-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">{item.quantity}x {item.productName}</span>
                    <span className="font-medium text-gray-900">{formatCurrency(Number(item.unitPrice))}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <span className="font-medium text-gray-600">Total Pago</span>
                <span className="text-xl font-bold text-[var(--store-primary,#6366f1)]">{formatCurrency(Number(order.totalAmount))}</span>
              </div>
            </div>

          </div>
          
          <div className="bg-gray-50 p-4 text-center text-xs text-gray-500 border-t border-gray-100">
            Qualquer dúvida, entre em contato com {tenant.publicPhone ? `nosso suporte: ${tenant.publicPhone}` : "nossa equipe."}
          </div>
        </div>
      </div>
    </div>
  );
}
