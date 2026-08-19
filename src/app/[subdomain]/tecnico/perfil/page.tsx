"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function TechnicianProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (form.newPassword !== form.confirmPassword) {
      setError("A nova senha e a confirmação não conferem.");
      return;
    }

    if (form.newPassword.length < 6) {
      setError("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/technician/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao alterar a senha.");
      }

      setSuccess(true);
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tech-profile-page">
      <div className="tech-profile-header">
        <button
          onClick={() => router.push("./")}
          className="tech-back-btn"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="tech-profile-title">Meu Perfil</h1>
      </div>

      <div className="tech-card">
        <h2 className="tech-card-title">Alterar Senha</h2>

        {success && (
          <div className="tech-alert success">
            Senha alterada com sucesso!
          </div>
        )}

        {error && (
          <div className="tech-alert error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="tech-form">
          <div>
            <label className="tech-form-label">Senha Atual</label>
            <input
              type="password"
              name="currentPassword"
              required
              value={form.currentPassword}
              onChange={handleChange}
              className="tech-form-input"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="tech-form-label">Nova Senha</label>
            <input
              type="password"
              name="newPassword"
              required
              value={form.newPassword}
              onChange={handleChange}
              className="tech-form-input"
              placeholder="••••••••"
            />
            <p className="tech-form-hint">Mínimo de 6 caracteres.</p>
          </div>

          <div>
            <label className="tech-form-label">Confirmar Nova Senha</label>
            <input
              type="password"
              name="confirmPassword"
              required
              value={form.confirmPassword}
              onChange={handleChange}
              className="tech-form-input"
              placeholder="••••••••"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="tech-form-submit"
            >
              {loading ? "Salvando..." : "Atualizar Senha"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
