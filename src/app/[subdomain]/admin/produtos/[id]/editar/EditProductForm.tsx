"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  category: string;
  estimatedDurationMin: number;
  imageUrl: string | null;
  stock: number;
  trackStock: boolean;
  isActive: boolean;
}

export function EditProductForm({ product }: { product: Product }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: product.name,
    shortDescription: product.shortDescription,
    description: product.description,
    price: product.price.toString(),
    category: product.category,
    estimatedDurationMin: product.estimatedDurationMin.toString(),
    imageUrl: product.imageUrl || "",
    stock: product.stock.toString(),
    trackStock: product.trackStock,
    isActive: product.isActive,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        estimatedDurationMin: parseInt(formData.estimatedDurationMin, 10),
        stock: parseInt(formData.stock, 10) || 0,
      };

      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erro ao atualizar produto");
      }

      router.push("/admin/produtos");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--tenant-primary)] focus:border-[var(--tenant-primary)]"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Curta (Aparece no card)</label>
            <input
              type="text"
              name="shortDescription"
              required
              value={formData.shortDescription}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--tenant-primary)] focus:border-[var(--tenant-primary)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
            <input
              type="number"
              step="0.01"
              name="price"
              required
              value={formData.price}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--tenant-primary)] focus:border-[var(--tenant-primary)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duração da Instalação (Minutos)</label>
            <input
              type="number"
              name="estimatedDurationMin"
              required
              value={formData.estimatedDurationMin}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--tenant-primary)] focus:border-[var(--tenant-primary)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--tenant-primary)] focus:border-[var(--tenant-primary)] bg-white"
            >
              <option value="Kit CFTV">Kit CFTV</option>
              <option value="Alarme">Alarme</option>
              <option value="Cerca Elétrica">Cerca Elétrica</option>
              <option value="Controle de Acesso">Controle de Acesso</option>
              <option value="Serviço Avulso">Serviço Avulso</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL da Imagem (Opcional)</label>
            <input
              type="url"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--tenant-primary)] focus:border-[var(--tenant-primary)]"
            />
          </div>

          <div className="col-span-2 p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-800">Controle de Estoque</h4>
                <p className="text-xs text-gray-500">Se ativo, a compra será bloqueada quando o estoque acabar.</p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="trackStock"
                  name="trackStock"
                  checked={formData.trackStock}
                  onChange={handleChange}
                  className="h-5 w-5 text-[var(--tenant-primary)] rounded border-gray-300 focus:ring-[var(--tenant-primary)]"
                />
              </div>
            </div>
            
            {formData.trackStock && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade em Estoque</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  min="0"
                  className="w-full max-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--tenant-primary)] focus:border-[var(--tenant-primary)]"
                />
              </div>
            )}
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Completa</label>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--tenant-primary)] focus:border-[var(--tenant-primary)]"
            />
          </div>

          <div className="col-span-2 flex items-center">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-5 w-5 text-[var(--tenant-primary)] rounded border-gray-300 focus:ring-[var(--tenant-primary)]"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              Produto Ativo (Visível na loja)
            </label>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-[var(--tenant-primary)] text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
