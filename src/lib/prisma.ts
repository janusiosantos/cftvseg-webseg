import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Creates a tenant-scoped Prisma client that automatically filters by tenantId.
 * Use this for all partner-scoped queries.
 */
export function getTenantPrisma(tenantId: string) {
  return prisma.$extends({
    query: {
      $allOperations({ model, operation, args, query }) {
        // Models that have tenantId
        const tenantModels = [
          "Product",
          "Order",
          "Schedule",
          "WorkingHours",
          "TechnicianProfile",
        ];

        if (model && tenantModels.includes(model)) {
          // Inject tenantId on create
          if (operation === "create" || operation === "createMany") {
            if ("data" in args) {
              if (Array.isArray(args.data)) {
                args.data = args.data.map((d: Record<string, unknown>) => ({
                  ...d,
                  tenantId,
                }));
              } else {
                (args.data as Record<string, unknown>).tenantId = tenantId;
              }
            }
          }

          // Inject tenantId filter on read/update/delete
          if (
            operation === "findMany" ||
            operation === "findFirst" ||
            operation === "findUnique" ||
            operation === "update" ||
            operation === "updateMany" ||
            operation === "delete" ||
            operation === "deleteMany" ||
            operation === "count" ||
            operation === "aggregate"
          ) {
            if ("where" in args) {
              args.where = { ...args.where, tenantId };
            } else {
              (args as Record<string, unknown>).where = { tenantId };
            }
          }
        }

        return query(args);
      },
    },
  });
}

export type TenantPrismaClient = ReturnType<typeof getTenantPrisma>;
