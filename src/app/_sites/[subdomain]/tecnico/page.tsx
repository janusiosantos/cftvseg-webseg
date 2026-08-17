import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { MapPin, Clock, CheckCircle2, Calendar } from "lucide-react";
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

  // Find assigned orders for this technician that are NOT cancelled
  // For MVP, we show all pending/scheduled assigned orders
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
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-start mb-1">
          <h2 className="font-semibold text-gray-800">Resumo de Hoje</h2>
          <a
            href="/api/technician/calendar.ics"
            className="flex items-center gap-1 text-xs font-medium text-[var(--tenant-primary)] bg-[var(--tenant-primary)]/10 px-2 py-1 rounded-md hover:bg-[var(--tenant-primary)]/20 transition-colors"
          >
            <Calendar size={14} />
            Sincronizar Agenda
          </a>
        </div>
        <p className="text-sm text-gray-500 mb-4">{formatDateLong(new Date())}</p>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <span className="text-2xl font-bold text-blue-700">{orders.length}</span>
            <p className="text-xs text-blue-600 font-medium">Serviços Pendentes</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg border border-green-100">
            <span className="text-2xl font-bold text-green-700">{completedOrdersCount}</span>
            <p className="text-xs text-green-600 font-medium">Concluídos</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-gray-800 px-1">Próximos Serviços</h3>
        
        {orders.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl border border-gray-100 border-dashed">
            <CheckCircle2 size={40} className="mx-auto text-green-400 mb-2 opacity-50" />
            <p className="text-gray-500 text-sm">Nenhum serviço pendente.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-50 flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-gray-800">{order.customerName}</h4>
                  <p className="text-xs text-gray-500 mt-1">Pedido #{order.id.slice(-6).toUpperCase()}</p>
                </div>
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-[10px] font-bold rounded">
                  {order.status === "IN_PROGRESS" ? "EM ANDAMENTO" : "AGENDADO"}
                </span>
              </div>
              
              <div className="p-4 space-y-3 bg-gray-50/50">
                <div className="flex items-start text-sm">
                  <Clock size={16} className="text-gray-400 mr-2 mt-0.5 shrink-0" />
                  <span className="text-gray-700">
                    {order.scheduledDate ? formatDateLong(order.scheduledDate) : "Data não definida"}
                    {order.scheduledTimeStart && <><br /><span className="font-semibold">{order.scheduledTimeStart}</span></>}
                  </span>
                </div>
                
                <div className="flex items-start text-sm">
                  <MapPin size={16} className="text-gray-400 mr-2 mt-0.5 shrink-0" />
                  <span className="text-gray-700">
                    {order.installAddress}, {order.installNumber || "S/N"}<br />
                    <span className="text-gray-500 text-xs">{order.installCity} - {order.installState}</span>
                  </span>
                </div>

                <div className="pt-2">
                  <a
                    href={`https://wa.me/55${order.customerPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full py-2 px-4 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Falar no WhatsApp
                  </a>
                </div>
              </div>
              
              <div className="p-3 border-t border-gray-100 bg-white">
                <ActionButtons orderId={order.id} status={order.status} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
