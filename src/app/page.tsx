"use client";

import { useState, useEffect } from "react";
import "./landing.css";
import { PLANS } from "@/lib/constants";
import { Shield, Video, Camera, Zap, ShoppingCart, CalendarDays, CreditCard, BarChart, HardHat, Mail, Rocket, CircleDollarSign, Lock, Smartphone, CheckCircle, XCircle, Menu, X } from "lucide-react";

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
  });
  const [formStatus, setFormStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);

    // Scroll animation observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    document.querySelectorAll(".animate-on-scroll").forEach((el) => {
      observer.observe(el);
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  async function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormStatus("loading");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });

      if (res.ok) {
        setFormStatus("success");
        setContactForm({ name: "", email: "", phone: "", company: "", message: "" });
        setTimeout(() => setFormStatus("idle"), 5000);
      } else {
        setFormStatus("error");
        setTimeout(() => setFormStatus("idle"), 3000);
      }
    } catch {
      setFormStatus("error");
      setTimeout(() => setFormStatus("idle"), 3000);
    }
  }

  return (
    <>
      {/* ========== NAVIGATION ========== */}
      <nav className={`landing-nav ${isScrolled ? "scrolled" : ""}`}>
        <div className="nav-inner">
          <a href="/" className="nav-logo">
            <span className="logo-icon"><Shield size={24} /></span>
            WebSeg
          </a>
          <div className="nav-links">
            <a href="#features">Funcionalidades</a>
            <a href="#como-funciona">Como Funciona</a>
            <a href="#precos">Preços</a>
            <a href="#contato">Contato</a>
            <a href="/login" className="nav-cta">Entrar</a>
          </div>
          <button className="nav-mobile-toggle" aria-label="Menu" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="nav-mobile-overlay" onClick={() => setMobileMenuOpen(false)} />
        )}
        <div className={`nav-mobile-menu ${mobileMenuOpen ? "open" : ""}`}>
          <a href="#features" onClick={() => setMobileMenuOpen(false)}>Funcionalidades</a>
          <a href="#como-funciona" onClick={() => setMobileMenuOpen(false)}>Como Funciona</a>
          <a href="#precos" onClick={() => setMobileMenuOpen(false)}>Preços</a>
          <a href="#contato" onClick={() => setMobileMenuOpen(false)}>Contato</a>
          <a href="/login" className="nav-cta" onClick={() => setMobileMenuOpen(false)}>Entrar</a>
        </div>
      </nav>

      {/* ========== HERO ========== */}
      <section className="hero" id="hero">
        <div className="hero-particles">
          <div className="particle" />
          <div className="particle" />
          <div className="particle" />
          <div className="particle" />
          <div className="particle" />
        </div>

        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <div className="hero-badge">
                <span className="pulse-dot" />
                Plataforma #1 em Segurança Eletrônica
              </div>
              <h1>
                Sua loja virtual de <span className="highlight">CFTV e cerca elétrica</span> em minutos
              </h1>
              <p className="hero-subtitle">
                Crie sua vitrine online profissional, receba pedidos com agendamento
                de instalação integrado e gerencie sua equipe — tudo em um só lugar.
              </p>
              <div className="hero-buttons">
                <a href="#contato" className="btn-primary">
                  Comece Grátis por 14 dias →
                </a>
                <a href="#como-funciona" className="btn-secondary">
                  Ver demonstração
                </a>
              </div>
              <div className="hero-stats">
                <div className="hero-stat">
                  <div className="hero-stat-value">500+</div>
                  <div className="hero-stat-label">Instalações</div>
                </div>
                <div className="hero-stat">
                  <div className="hero-stat-value">50+</div>
                  <div className="hero-stat-label">Parceiros</div>
                </div>
                <div className="hero-stat">
                  <div className="hero-stat-value">99%</div>
                  <div className="hero-stat-label">Satisfação</div>
                </div>
              </div>
            </div>

            <div className="hero-visual">
              <div className="hero-mockup">
                <div className="hero-mockup-inner">
                  <div className="mockup-titlebar">
                    <div className="mockup-dot red" />
                    <div className="mockup-dot yellow" />
                    <div className="mockup-dot green" />
                    <div className="mockup-url">valentimseg.opensoftware.com.br</div>
                  </div>
                  <div className="mockup-content">
                    <div className="mockup-card">
                      <div className="mockup-card-img" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><Video size={32} color="#64748b" /></div>
                      <div className="mockup-card-title">Kit 4 Câmeras HD</div>
                      <div className="mockup-card-price">R$ 1.299,90</div>
                    </div>
                    <div className="mockup-card">
                      <div className="mockup-card-img" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><Camera size={32} color="#64748b" /></div>
                      <div className="mockup-card-title">Kit 8 Câmeras Full HD</div>
                      <div className="mockup-card-price">R$ 2.499,90</div>
                    </div>
                    <div className="mockup-card">
                      <div className="mockup-card-img" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><Zap size={32} color="#64748b" /></div>
                      <div className="mockup-card-title">Cerca Elétrica 60m</div>
                      <div className="mockup-card-price">R$ 1.899,90</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-header animate-on-scroll">
            <span className="section-tag">Funcionalidades</span>
            <h2 className="section-title">Tudo que você precisa em um só lugar</h2>
            <p className="section-subtitle">
              Elimine a necessidade de usar 3 ferramentas separadas. Com o WebSeg, sua loja, agenda e CRM estão integrados.
            </p>
          </div>

          <div className="features-grid">
            <div className="glass-card feature-card animate-on-scroll">
              <div className="feature-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><ShoppingCart size={24} /></div>
              <h3 className="feature-title">Loja Online Personalizada</h3>
              <p className="feature-desc">
                Sua vitrine digital com subdomínio próprio, cores, logo e banner personalizáveis. Sem precisar de desenvolvedor.
              </p>
            </div>

            <div className="glass-card feature-card animate-on-scroll">
              <div className="feature-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><CalendarDays size={24} /></div>
              <h3 className="feature-title">Agendamento Integrado</h3>
              <p className="feature-desc">
                O cliente escolhe a data da instalação direto no checkout. Sem trocas de mensagem, sem atrito.
              </p>
            </div>

            <div className="glass-card feature-card animate-on-scroll">
              <div className="feature-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><CreditCard size={24} /></div>
              <h3 className="feature-title">Pagamento Seguro</h3>
              <p className="feature-desc">
                Mercado Pago com validação de CPF integrada. Reduz chargebacks por &quot;compra não reconhecida&quot;.
              </p>
            </div>

            <div className="glass-card feature-card animate-on-scroll">
              <div className="feature-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><BarChart size={24} /></div>
              <h3 className="feature-title">Painel Admin Completo</h3>
              <p className="feature-desc">
                Gerencie produtos, pedidos, agenda de instalação e técnicos em um dashboard intuitivo e elegante.
              </p>
            </div>

            <div className="glass-card feature-card animate-on-scroll">
              <div className="feature-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><HardHat size={24} /></div>
              <h3 className="feature-title">App para Técnicos</h3>
              <p className="feature-desc">
                PWA mobile com ordens do dia, check-in/out, upload de fotos e relatório de serviço. Tudo no celular.
              </p>
            </div>

            <div className="glass-card feature-card animate-on-scroll">
              <div className="feature-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><Mail size={24} /></div>
              <h3 className="feature-title">Notificações por E-mail</h3>
              <p className="feature-desc">
                E-mails automáticos para cliente e parceiro: confirmação de pagamento, agendamento e atualizações.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="how-it-works" id="como-funciona">
        <div className="container">
          <div className="section-header animate-on-scroll">
            <span className="section-tag">Como Funciona</span>
            <h2 className="section-title">3 passos para começar</h2>
            <p className="section-subtitle">
              Do cadastro ao primeiro pedido em menos de 30 minutos.
            </p>
          </div>

          <div className="steps-container">
            <div className="step-card animate-on-scroll">
              <div className="step-number">1</div>
              <div className="step-connector" />
              <h3 className="step-title">Cadastre-se</h3>
              <p className="step-desc">
                Preencha os dados da sua empresa, escolha seu subdomínio e comece com 14 dias grátis. Sem cartão de crédito.
              </p>
            </div>

            <div className="step-card animate-on-scroll">
              <div className="step-number">2</div>
              <div className="step-connector" />
              <h3 className="step-title">Configure sua Loja</h3>
              <p className="step-desc">
                Adicione logo, cores, seus kits de câmeras e configure seus horários de atendimento. Pronto em minutos.
              </p>
            </div>

            <div className="step-card animate-on-scroll">
              <div className="step-number">3</div>
              <h3 className="step-title">Receba Pedidos</h3>
              <p className="step-desc">
                Compartilhe o link da sua loja, receba pedidos com pagamento e instalação agendada automaticamente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== PRICING ========== */}
      <section className="pricing" id="precos">
        <div className="container">
          <div className="section-header animate-on-scroll">
            <span className="section-tag">Preços</span>
            <h2 className="section-title">Planos para cada momento</h2>
            <p className="section-subtitle">
              Comece grátis, escale quando precisar. Sem surpresas na fatura.
            </p>
          </div>

          <div className="pricing-grid">
            {/* Básico */}
            <div className="glass-card pricing-card animate-on-scroll">
              <div className="pricing-plan-name">{PLANS.BASIC.name}</div>
              <div className="pricing-price">
                <span className="pricing-currency">R$</span>
                <span className="pricing-amount">{PLANS.BASIC.price}</span>
                <span className="pricing-period">/mês</span>
              </div>
              <ul className="pricing-features">
                {PLANS.BASIC.features.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
              <a href="#contato" className="pricing-btn pricing-btn-secondary">
                Começar agora
              </a>
            </div>

            {/* Profissional */}
            <div className="glass-card pricing-card popular animate-on-scroll">
              <div className="pricing-plan-name">{PLANS.PROFESSIONAL.name}</div>
              <div className="pricing-price">
                <span className="pricing-currency">R$</span>
                <span className="pricing-amount">{PLANS.PROFESSIONAL.price}</span>
                <span className="pricing-period">/mês</span>
              </div>
              <ul className="pricing-features">
                {PLANS.PROFESSIONAL.features.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
              <a href="#contato" className="pricing-btn pricing-btn-primary">
                Começar agora →
              </a>
            </div>

            {/* Enterprise */}
            <div className="glass-card pricing-card animate-on-scroll">
              <div className="pricing-plan-name">{PLANS.ENTERPRISE.name}</div>
              <div className="pricing-price">
                <span className="pricing-amount" style={{ fontSize: "var(--font-size-3xl)" }}>
                  Sob consulta
                </span>
              </div>
              <ul className="pricing-features">
                {PLANS.ENTERPRISE.features.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
              <a href="#contato" className="pricing-btn pricing-btn-secondary">
                Falar com vendas
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ========== CONTACT ========== */}
      <section className="contact" id="contato">
        <div className="container">
          <div className="contact-wrapper">
            <div className="contact-info animate-on-scroll">
              <span className="section-tag">Contato</span>
              <h2>Pronto para transformar seu negócio?</h2>
              <p>
                Solicite uma demonstração gratuita ou comece seu período de teste agora mesmo.
                Sem compromisso, sem cartão de crédito.
              </p>
              <ul className="contact-benefits">
                <li>
                  <span className="benefit-icon" style={{ display: "inline-flex" }}><Rocket size={18} /></span>
                  Setup em menos de 30 minutos
                </li>
                <li>
                  <span className="benefit-icon" style={{ display: "inline-flex" }}><CircleDollarSign size={18} /></span>
                  14 dias grátis para testar
                </li>
                <li>
                  <span className="benefit-icon" style={{ display: "inline-flex" }}><Lock size={18} /></span>
                  Pagamentos seguros via Mercado Pago
                </li>
                <li>
                  <span className="benefit-icon" style={{ display: "inline-flex" }}><Smartphone size={18} /></span>
                  Suporte por e-mail incluso
                </li>
              </ul>
            </div>

            <form className="glass-card contact-form animate-on-scroll" onSubmit={handleContactSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="contact-name">Nome completo</label>
                  <input
                    id="contact-name"
                    className="form-input"
                    type="text"
                    placeholder="Seu nome"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="contact-email">E-mail</label>
                  <input
                    id="contact-email"
                    className="form-input"
                    type="email"
                    placeholder="seu@email.com"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="contact-phone">Telefone</label>
                  <input
                    id="contact-phone"
                    className="form-input"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="contact-company">Empresa</label>
                  <input
                    id="contact-company"
                    className="form-input"
                    type="text"
                    placeholder="Nome da empresa"
                    value={contactForm.company}
                    onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="contact-message">Mensagem</label>
                <textarea
                  id="contact-message"
                  className="form-textarea"
                  placeholder="Conte-nos sobre seu negócio..."
                  required
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
                disabled={formStatus === "loading"}
              >
                {formStatus === "loading"
                  ? "Enviando..."
                  : formStatus === "success"
                  ? <><CheckCircle size={16} style={{ marginRight: "8px" }} /> Mensagem enviada!</>
                  : formStatus === "error"
                  ? <><XCircle size={16} style={{ marginRight: "8px" }} /> Erro. Tente novamente.</>
                  : "Solicitar demonstração →"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <a href="/" className="nav-logo">
                <span className="logo-icon"><Shield size={24} /></span>
                WebSeg
              </a>
              <p>
                Plataforma SaaS para empresas de segurança eletrônica.
                Crie sua loja, agende instalações e gerencie seu negócio.
              </p>
            </div>

            <div className="footer-col">
              <h4>Produto</h4>
              <a href="#features">Funcionalidades</a>
              <a href="#precos">Preços</a>
              <a href="#como-funciona">Como Funciona</a>
              <a href="#contato">Demonstração</a>
            </div>

            <div className="footer-col">
              <h4>Empresa</h4>
              <a href="#contato">Contato</a>
              <a href="/termos">Termos de Uso</a>
              <a href="/privacidade">Política de Privacidade</a>
            </div>

            <div className="footer-col">
              <h4>Suporte</h4>
              <a href="mailto:suporte@webseg.com.br">suporte@webseg.com.br</a>
              <a href="#contato">Central de Ajuda</a>
              <a href="/login">Acessar Painel</a>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} WebSeg. Todos os direitos reservados.</p>
            <a href="/login?role=admin" className="footer-admin-link">
              Área Administrativa
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
