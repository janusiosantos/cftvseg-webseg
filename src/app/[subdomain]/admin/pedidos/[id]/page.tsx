import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatCurrency, formatDateLong, formatCnpj, formatPhone } from "@/lib/utils";
import { decryptCpf } from "@/lib/cpf";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import Link from "next/link";
import { AssignTechnicianSelect } from "../AssignTechnicianSelect";
import { CancelScheduleButton } from "../CancelScheduleButton";

interface Props {
  params: Promise<{ subdomain: string; id: string }>;
}

export default async function DetalhePedidoPage({ params }: Props) {
  const { subdomain, id } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { subdomain } });
  
  if (!tenant) notFound();

  const order = await prisma.order.findUnique({
    where: { id, tenantId: tenant.id },
    include: {
      items: true,
      technician: true,
      schedule: true,
      serviceRecord: true,
    },
  });

  if (!order) notFound();

  const technicians = await prisma.user.findMany({
    where: { tenantId: tenant.id, role: "TECHNICIAN", isActive: true },
    select: { id: true, name: true },
  });

  const status = ORDER_STATUS_LABELS[order.status] || { label: order.status, color: "#94a3b8" };
  const cpf = order.customerCpfEncrypted ? decryptCpf(order.customerCpfEncrypted) : "N/A";

  return (
    <>
      <div className="mb-6">
        <Link href={`/admin/pedidos?tenant=${subdomain}`} className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
          ← Voltar para Pedidos
        </Link>
      </div>

      <div className="admin-page-header flex justify-between items-start">
        <div>
          <h1 className="admin-page-title text-3xl font-bold text-gray-100 mb-2">Pedido #{order.id.slice(-6).toUpperCase()}</h1>
          <p className="text-gray-400">Criado em {formatDateLong(order.createdAt)}</p>
        </div>
        <span style={{
          background: `${status.color}1a`,
          color: status.color,
          border: `1px solid ${status.color}33`,
          padding: "6px 12px",
          borderRadius: "999px",
          fontWeight: 700,
          fontSize: "14px",
        }}>
          {status.label}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="md:col-span-2 space-y-6">
          {/* Itens do Pedido */}
          <div className="bg-[#1e2330] border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-200 border-b border-gray-700 pb-3 mb-4">Itens do Pedido</h3>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2">
                  <div>
                    <p className="text-gray-300 font-medium">{item.productName}</p>
                    <p className="text-sm text-gray-500">Qtd: {item.quantity}</p>
                  </div>
                  <p className="text-gray-200 font-semibold">{formatCurrency(Number(item.unitPrice))}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-700 mt-4 pt-4 flex justify-between items-center">
              <span className="text-gray-400 font-medium">Total Pago</span>
              <span className="text-2xl font-bold text-gray-100">{formatCurrency(Number(order.totalAmount))}</span>
            </div>
          </div>

          {/* Dados da Instalação */}
          <div className="bg-[#1e2330] border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-200 border-b border-gray-700 pb-3 mb-4">Local de Instalação</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="block text-gray-500 mb-1">Endereço Completo</span>
                <p className="text-gray-300">{order.installAddress}, {order.installNumber || "S/N"}</p>
                {order.installComplement && <p className="text-gray-400 text-xs">{order.installComplement}</p>}
                <p className="text-gray-300">{order.installNeighborhood}</p>
                <p className="text-gray-300">{order.installCity} - {order.installState}</p>
                <p className="text-gray-400 text-xs mt-1">CEP: {order.installZip}</p>
              </div>
              <div>
                <span className="block text-gray-500 mb-1">Agendamento</span>
                {order.scheduledDate ? (
                  <>
                    <p className="text-gray-300">{formatDateLong(order.scheduledDate)}</p>
                    <p className="text-gray-300 font-medium">
                      {order.scheduledTimeStart} às {order.scheduledTimeEnd}
                    </p>
                    {order.schedule && (
                      <CancelScheduleButton scheduleId={order.schedule.id} />
                    )}
                  </>
                ) : (
                  <p className="text-yellow-500">Não agendado no checkout</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Coluna Lateral */}
        <div className="space-y-6">
          {/* Dados do Cliente */}
          <div className="bg-[#1e2330] border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-200 border-b border-gray-700 pb-3 mb-4">Cliente</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="block text-gray-500 text-xs">Nome</span>
                <p className="text-gray-300">{order.customerName}</p>
              </div>
              <div>
                <span className="block text-gray-500 text-xs">CPF</span>
                <p className="text-gray-300">{cpf}</p>
              </div>
              <div>
                <span className="block text-gray-500 text-xs">E-mail</span>
                <p className="text-gray-300 break-all">{order.customerEmail}</p>
              </div>
              <div>
                <span className="block text-gray-500 text-xs">Telefone / WhatsApp</span>
                <p className="text-gray-300">
                  <a href={`https://wa.me/55${order.customerPhone}`} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                    {formatPhone(order.customerPhone)}
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Atribuição de Técnico */}
          <div className="bg-[#1e2330] border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-200 border-b border-gray-700 pb-3 mb-4">Equipe</h3>
            <div>
              <span className="block text-gray-500 text-xs mb-2">Técnico Responsável</span>
              <AssignTechnicianSelect
                orderId={order.id}
                currentTechnicianId={order.technicianId}
                technicians={technicians}
              />
            </div>

            {order.serviceRecord && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <span className="block text-gray-500 text-xs mb-2">Check-in Realizado</span>
                <p className="text-green-400 text-sm">
                  {order.serviceRecord.checkInTime ? formatDateLong(order.serviceRecord.checkInTime) : "Sim"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
