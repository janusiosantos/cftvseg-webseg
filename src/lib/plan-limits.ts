import { prisma } from "./prisma";
import { PLANS, TenantPlan } from "./constants";

export async function checkPlanLimit(tenantId: string, resource: "products" | "technicians"): Promise<{
  allowed: boolean;
  limit: number;
  current: number;
}> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true },
  });

  if (!tenant) throw new Error("Tenant not found");

  const planKey = tenant.plan as keyof typeof PLANS;
  const planDetails = PLANS[planKey];

  // Enterprise/Professional plans might have unlimited (-1)
  const limit = resource === "products" ? planDetails.maxProducts : planDetails.maxTechnicians;

  if (limit === -1) {
    return { allowed: true, limit, current: 0 };
  }

  const currentCount = resource === "products"
    ? await prisma.product.count({ where: { tenantId } })
    : await prisma.user.count({ where: { tenantId, role: "TECHNICIAN", isActive: true } });

  return {
    allowed: currentCount < limit,
    limit,
    current: currentCount,
  };
}
