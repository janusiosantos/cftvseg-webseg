"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  orderId: string;
  status: string;
}

export function ActionButtons({ orderId, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/technician/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Erro ao atualizar status");
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Falha ao comunicar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "COMPLETED") {
    return (
      <div className="w-full text-center py-2 text-sm font-semibold text-green-600 bg-green-50 rounded-lg">
        Serviço Concluído
      </div>
    );
  }

  return (
    <div className="flex gap-2 w-full">
      {status !== "IN_PROGRESS" ? (
        <button
          disabled={loading}
          onClick={() => handleStatusChange("IN_PROGRESS")}
          className="flex-1 bg-[var(--tenant-primary)] text-white py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Aguarde..." : "Fazer Check-in"}
        </button>
      ) : (
        <button
          disabled={loading}
          onClick={() => handleStatusChange("COMPLETED")}
          className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Aguarde..." : "Concluir Serviço"}
        </button>
      )}
      
      <button 
        disabled={loading}
        className="px-4 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200"
      >
        Rotas
      </button>
    </div>
  );
}
