"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink, LayoutDashboard, Edit } from "lucide-react";

interface TenantActionsProps {
  tenant: {
    id: string;
    subdomain: string;
    status: string;
    plan: string;
    companyName: string;
  };
}

export function TenantActions({ tenant }: TenantActionsProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    status: tenant.status,
    plan: tenant.plan,
  });

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/super-admin/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Erro ao atualizar");
      
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      alert("Falha ao atualizar parceiro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: "8px", position: "relative" }}>
      <Link href={`/?tenant=${tenant.subdomain}`} target="_blank" className="action-btn" title="Ver loja">
        <ExternalLink size={18} />
      </Link>
      <Link href={`/?tenant=${tenant.subdomain}&path=/admin`} target="_blank" className="action-btn" title="Ver admin">
        <LayoutDashboard size={18} />
      </Link>
      <button onClick={() => setIsOpen(!isOpen)} className="action-btn" title="Editar assinatura">
        <Edit size={18} />
      </button>

      {isOpen && (
        <div style={{
          position: "absolute",
          right: 0,
          top: "100%",
          zIndex: 50,
          background: "#1e293b",
          border: "1px solid #334155",
          padding: "16px",
          borderRadius: "8px",
          width: "240px",
          marginTop: "8px",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)"
        }}>
          <h4 style={{ color: "#f8fafc", fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>
            Editar: {tenant.companyName}
          </h4>
          
          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              style={{ width: "100%", padding: "6px", borderRadius: "4px", background: "#0f172a", color: "#fff", border: "1px solid #334155" }}
            >
              <option value="TRIAL">Trial</option>
              <option value="ACTIVE">Ativo</option>
              <option value="INACTIVE">Inativo</option>
              <option value="SUSPENDED">Suspenso</option>
            </select>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>Plano</label>
            <select
              value={form.plan}
              onChange={(e) => setForm({ ...form, plan: e.target.value })}
              style={{ width: "100%", padding: "6px", borderRadius: "4px", background: "#0f172a", color: "#fff", border: "1px solid #334155" }}
            >
              <option value="FREE_TRIAL">Free Trial</option>
              <option value="BASIC">Básico</option>
              <option value="PROFESSIONAL">Profissional</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button
              onClick={() => setIsOpen(false)}
              style={{ padding: "6px 12px", fontSize: "12px", background: "transparent", color: "#94a3b8", border: "none", cursor: "pointer" }}
            >
              Cancelar
            </button>
            <button
              onClick={handleUpdate}
              disabled={loading}
              style={{ padding: "6px 12px", fontSize: "12px", background: "#6366f1", color: "#fff", borderRadius: "4px", border: "none", cursor: "pointer" }}
            >
              {loading ? "..." : "Salvar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
