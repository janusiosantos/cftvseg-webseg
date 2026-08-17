import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subdomain = req.nextUrl.searchParams.get("subdomain");
  if (!subdomain || subdomain.length < 3) {
    return NextResponse.json({ available: false, error: "Subdomínio deve ter pelo menos 3 caracteres" });
  }

  // Reserved subdomains
  const reserved = ["admin", "www", "api", "app", "cftveseg", "webseg", "mail", "ftp", "blog", "help", "support", "status"];
  if (reserved.includes(subdomain)) {
    return NextResponse.json({ available: false, reason: "reserved" });
  }

  const existing = await prisma.tenant.findUnique({
    where: { subdomain },
    select: { id: true },
  });

  return NextResponse.json({ available: !existing });
}
