import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { CreateCouponForm } from "./CreateCouponForm";
import { formatCurrency, formatDateLong } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { DeleteCouponButton } from "./DeleteCouponButton";

interface Props {
  params: Promise<{ subdomain: string }>;
}

export default async function AdminCouponsPage({ params }: Props) {
  const session = await auth();
  const { subdomain } = await params;

  if (!session || (session.user.role !== "PARTNER_ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    redirect(`/login?callbackUrl=/admin/cupons&tenant=${subdomain}`);
  }

  const tenant = await prisma.tenant.findUnique({
    where: { subdomain },
    include: {
      coupons: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!tenant || tenant.id !== session.user.tenantId) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Cupons de Desconto</h1>
          <p className="text-gray-500 mt-1">Crie promoções e fidelize seus clientes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-1">
          <CreateCouponForm tenantId={tenant.id} />
        </div>

        {/* List Column */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {tenant.coupons.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Nenhum cupom cadastrado ainda.
              </div>
            ) : (
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-700">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Cupom</th>
                    <th className="px-6 py-4 font-semibold">Desconto</th>
                    <th className="px-6 py-4 font-semibold">Uso</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tenant.coupons.map((coupon) => {
                    const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
                    const isMaxedOut = coupon.maxUses && coupon.uses >= coupon.maxUses;
                    const isActive = coupon.isActive && !isExpired && !isMaxedOut;

                    return (
                      <tr key={coupon.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                            {coupon.code}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium">
                          {coupon.discountType === "PERCENTAGE"
                            ? `${Number(coupon.discountValue)}%`
                            : formatCurrency(Number(coupon.discountValue))}
                        </td>
                        <td className="px-6 py-4">
                          {coupon.uses} {coupon.maxUses ? `/ ${coupon.maxUses}` : ""}
                        </td>
                        <td className="px-6 py-4">
                          {isActive ? (
                            <span className="inline-flex px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Ativo</span>
                          ) : (
                            <span className="inline-flex px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">Inativo</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <DeleteCouponButton id={coupon.id} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
