import { headers } from "next/headers";
import { prisma } from "./prisma";

/**
 * Resolves the current tenant from the request headers.
 * The middleware injects x-tenant-subdomain into headers.
 */
export async function getCurrentTenant() {
  const headersList = await headers();
  const identifier = headersList.get("x-tenant-subdomain");

  if (!identifier) return null;

  let tenant = await prisma.tenant.findUnique({
    where: { subdomain: identifier },
  });

  if (!tenant) {
    tenant = await prisma.tenant.findFirst({
      where: { customDomain: identifier },
    });
  }

  return tenant;
}

/**
 * Gets the tenant subdomain from request headers.
 */
export async function getTenantSubdomain(): Promise<string | null> {
  const headersList = await headers();
  return headersList.get("x-tenant-subdomain");
}

/**
 * Resolves tenant from an identifier (subdomain or customDomain).
 */
export async function getTenantBySubdomain(identifier: string) {
  let tenant = await prisma.tenant.findUnique({
    where: { subdomain: identifier },
  });

  if (!tenant) {
    tenant = await prisma.tenant.findFirst({
      where: { customDomain: identifier },
    });
  }

  return tenant;
}

/**
 * Resolves tenant by ID.
 */
export async function getTenantById(id: string) {
  return prisma.tenant.findUnique({
    where: { id },
  });
}
