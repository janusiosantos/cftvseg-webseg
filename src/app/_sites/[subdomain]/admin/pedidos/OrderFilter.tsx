"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

export function OrderFilter({ tenant }: { tenant: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") || "ALL";

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    router.push(`/admin/pedidos?tenant=${tenant}&status=${newStatus}`);
  };

  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-sm font-medium text-gray-400">Filtrar por Status:</span>
      <select
        value={currentStatus}
        onChange={handleStatusChange}
        className="bg-gray-800 text-white text-sm border border-gray-700 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="ALL">Todos os Pedidos</option>
        {Object.entries(ORDER_STATUS_LABELS).map(([key, { label }]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
