import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api routes that don't need tenant context
     * - _next (Next.js internals)
     * - static files (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|icons|images|uploads).*)",
  ],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get("host") || "";
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";

  // =============================================
  // 1. DEV MODE: use ?tenant= query param
  // =============================================
  if (hostname.includes("localhost") || hostname.includes("127.0.0.1")) {
    const tenantParam = url.searchParams.get("tenant");

    // API routes - pass through with tenant header if applicable
    if (url.pathname.startsWith("/api")) {
      if (tenantParam) {
        const response = NextResponse.next();
        response.headers.set("x-tenant-subdomain", tenantParam);
        return response;
      }
      return NextResponse.next();
    }

    // Super admin routes
    if (url.pathname.startsWith("/super-admin")) {
      return NextResponse.next();
    }

    // Auth routes
    if (url.pathname.startsWith("/login") || url.pathname.startsWith("/register")) {
      return NextResponse.next();
    }

    // If tenant param exists, rewrite to _sites/[subdomain]
    if (tenantParam) {
      url.pathname = `/_sites/${tenantParam}${url.pathname}`;
      url.searchParams.delete("tenant");
      const response = NextResponse.rewrite(url);
      response.headers.set("x-tenant-subdomain", tenantParam);
      return response;
    }

    // Default: show landing page
    return NextResponse.next();
  }

  // =============================================
  // 2. PRODUCTION: subdomain-based routing
  // =============================================

  // Extract subdomain and custom domain
  const extracted = extractSubdomain(hostname, rootDomain);
  const subdomain = extracted.subdomain;
  const customDomain = extracted.customDomain;

  const tenantIdentifier = customDomain || subdomain;

  // API routes - pass through with tenant header
  if (url.pathname.startsWith("/api")) {
    if (tenantIdentifier && tenantIdentifier !== "cftveseg" && tenantIdentifier !== "admin" && tenantIdentifier !== "www") {
      const response = NextResponse.next();
      response.headers.set("x-tenant-subdomain", tenantIdentifier);
      return response;
    }
    return NextResponse.next();
  }

  // No identifier or main domain → Landing page
  if (!tenantIdentifier || tenantIdentifier === "cftveseg" || tenantIdentifier === "www") {
    return NextResponse.next();
  }

  // Admin subdomain → Super Admin panel
  if (tenantIdentifier === "admin") {
    if (!url.pathname.startsWith("/super-admin")) {
      url.pathname = `/super-admin${url.pathname === "/" ? "" : url.pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // Partner subdomain or custom domain → Rewrite to /_sites/[tenantIdentifier]
  url.pathname = `/_sites/${tenantIdentifier}${url.pathname}`;
  const response = NextResponse.rewrite(url);
  response.headers.set("x-tenant-subdomain", tenantIdentifier);
  return response;
}

function extractSubdomain(hostname: string, rootDomain: string): { subdomain: string | null; customDomain: string | null } {
  const host = hostname.split(":")[0];
  const root = rootDomain.split(":")[0];

  // If host is localhost or exactly the root domain, return nulls
  if (host === "localhost" || host === "127.0.0.1" || host === root) {
    return { subdomain: null, customDomain: null };
  }

  // If it's a subdomain of the root domain
  if (host.endsWith(`.${root}`)) {
    const subdomain = host.replace(`.${root}`, "");
    return { subdomain, customDomain: null };
  }

  // Otherwise, it's a custom domain
  return { subdomain: null, customDomain: host };
}
