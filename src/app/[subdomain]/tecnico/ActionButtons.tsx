"use client";

import { useState } from "react";

interface Props {
  orderId: string;
  status: string;
}

export function ActionButtons({ orderId, status }: Props) {
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);

  async function updateStatus(newStatus: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/technician/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setCurrentStatus(newStatus);
        if (newStatus === "COMPLETED") {
          window.location.reload();
        }
      }
    } catch (err) {
      console.error("Erro ao atualizar status", err);
    } finally {
      setLoading(false);
    }
  }

  if (currentStatus === "COMPLETED") {
    return (
      <div className="tech-completed-status">
        Serviço Concluído
      </div>
    );
  }

  return (
    <div className="tech-action-btns">
      {currentStatus === "SCHEDULED" && (
        <button
          onClick={() => updateStatus("IN_PROGRESS")}
          disabled={loading}
          className="tech-action-btn primary"
        >
          {loading ? "Atualizando..." : "Iniciar Serviço"}
        </button>
      )}
      {currentStatus === "IN_PROGRESS" && (
        <button
          onClick={() => updateStatus("COMPLETED")}
          disabled={loading}
          className="tech-action-btn success"
        >
          {loading ? "Finalizando..." : "Finalizar Serviço"}
        </button>
      )}
      <button
        onClick={() => window.location.reload()}
        className="tech-action-btn secondary"
      >
        Atualizar
      </button>
    </div>
  );
}
