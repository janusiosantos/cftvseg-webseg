"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteCouponButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja apagar este cupom?")) return;

    setLoading(true);
    try {
      await fetch(`/api/coupons/${id}`, { method: "DELETE" });
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir cupom.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
      title="Excluir cupom"
    >
      <Trash2 size={18} />
    </button>
  );
}
