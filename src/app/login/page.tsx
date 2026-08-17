"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("E-mail ou senha incorretos.");
        setLoading(false);
        return;
      }

      // Fetch session to determine redirect
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      const role = session?.user?.role;

      if (role === "SUPER_ADMIN") {
        router.push("/super-admin");
      } else if (role === "PARTNER_ADMIN") {
        const subdomain = session?.user?.tenantSubdomain;
        if (subdomain && typeof window !== "undefined" && !window.location.hostname.includes("localhost")) {
          window.location.href = `https://${subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/admin`;
        } else {
          router.push(`/admin?tenant=${session?.user?.tenantSubdomain || ""}`);
        }
      } else if (role === "TECHNICIAN") {
        const subdomain = session?.user?.tenantSubdomain;
        if (subdomain && typeof window !== "undefined" && !window.location.hostname.includes("localhost")) {
          window.location.href = `https://${subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/tecnico`;
        } else {
          router.push(`/tecnico?tenant=${session?.user?.tenantSubdomain || ""}`);
        }
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setError("Erro ao fazer login. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0a0f1c 0%, #1a1040 50%, #0f172a 100%);
          padding: var(--space-lg);
        }
        .login-card {
          width: 100%;
          max-width: 420px;
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: var(--radius-xl);
          padding: var(--space-2xl);
          animation: scaleIn 0.4s ease;
        }
        .login-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
          margin-bottom: var(--space-2xl);
          font-size: var(--font-size-2xl);
          font-weight: 800;
          color: var(--color-text-primary);
        }
        .login-logo .logo-icon {
          width: 44px;
          height: 44px;
          background: var(--gradient-primary);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }
        .login-title {
          font-size: var(--font-size-xl);
          font-weight: 700;
          color: var(--color-text-primary);
          text-align: center;
          margin-bottom: var(--space-xs);
        }
        .login-subtitle {
          font-size: var(--font-size-sm);
          color: var(--color-text-tertiary);
          text-align: center;
          margin-bottom: var(--space-xl);
        }
        .login-error {
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          padding: var(--space-sm) var(--space-md);
          border-radius: var(--radius-md);
          font-size: var(--font-size-sm);
          margin-bottom: var(--space-md);
          text-align: center;
        }
        .login-form .form-group {
          margin-bottom: var(--space-md);
        }
        .login-form .form-label {
          display: block;
          font-size: var(--font-size-sm);
          font-weight: 600;
          color: var(--color-text-secondary);
          margin-bottom: var(--space-xs);
        }
        .login-form .form-input {
          width: 100%;
          padding: 12px 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: var(--radius-md);
          color: var(--color-text-primary);
          font-size: var(--font-size-base);
          outline: none;
          transition: all 150ms ease;
        }
        .login-form .form-input:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
        }
        .login-form .form-input::placeholder {
          color: var(--color-text-tertiary);
        }
        .login-submit {
          width: 100%;
          padding: 14px;
          background: var(--gradient-primary);
          color: #fff;
          border: none;
          border-radius: var(--radius-lg);
          font-size: var(--font-size-base);
          font-weight: 700;
          cursor: pointer;
          transition: all 250ms ease;
          margin-top: var(--space-sm);
        }
        .login-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(99,102,241,0.4);
        }
        .login-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .login-back {
          display: block;
          text-align: center;
          margin-top: var(--space-lg);
          color: var(--color-text-tertiary);
          font-size: var(--font-size-sm);
        }
        .login-back:hover {
          color: var(--color-primary-light);
        }
      `}</style>

      <div className="login-card">
        <div className="login-logo">
          <span className="logo-icon">🛡️</span>
          WebSeg
        </div>
        <h1 className="login-title">Bem-vindo de volta</h1>
        <p className="login-subtitle">Acesse sua conta para continuar</p>

        {error && <div className="login-error">{error}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">E-mail</label>
            <input
              id="login-email"
              className="form-input"
              type="email"
              placeholder="seu@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Senha</label>
            <input
              id="login-password"
              className="form-input"
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar →"}
          </button>
        </form>

        <a href="/" className="login-back">← Voltar para o início</a>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0f1c", color: "#fff" }}>Carregando...</div>}>
      <LoginForm />
    </Suspense>
  );
}
