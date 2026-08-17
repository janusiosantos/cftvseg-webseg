import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // ============================================
  // 1. Create Super Admin
  // ============================================
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "admin@webseg.com.br";
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || "Admin@123";

  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {},
    create: {
      email: superAdminEmail,
      passwordHash: await hash(superAdminPassword, 12),
      name: "Super Admin",
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });
  console.log(`✅ Super Admin criado: ${superAdmin.email}`);

  // ============================================
  // 2. Create Demo Tenant (Valentim Segurança)
  // ============================================
  const demoTenant = await prisma.tenant.upsert({
    where: { subdomain: "valentimseg" },
    update: {},
    create: {
      companyName: "Valentim Segurança Eletrônica",
      cnpj: "12345678000199",
      subdomain: "valentimseg",
      responsible: "João Valentim",
      phone: "11999887766",
      email: "contato@valentimseg.com.br",
      status: "ACTIVE",
      plan: "PROFESSIONAL",
      primaryColor: "#6366f1",
      secondaryColor: "#818cf8",
      accentColor: "#06d6a0",
      bannerTitle: "Segurança para sua casa e empresa",
      bannerSubtitle: "Kits de câmeras, cerca elétrica e alarmes com instalação profissional",
      aboutText: "A Valentim Segurança Eletrônica atua há mais de 10 anos no mercado, oferecendo soluções completas em CFTV, cerca elétrica, alarmes e automação. Nossa equipe de técnicos certificados garante instalação profissional e suporte contínuo.",
      publicPhone: "(11) 99988-7766",
      publicEmail: "contato@valentimseg.com.br",
      addressCity: "São Paulo",
      addressState: "SP",
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    },
  });
  console.log(`✅ Tenant demo criado: ${demoTenant.companyName} (${demoTenant.subdomain})`);

  // ============================================
  // 3. Create Partner Admin for Demo Tenant
  // ============================================
  const partnerAdmin = await prisma.user.upsert({
    where: { email: "joao@valentimseg.com.br" },
    update: {},
    create: {
      email: "joao@valentimseg.com.br",
      passwordHash: await hash("Parceiro@123", 12),
      name: "João Valentim",
      phone: "11999887766",
      role: "PARTNER_ADMIN",
      tenantId: demoTenant.id,
      isActive: true,
    },
  });
  console.log(`✅ Partner Admin criado: ${partnerAdmin.email}`);

  // ============================================
  // 4. Create Demo Products
  // ============================================
  const products = await Promise.all([
    prisma.product.upsert({
      where: {
        tenantId_slug: {
          tenantId: demoTenant.id,
          slug: "kit-4-cameras-hd",
        },
      },
      update: {},
      create: {
        tenantId: demoTenant.id,
        name: "Kit 4 Câmeras HD",
        slug: "kit-4-cameras-hd",
        description:
          "Kit completo com 4 câmeras HD 720p, DVR 4 canais, HD 500GB, cabos e conectores. Ideal para residências e pequenos comércios. Inclui instalação profissional com garantia de 1 ano.",
        shortDescription: "4 câmeras HD + DVR + HD 500GB + Instalação",
        price: 1299.9,
        compareAtPrice: 1599.9,
        images: [],
        category: "CFTV",
        estimatedDurationMin: 180,
        isActive: true,
        isFeatured: true,
        sortOrder: 1,
      },
    }),
    prisma.product.upsert({
      where: {
        tenantId_slug: {
          tenantId: demoTenant.id,
          slug: "kit-8-cameras-full-hd",
        },
      },
      update: {},
      create: {
        tenantId: demoTenant.id,
        name: "Kit 8 Câmeras Full HD",
        slug: "kit-8-cameras-full-hd",
        description:
          "Kit profissional com 8 câmeras Full HD 1080p com visão noturna colorida (Full Color), DVR 8 canais, HD 1TB, cabos e conectores. Perfeito para empresas e condomínios. Inclui instalação profissional com garantia de 1 ano.",
        shortDescription: "8 câmeras Full HD + DVR + HD 1TB + Instalação",
        price: 2499.9,
        compareAtPrice: 2999.9,
        images: [],
        category: "CFTV",
        estimatedDurationMin: 300,
        isActive: true,
        isFeatured: true,
        sortOrder: 2,
      },
    }),
    prisma.product.upsert({
      where: {
        tenantId_slug: {
          tenantId: demoTenant.id,
          slug: "cerca-eletrica-60m",
        },
      },
      update: {},
      create: {
        tenantId: demoTenant.id,
        name: "Cerca Elétrica 60 metros",
        slug: "cerca-eletrica-60m",
        description:
          "Cerca elétrica industrial com até 60 metros lineares, central de choque com alarme, hastes de 4 fios, placas de advertência e instalação completa. Ideal para residências e empresas.",
        shortDescription: "60m de cerca elétrica + Central + Instalação",
        price: 1899.9,
        compareAtPrice: 2199.9,
        images: [],
        category: "CERCA_ELETRICA",
        estimatedDurationMin: 240,
        isActive: true,
        isFeatured: true,
        sortOrder: 3,
      },
    }),
    prisma.product.upsert({
      where: {
        tenantId_slug: {
          tenantId: demoTenant.id,
          slug: "kit-alarme-residencial",
        },
      },
      update: {},
      create: {
        tenantId: demoTenant.id,
        name: "Kit Alarme Residencial",
        slug: "kit-alarme-residencial",
        description:
          "Kit completo de alarme residencial com central monitorável, 4 sensores de presença, 2 sensores magnéticos, sirene, controles remotos e instalação. Compatível com monitoramento 24h.",
        shortDescription: "Central + 6 sensores + Sirene + Instalação",
        price: 899.9,
        compareAtPrice: 1099.9,
        images: [],
        category: "ALARME",
        estimatedDurationMin: 120,
        isActive: true,
        isFeatured: false,
        sortOrder: 4,
      },
    }),
    prisma.product.upsert({
      where: {
        tenantId_slug: {
          tenantId: demoTenant.id,
          slug: "manutencao-preventiva",
        },
      },
      update: {},
      create: {
        tenantId: demoTenant.id,
        name: "Manutenção Preventiva",
        slug: "manutencao-preventiva",
        description:
          "Serviço de manutenção preventiva para sistemas de CFTV, cerca elétrica ou alarme. Inclui verificação de todos os equipamentos, limpeza de câmeras, teste de sensores e relatório técnico.",
        shortDescription: "Visita técnica + Verificação completa + Relatório",
        price: 249.9,
        images: [],
        category: "SERVICO",
        estimatedDurationMin: 90,
        isActive: true,
        isFeatured: false,
        sortOrder: 5,
      },
    }),
  ]);
  console.log(`✅ ${products.length} produtos demo criados`);

  // ============================================
  // 5. Create Working Hours (Mon-Fri 8h-18h)
  // ============================================
  const workingHoursDays = [1, 2, 3, 4, 5]; // Mon to Fri
  for (const day of workingHoursDays) {
    await prisma.workingHours.upsert({
      where: {
        tenantId_dayOfWeek: {
          tenantId: demoTenant.id,
          dayOfWeek: day,
        },
      },
      update: {},
      create: {
        tenantId: demoTenant.id,
        dayOfWeek: day,
        startTime: "08:00",
        endTime: "18:00",
        slotDurationMin: 120,
        maxCapacity: 2,
      },
    });
  }
  // Saturday (half day)
  await prisma.workingHours.upsert({
    where: {
      tenantId_dayOfWeek: {
        tenantId: demoTenant.id,
        dayOfWeek: 6,
      },
    },
    update: {},
    create: {
      tenantId: demoTenant.id,
      dayOfWeek: 6,
      startTime: "08:00",
      endTime: "12:00",
      slotDurationMin: 120,
      maxCapacity: 1,
    },
  });
  console.log("✅ Horários de trabalho configurados (Seg-Sex 8h-18h, Sáb 8h-12h)");

  // ============================================
  // 6. Create Demo Technician
  // ============================================
  const techUser = await prisma.user.upsert({
    where: { email: "carlos@valentimseg.com.br" },
    update: {},
    create: {
      email: "carlos@valentimseg.com.br",
      passwordHash: await hash("Tecnico@123", 12),
      name: "Carlos Silva",
      phone: "11988776655",
      role: "TECHNICIAN",
      tenantId: demoTenant.id,
      isActive: true,
    },
  });

  await prisma.technicianProfile.upsert({
    where: { userId: techUser.id },
    update: {},
    create: {
      userId: techUser.id,
      tenantId: demoTenant.id,
      specialties: ["CFTV", "Cerca Elétrica", "Alarme"],
      phone: "11988776655",
      isActive: true,
    },
  });
  console.log(`✅ Técnico demo criado: ${techUser.name} (${techUser.email})`);

  console.log("\n🎉 Seed concluído com sucesso!");
  console.log("\n📋 Credenciais de teste:");
  console.log(`   Super Admin: ${superAdminEmail} / ${superAdminPassword}`);
  console.log(`   Parceiro Admin: joao@valentimseg.com.br / Parceiro@123`);
  console.log(`   Técnico: carlos@valentimseg.com.br / Tecnico@123`);
  console.log(`   Loja demo: http://localhost:3000?tenant=valentimseg`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
