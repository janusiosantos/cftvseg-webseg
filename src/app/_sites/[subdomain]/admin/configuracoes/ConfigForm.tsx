"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface TenantData {
  primaryColor: string;
  secondaryColor: string;
  customDomain: string | null;
  logo: string | null;
  bannerUrl: string | null;
  publicPhone: string | null;
  publicEmail: string | null;
  aboutText: string | null;
}

export function ConfigForm({ initialData }: { initialData: TenantData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    primaryColor: initialData.primaryColor,
    secondaryColor: initialData.secondaryColor,
    customDomain: initialData.customDomain || "",
    logo: initialData.logo || "",
    bannerUrl: initialData.bannerUrl || "",
    publicPhone: initialData.publicPhone || "",
    publicEmail: initialData.publicEmail || "",
    aboutText: initialData.aboutText || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError("");

    try {
      const res = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao salvar configurações");
      }

      setSuccess(true);
      router.refresh(); // Refresh layout to apply new colors
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      {success && (
        <div className="p-4 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
          Configurações salvas com sucesso! As alterações visuais podem levar alguns instantes para aparecer na loja.
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cor Primária</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              name="primaryColor"
              value={formData.primaryColor}
              onChange={handleChange}
              className="h-10 w-10 border-0 rounded cursor-pointer"
            />
            <input
              type="text"
              name="primaryColor"
              value={formData.primaryColor}
              onChange={handleChange}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm"
              pattern="^#[0-9A-Fa-f]{6}$"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cor Secundária</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              name="secondaryColor"
              value={formData.secondaryColor}
              onChange={handleChange}
              className="h-10 w-10 border-0 rounded cursor-pointer"
            />
            <input
              type="text"
              name="secondaryColor"
              value={formData.secondaryColor}
              onChange={handleChange}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm"
              pattern="^#[0-9A-Fa-f]{6}$"
            />
          </div>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">URL do Logotipo (Opcional)</label>
          <input
            type="url"
            name="logo"
            value={formData.logo}
            onChange={handleChange}
            placeholder="https://..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--tenant-primary)] outline-none"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Banner Promocional (Opcional)</label>
          <input
            type="url"
            name="bannerUrl"
            value={formData.bannerUrl}
            onChange={handleChange}
            placeholder="https://.../banner.jpg"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--tenant-primary)] outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefone de Contato (Loja)</label>
          <input
            type="text"
            name="publicPhone"
            value={formData.publicPhone}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--tenant-primary)] outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email de Contato (Loja)</label>
          <input
            type="email"
            name="publicEmail"
            value={formData.publicEmail}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--tenant-primary)] outline-none"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Sobre a Empresa (Texto Curto)</label>
          <textarea
            name="aboutText"
            rows={3}
            value={formData.aboutText}
            onChange={handleChange}
            placeholder="Resumo que aparece no rodapé da loja..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--tenant-primary)] outline-none"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-[var(--tenant-primary)] text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? "Salvando..." : "Salvar Configurações"}
        </button>
      </div>
    </form>
  );
}
