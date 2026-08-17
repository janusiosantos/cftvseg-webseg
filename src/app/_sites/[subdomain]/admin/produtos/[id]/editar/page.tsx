import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { EditProductForm } from "./EditProductForm";

interface Props {
  params: Promise<{ subdomain: string; id: string }>;
}

export default async function EditarProdutoPage({ params }: Props) {
  const { subdomain, id } = await params;
  
  const tenant = await prisma.tenant.findUnique({ where: { subdomain } });
  if (!tenant) notFound();

  const product = await prisma.product.findUnique({
    where: { id, tenantId: tenant.id },
  });

  if (!product) notFound();

  // Convert Decimal to number for the client component
  const productData = {
    ...product,
    price: Number(product.price),
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Editar Produto</h1>
        <Link
          href={`/admin/produtos?tenant=${subdomain}`}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Voltar
        </Link>
      </div>

      <EditProductForm product={productData as any} />
    </div>
  );
}
