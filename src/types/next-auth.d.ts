import { type DefaultSession, type DefaultUser } from "next-auth";
import { type DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "SUPER_ADMIN" | "PARTNER_ADMIN" | "TECHNICIAN" | "CUSTOMER";
      tenantId: string | null;
      tenantSubdomain: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: "SUPER_ADMIN" | "PARTNER_ADMIN" | "TECHNICIAN" | "CUSTOMER";
    tenantId: string | null;
    tenantSubdomain: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    userId: string;
    role: "SUPER_ADMIN" | "PARTNER_ADMIN" | "TECHNICIAN" | "CUSTOMER";
    tenantId: string | null;
    tenantSubdomain: string | null;
  }
}
