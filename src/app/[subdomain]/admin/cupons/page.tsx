import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { CreateCouponForm } from "./CreateCouponForm";
import { formatCurrency, formatDateLong } from "@/lib/utils";
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

  if (!tenant) {
    notFound();
  }

  if (session.user.role === "PARTNER_ADMIN" && tenant.id !== session.user.tenantId) {
    notFound();
  }

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Cupons de Desconto</h1>
        <p className="admin-page-subtitle">Crie promoções e fidelize seus clientes.</p>
      </div>

      <div className="admin-grid-2" style={{ gridTemplateColumns: "350px 1fr", gap: "24px" }}>
        {/* Form Column */}
        <div>
          <CreateCouponForm tenantId={tenant.id} />
        </div>

        {/* List Column */}
        <div>
          <div className="admin-table-wrapper">
            {tenant.coupons.length === 0 ? (
              <div className="admin-empty-state">
                <h3 className="admin-empty-title">Nenhum cupom cadastrado</h3>
                <p className="admin-empty-desc">Crie seu primeiro cupom ao lado.</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Cupom</th>
                    <th>Desconto</th>
                    <th>Uso</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {tenant.coupons.map((coupon) => {
                    const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
                    const isMaxedOut = coupon.maxUses && coupon.uses >= coupon.maxUses;
                    const isActive = coupon.isActive && !isExpired && !isMaxedOut;

                    return (
                      <tr key={coupon.id}>
                        <td>
                          <span style={{ 
                            fontFamily: "monospace", 
                            fontWeight: 700, 
                            color: "#818cf8",
                            background: "rgba(99,102,241,0.1)",
                            padding: "4px 8px",
                            borderRadius: "4px"
                          }}>
                            {coupon.code}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: "#f1f5f9" }}>
                          {coupon.discountType === "PERCENTAGE"
                            ? `${Number(coupon.discountValue)}%`
                            : formatCurrency(Number(coupon.discountValue))}
                        </td>
                        <td>
                          {coupon.uses} {coupon.maxUses ? `/ ${coupon.maxUses}` : ""}
                        </td>
                        <td>
                          {isActive ? (
                            <span className="admin-badge" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>
                              <span className="admin-badge-dot" /> Ativo
                            </span>
                          ) : (
                            <span className="admin-badge" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                              <span className="admin-badge-dot" /> Inativo
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: "right" }}>
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
    </>
  );
}
