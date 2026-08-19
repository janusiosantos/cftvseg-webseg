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
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-semibold text-gray-800">Serviços Concluídos</h3>
        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full font-medium">
          {orders.length} total
        </span>
      </div>
      
      {orders.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl border border-gray-100 border-dashed">
          <CheckCircle2 size={40} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500 text-sm">Nenhum serviço concluído ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-3 border-b border-gray-50 flex justify-between items-start bg-gray-50/30">
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm">{order.customerName}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Pedido #{order.id.slice(-6).toUpperCase()}</p>
                </div>
                <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-[10px] font-bold rounded flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  CONCLUÍDO
                </span>
              </div>
              
              <div className="p-3 space-y-2">
                <div className="flex items-start text-xs">
                  <Clock size={14} className="text-gray-400 mr-2 mt-0.5 shrink-0" />
                  <span className="text-gray-600">
                    {order.serviceRecord?.checkOutTime 
                      ? formatDateLong(order.serviceRecord.checkOutTime)
                      : order.updatedAt 
                        ? formatDateLong(order.updatedAt) 
                        : "Data não definida"}
                  </span>
                </div>
                
                <div className="flex items-start text-xs">
                  <MapPin size={14} className="text-gray-400 mr-2 mt-0.5 shrink-0" />
                  <span className="text-gray-600">
                    {order.installAddress}, {order.installCity}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
