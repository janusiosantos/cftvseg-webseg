"use client";

import { useState } from "react";
import { Star } from "lucide-react";

export function ReviewForm({ serviceRecordId }: { serviceRecordId: string }) {
  const [score, setScore] = useState(0);
  const [hoverScore, setHoverScore] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (score === 0) {
      setError("Por favor, selecione uma nota de 1 a 5 estrelas.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceRecordId, score, comment }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao enviar avaliação.");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px", color: "#22c55e" }}>
          <Star size={64} fill="#22c55e" color="#22c55e" />
        </div>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>Avaliação Registrada!</h2>
        <p style={{ color: "#64748b" }}>Muito obrigado pelo seu feedback.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{ marginBottom: "24px", padding: "16px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", borderRadius: "8px", fontSize: "14px", textAlign: "center" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "32px" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            style={{ 
              background: "none", 
              border: "none", 
              cursor: "pointer", 
              padding: "4px",
              transition: "transform 0.2s"
            }}
            onMouseEnter={() => setHoverScore(star)}
            onMouseLeave={() => setHoverScore(0)}
            onClick={() => setScore(star)}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.9)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
          >
            <Star
              size={48}
              fill={(hoverScore || score) >= star ? "#f59e0b" : "transparent"}
              color={(hoverScore || score) >= star ? "#f59e0b" : "#cbd5e1"}
              style={{ transition: "all 0.2s" }}
            />
          </button>
        ))}
      </div>

      <div style={{ marginBottom: "24px" }}>
        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#334155", marginBottom: "8px" }}>
          Deixe um comentário (opcional)
        </label>
        <textarea
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="store-input"
          style={{ resize: "none" }}
          placeholder="Como foi o atendimento do técnico?"
        />
      </div>

      <button
        type="submit"
        disabled={loading || score === 0}
        className="btn-store-primary"
        style={{ width: "100%", justifyContent: "center" }}
      >
        {loading ? "Enviando..." : "Enviar Avaliação"}
      </button>
    </form>
  );
}
