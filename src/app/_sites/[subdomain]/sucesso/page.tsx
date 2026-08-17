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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div 
          className="h-32 flex items-center justify-center relative"
          style={{ background: `linear-gradient(135deg, ${tenant.primaryColor}, ${tenant.secondaryColor})` }}
        >
          <div className="absolute -bottom-10 bg-white p-2 rounded-full shadow-lg">
            {isPending ? (
              <Clock size={64} className="text-yellow-500" />
            ) : (
              <CheckCircle2 size={64} className="text-green-500" />
            )}
          </div>
        </div>
        
        <div className="pt-16 px-8 pb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isPending ? "Pagamento em Processamento" : "Pedido Confirmado!"}
          </h1>
          <p className="text-gray-600 mb-8">
            {isPending 
              ? "Estamos aguardando a confirmação do pagamento. Você receberá um e-mail em breve." 
              : `Obrigado por escolher a ${tenant.companyName}. Sua instalação foi agendada com sucesso.`}
          </p>
          
          {order && (
            <div className="text-left bg-gray-50 rounded-xl p-6 mb-8 border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">Detalhes da Instalação</h3>
              
              <div className="space-y-4 text-sm">
                <div className="flex items-start">
                  <Calendar className="text-gray-400 mr-3 shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="font-medium text-gray-900">
                      {order.scheduledDate ? formatDateLong(order.scheduledDate) : "Data a definir"}
                    </p>
                    {order.scheduledTimeStart && (
                      <p className="text-gray-500">Entre {order.scheduledTimeStart} e {order.scheduledTimeEnd}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start">
                  <MapPin className="text-gray-400 mr-3 shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="font-medium text-gray-900">{order.installAddress}, {order.installNumber}</p>
                    <p className="text-gray-500">{order.installCity} - {order.installState}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-500 mb-8">
            Em caso de dúvidas, entre em contato através do nosso WhatsApp: <br/>
            <strong className="text-gray-800">{tenant.publicPhone || tenant.phone}</strong>
          </div>

          <Link
            href={`/?tenant=${subdomain}`}
            className="block w-full text-center py-3 rounded-xl font-medium text-white shadow-md hover:opacity-90 transition-opacity"
            style={{ backgroundColor: tenant.primaryColor }}
          >
            Voltar para o site
          </Link>
        </div>
      </div>
    </div>
  );
}
