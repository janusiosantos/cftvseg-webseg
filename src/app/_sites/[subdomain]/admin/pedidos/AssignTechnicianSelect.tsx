"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Technician {
  id: string;
  name: string;
}

interface Props {
  orderId: string;
  currentTechnicianId?: string | null;
  technicians: Technician[];
}

export function AssignTechnicianSelect({ orderId, currentTechnicianId, technicians }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const technicianId = e.target.value;
    setLoading(true);

    try {
      const res = await fetch(`/api/orders/${orderId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technicianId: technicianId || null }),
      });

      if (!res.ok) {
        throw new Error("Falha ao atribuir técnico.");
      }

      router.refresh(); // Refresh the page to show updated server data
    } catch (error) {
      console.error(error);
      alert("Erro ao atribuir técnico.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <select
      value={currentTechnicianId || ""}
      onChange={handleChange}
      disabled={loading}
      className="bg-transparent border border-gray-200 text-xs rounded p-1 text-gray-700 outline-none focus:border-indigo-500 disabled:opacity-50"
    >
      <option value="">Não atribuído</option>
      {technicians.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  );
}
