"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { validateCpf as validateCpfLib } from "@/lib/cpf";

interface Product {
  id: string;
  name: string;
  price: number;
  estimatedDurationMin: number;
}

interface Slot {
  date: string;
  startTime: string;
  endTime: string;
  dateFormatted: string;
}

import { Suspense } from "react";

function CheckoutForm() {
  const searchParams = useSearchParams();
  const tenant = searchParams.get("tenant") || "";
  const productId = searchParams.get("product") || "";

  const [product, setProduct] = useState<Product | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; type: string; value: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const [form, setForm] = useState({
    customerName: "",
    customerCpf: "",
    customerEmail: "",
    customerPhone: "",
    installAddress: "",
    installNumber: "",
    installComplement: "",
    installNeighborhood: "",
    installCity: "",
    installState: "",
    installZip: "",
    scheduledDate: "",
    scheduledTimeStart: "",
    scheduledTimeEnd: "",
  });

  useEffect(() => {
    if (productId && tenant) {
      fetch(`/api/products/${productId}?tenant=${tenant}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.id) setProduct({ ...data, price: Number(data.price) });
        })
        .catch(console.error);

      fetch(`/api/schedule/slots?tenant=${tenant}`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setSlots(data);
        })
        .catch(console.error);
    }
  }, [productId, tenant]);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function selectSlot(slot: Slot) {
    setForm((prev) => ({
      ...prev,
      scheduledDate: slot.date,
      scheduledTimeStart: slot.startTime,
      scheduledTimeEnd: slot.endTime,
    }));
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validate CPF
    if (!validateCpfLib(form.customerCpf)) {
      setError("CPF inválido. Verifique e tente novamente.");
      return;
    }

    if (!form.scheduledDate) {
      setError("Selecione uma data para a instalação.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...form,
        productId,
        quantity: 1,
        couponCode: appliedCoupon?.code || undefined,
      };

      const res = await fetch(`/api/checkout?tenant=${tenant}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao processar checkout.");
        setLoading(false);
        return;
      }

      // Redirect to Mercado Pago
      if (data.initPoint) {
        window.location.href = data.initPoint;
      } else {
        setError("Erro ao gerar link de pagamento.");
        setLoading(false);
      }
    } catch {
      setError("Erro ao processar checkout. Tente novamente.");
      setLoading(false);
    }
  }

  // Group slots by date
  const slotsByDate: Record<string, Slot[]> = {};
  slots.forEach((slot) => {
    if (!slotsByDate[slot.date]) slotsByDate[slot.date] = [];
    slotsByDate[slot.date].push(slot);
  });

  return (
    <>
      <style>{`
        .checkout-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 32px 24px;
        }
        .checkout-title {
          font-size: 28px;
          font-weight: 900;
          color: #0f172a;
          margin-bottom: 8px;
        }
        .checkout-subtitle {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 32px;
        }
        .checkout-steps {
          display: flex;
          gap: 0;
          margin-bottom: 32px;
        }
        .checkout-step {
          flex: 1;
          text-align: center;
          padding: 12px;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          font-size: 13px;
          font-weight: 600;
          color: #94a3b8;
          cursor: pointer;
          transition: all 200ms;
        }
        .checkout-step:first-child { border-radius: 8px 0 0 8px; }
        .checkout-step:last-child { border-radius: 0 8px 8px 0; }
        .checkout-step.active {
          background: var(--store-primary, #6366f1);
          color: #fff;
          border-color: var(--store-primary, #6366f1);
        }
        .checkout-step.completed {
          background: #dcfce7;
          color: #16a34a;
          border-color: #bbf7d0;
        }
        .checkout-section {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 20px;
        }
        .checkout-section h3 {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 16px;
        }
        .checkout-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .checkout-field {
          margin-bottom: 12px;
        }
        .checkout-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 4px;
        }
        .checkout-input {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          color: #0f172a;
          outline: none;
          transition: border-color 150ms;
          background: #fff;
        }
        .checkout-input:focus {
          border-color: var(--store-primary, #6366f1);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }
        .checkout-input::placeholder { color: #94a3b8; }

        /* Schedule Picker */
        .schedule-dates {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 8px;
          margin-bottom: 12px;
        }
        .schedule-date-btn {
          flex-shrink: 0;
          padding: 12px 16px;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          text-align: center;
          cursor: pointer;
          transition: all 200ms;
          min-width: 80px;
        }
        .schedule-date-btn:hover {
          border-color: var(--store-primary, #6366f1);
        }
        .schedule-date-btn.selected {
          border-color: var(--store-primary, #6366f1);
          background: rgba(99,102,241,0.05);
        }
        .schedule-date-day {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 2px;
        }
        .schedule-date-num {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
        }
        .schedule-date-month {
          font-size: 11px;
          color: #94a3b8;
        }
        .schedule-slots {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 8px;
        }
        .schedule-slot-btn {
          padding: 10px;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 200ms;
          text-align: center;
        }
        .schedule-slot-btn:hover {
          border-color: var(--store-primary, #6366f1);
        }
        .schedule-slot-btn.selected {
          border-color: var(--store-primary, #6366f1);
          background: var(--store-primary, #6366f1);
          color: #fff;
        }

        /* Summary */
        .checkout-summary {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
        }
        .checkout-summary-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 14px;
          color: #475569;
        }
        .checkout-summary-total {
          display: flex;
          justify-content: space-between;
          padding-top: 12px;
          margin-top: 8px;
          border-top: 1px solid #e2e8f0;
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
        }

        .checkout-error {
          background: #fef2f2;
          border-left: 4px solid #ef4444;
          color: #991b1b;
          padding: 16px;
          border-radius: 4px 8px 8px 4px;
          font-size: 14px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .checkout-error strong {
          font-weight: 700;
          color: #7f1d1d;
        }

        .checkout-pay-btn {
          width: 100%;
          padding: 16px;
          background: var(--store-primary, #6366f1);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 18px;
          font-weight: 800;
          cursor: pointer;
          transition: all 250ms;
        }
        .checkout-pay-btn:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-2px);
        }
        .checkout-pay-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .checkout-nav-btns {
          display: flex;
          gap: 12px;
          margin-top: 16px;
        }
        .checkout-back-btn {
          padding: 12px 24px;
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 150ms;
        }
        .checkout-back-btn:hover { background: #e2e8f0; }
        .checkout-next-btn {
          flex: 1;
          padding: 12px 24px;
          background: var(--store-primary, #6366f1);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 200ms;
        }
        .checkout-next-btn:hover { opacity: 0.9; }

        .checkout-secure {
          text-align: center;
          margin-top: 16px;
          font-size: 12px;
          color: #94a3b8;
        }

        @media (max-width: 768px) {
          .checkout-form-row { grid-template-columns: 1fr; }
          .checkout-steps { flex-wrap: wrap; }
        }
      `}</style>

      <div className="checkout-page">
        <h1 className="checkout-title">Finalizar Compra</h1>
        <p className="checkout-subtitle">Preencha os dados para concluir seu pedido com instalação agendada</p>

        {/* Steps Indicator */}
        <div className="checkout-steps">
          <div className={`checkout-step ${step >= 1 ? (step > 1 ? "completed" : "active") : ""}`} onClick={() => setStep(1)}>
            1. Dados Pessoais
          </div>
          <div className={`checkout-step ${step >= 2 ? (step > 2 ? "completed" : "active") : ""}`} onClick={() => step > 1 && setStep(2)}>
            2. Endereço
          </div>
          <div className={`checkout-step ${step >= 3 ? "active" : ""}`} onClick={() => step > 2 && setStep(3)}>
            3. Agendamento & Pagamento
          </div>
        </div>

        {error && (
          <div className="checkout-error">
            <span style={{ fontSize: "20px" }}>⚠️</span>
            <div>
              <strong>Ops, ocorreu um problema</strong>
              <p style={{ marginTop: "4px" }}>{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleCheckout}>
          {/* Step 1: Personal Data */}
          {step === 1 && (
            <div className="checkout-section">
              <h3>👤 Dados Pessoais</h3>
              <div className="checkout-form-row">
                <div className="checkout-field">
                  <label className="checkout-label">Nome completo *</label>
                  <input className="checkout-input" type="text" required placeholder="Seu nome" value={form.customerName} onChange={(e) => updateField("customerName", e.target.value)} />
                </div>
                <div className="checkout-field">
                  <label className="checkout-label">CPF *</label>
                  <input className="checkout-input" type="text" required placeholder="000.000.000-00" value={form.customerCpf} onChange={(e) => updateField("customerCpf", e.target.value)} />
                </div>
              </div>
              <div className="checkout-form-row">
                <div className="checkout-field">
                  <label className="checkout-label">E-mail *</label>
                  <input className="checkout-input" type="email" required placeholder="seu@email.com" value={form.customerEmail} onChange={(e) => updateField("customerEmail", e.target.value)} />
                </div>
                <div className="checkout-field">
                  <label className="checkout-label">Telefone *</label>
                  <input className="checkout-input" type="tel" required placeholder="(11) 99999-9999" value={form.customerPhone} onChange={(e) => updateField("customerPhone", e.target.value)} />
                </div>
              </div>
              <div className="checkout-nav-btns">
                <a href={`/?tenant=${tenant}`} className="checkout-back-btn">← Voltar à loja</a>
                <button type="button" className="checkout-next-btn" onClick={() => setStep(2)}>Continuar →</button>
              </div>
            </div>
          )}

          {/* Step 2: Address */}
          {step === 2 && (
            <div className="checkout-section">
              <h3>📍 Endereço de Instalação</h3>
              <div className="checkout-form-row">
                <div className="checkout-field">
                  <label className="checkout-label">CEP *</label>
                  <input className="checkout-input" type="text" required placeholder="00000-000" value={form.installZip} onChange={(e) => updateField("installZip", e.target.value)} />
                </div>
                <div className="checkout-field">
                  <label className="checkout-label">Estado *</label>
                  <input className="checkout-input" type="text" required placeholder="SP" maxLength={2} value={form.installState} onChange={(e) => updateField("installState", e.target.value.toUpperCase())} />
                </div>
              </div>
              <div className="checkout-field">
                <label className="checkout-label">Cidade *</label>
                <input className="checkout-input" type="text" required placeholder="São Paulo" value={form.installCity} onChange={(e) => updateField("installCity", e.target.value)} />
              </div>
              <div className="checkout-form-row">
                <div className="checkout-field">
                  <label className="checkout-label">Endereço *</label>
                  <input className="checkout-input" type="text" required placeholder="Rua, Avenida..." value={form.installAddress} onChange={(e) => updateField("installAddress", e.target.value)} />
                </div>
                <div className="checkout-field">
                  <label className="checkout-label">Número *</label>
                  <input className="checkout-input" type="text" required placeholder="123" value={form.installNumber} onChange={(e) => updateField("installNumber", e.target.value)} />
                </div>
              </div>
              <div className="checkout-form-row">
                <div className="checkout-field">
                  <label className="checkout-label">Complemento</label>
                  <input className="checkout-input" type="text" placeholder="Apto, Bloco..." value={form.installComplement} onChange={(e) => updateField("installComplement", e.target.value)} />
                </div>
                <div className="checkout-field">
                  <label className="checkout-label">Bairro</label>
                  <input className="checkout-input" type="text" placeholder="Bairro" value={form.installNeighborhood} onChange={(e) => updateField("installNeighborhood", e.target.value)} />
                </div>
              </div>
              <div className="checkout-nav-btns">
                <button type="button" className="checkout-back-btn" onClick={() => setStep(1)}>← Voltar</button>
                <button type="button" className="checkout-next-btn" onClick={() => setStep(3)}>Continuar →</button>
              </div>
            </div>
          )}

          {/* Step 3: Schedule + Payment */}
          {step === 3 && (
            <>
              <div className="checkout-section">
                <h3>📅 Escolha a data da instalação</h3>

                {Object.keys(slotsByDate).length === 0 ? (
                  <p style={{ color: "#94a3b8", textAlign: "center", padding: "24px" }}>
                    Nenhum horário disponível no momento. Entre em contato.
                  </p>
                ) : (
                  <>
                    <div className="schedule-dates">
                      {Object.entries(slotsByDate).map(([date, dateSlots]) => {
                        const d = new Date(date + "T12:00:00");
                        const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
                        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
                        return (
                          <button
                            key={date}
                            type="button"
                            className={`schedule-date-btn ${form.scheduledDate === date ? "selected" : ""}`}
                            onClick={() => updateField("scheduledDate", date)}
                          >
                            <div className="schedule-date-day">{dayNames[d.getDay()]}</div>
                            <div className="schedule-date-num">{d.getDate()}</div>
                            <div className="schedule-date-month">{monthNames[d.getMonth()]}</div>
                          </button>
                        );
                      })}
                    </div>

                    {form.scheduledDate && slotsByDate[form.scheduledDate] && (
                      <div className="schedule-slots">
                        {slotsByDate[form.scheduledDate].map((slot, i) => (
                          <button
                            key={i}
                            type="button"
                            className={`schedule-slot-btn ${
                              form.scheduledTimeStart === slot.startTime && form.scheduledDate === slot.date ? "selected" : ""
                            }`}
                            onClick={() => selectSlot(slot)}
                          >
                            {slot.startTime} - {slot.endTime}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Order Summary */}
              <div className="checkout-summary">
                <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px" }}>📋 Resumo do Pedido</h3>
                {product && (
                  <>
                    <div className="checkout-summary-item">
                      <span>{product.name} (x1)</span>
                      <span>R$ {product.price.toFixed(2)}</span>
                    </div>
                    {form.scheduledDate && (
                      <div className="checkout-summary-item">
                        <span>📅 Instalação</span>
                        <span>{new Date(form.scheduledDate + "T12:00:00").toLocaleDateString("pt-BR")} {form.scheduledTimeStart && `às ${form.scheduledTimeStart}`}</span>
                      </div>
                    )}
                    
                    {/* Coupon Input */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cupom de Desconto</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="Ex: PROMO10"
                          disabled={!!appliedCoupon}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm uppercase focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        {!appliedCoupon ? (
                          <button
                            type="button"
                            onClick={async () => {
                              if (!couponCode) return;
                              setCouponLoading(true);
                              setCouponError("");
                              try {
                                const r = await fetch(`/api/coupons/validate?tenant=${tenant}&code=${couponCode}`);
                                const data = await r.json();
                                if (!r.ok) throw new Error(data.error);
                                setAppliedCoupon({ code: data.code, type: data.discountType, value: data.discountValue });
                              } catch (err: any) {
                                setCouponError(err.message);
                              } finally {
                                setCouponLoading(false);
                              }
                            }}
                            disabled={couponLoading}
                            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 disabled:opacity-50"
                          >
                            {couponLoading ? "..." : "Aplicar"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setAppliedCoupon(null);
                              setCouponCode("");
                            }}
                            className="px-4 py-2 bg-red-100 text-red-700 text-sm rounded-md hover:bg-red-200"
                          >
                            Remover
                          </button>
                        )}
                      </div>
                      {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
                    </div>

                    {appliedCoupon && (
                      <div className="checkout-summary-item text-green-600 mt-2 font-medium">
                        <span>Desconto ({appliedCoupon.code})</span>
                        <span>
                          - R$ {appliedCoupon.type === "PERCENTAGE" 
                            ? (product.price * (appliedCoupon.value / 100)).toFixed(2)
                            : appliedCoupon.value.toFixed(2)}
                        </span>
                      </div>
                    )}

                    <div className="checkout-summary-total mt-4 pt-4 border-t border-gray-200">
                      <span>Total</span>
                      <span>R$ {(() => {
                        let total = product.price;
                        if (appliedCoupon) {
                          if (appliedCoupon.type === "PERCENTAGE") {
                            total = total - (total * (appliedCoupon.value / 100));
                          } else {
                            total = Math.max(0, total - appliedCoupon.value);
                          }
                        }
                        return total.toFixed(2);
                      })()}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="checkout-nav-btns">
                <button type="button" className="checkout-back-btn" onClick={() => setStep(2)}>← Voltar</button>
                <button type="submit" className="checkout-pay-btn" disabled={loading || !form.scheduledDate}>
                  {loading ? "Processando..." : "💳 Pagar com Mercado Pago →"}
                </button>
              </div>

              <p className="checkout-secure">
                🔒 Pagamento processado com segurança pelo Mercado Pago
              </p>
            </>
          )}
        </form>
      </div>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "64px" }}>Carregando checkout...</div>}>
      <CheckoutForm />
    </Suspense>
  );
}
