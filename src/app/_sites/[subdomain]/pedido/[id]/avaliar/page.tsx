import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ReviewForm } from "./ReviewForm";

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md w-full border border-gray-100">
          <h1 className="text-xl font-bold text-gray-800 mb-2">Avaliação Indisponível</h1>
          <p className="text-gray-600">O serviço ainda não foi finalizado ou o pedido não existe.</p>
        </div>
      </div>
    );
  }

  if (order.serviceRecord.reviewScore) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md w-full border border-gray-100">
          <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            ⭐
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Avaliação Registrada!</h1>
          <p className="text-gray-600">Você já avaliou este serviço com {order.serviceRecord.reviewScore} estrela(s).</p>
          <p className="text-gray-500 mt-2">Muito obrigado pelo seu feedback!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Avalie seu Serviço</h1>
          <p className="text-gray-600 mt-2">Sua opinião é muito importante para nós.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
          <div className="mb-6 pb-6 border-b border-gray-100 text-center">
            <h3 className="font-semibold text-gray-800">{order.items[0]?.productName}</h3>
            <p className="text-sm text-gray-500 mt-1">
              Técnico: <span className="font-medium text-gray-700">{order.serviceRecord.technician.name}</span>
            </p>
          </div>

          <ReviewForm serviceRecordId={order.serviceRecord.id} />
        </div>
      </div>
    </div>
  );
}
