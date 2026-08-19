"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CancelScheduleButton({ scheduleId }: { scheduleId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!confirm("Tem certeza que deseja cancelar este agendamento? O horário voltará a ficar disponível para outros clientes e o pedido ficará sem data.")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/schedules/${scheduleId}/cancel`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Erro ao cancelar");

      router.refresh();
    } catch (err) {
      alert("Falha ao cancelar o agendamento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
    >
      {loading ? "Cancelando..." : "Cancelar Agendamento"}
    </button>
  );
}
