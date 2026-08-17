export const APP_NAME = "WebSeg";

export const PLANS = {
  FREE_TRIAL: {
    name: "Teste Grátis",
    price: 0,
    maxProducts: 3,
    maxTechnicians: 1,
    features: [
      "Loja online personalizada",
      "Até 3 produtos",
      "1 técnico",
      "Agendamento básico",
      "14 dias grátis",
    ],
  },
  BASIC: {
    name: "Básico",
    price: 99,
    maxProducts: 5,
    maxTechnicians: 1,
    features: [
      "Loja online personalizada",
      "Até 5 produtos",
      "1 técnico",
      "Agendamento integrado",
      "Pagamento via Mercado Pago",
      "Painel admin completo",
      "Suporte por e-mail",
    ],
  },
  PROFESSIONAL: {
    name: "Profissional",
    price: 199,
    maxProducts: -1, // unlimited
    maxTechnicians: -1, // unlimited
    features: [
      "Produtos ilimitados",
      "Técnicos ilimitados",
      "App para técnicos (PWA)",
      "Relatórios avançados",
      "Notificações por e-mail",
      "Upsell automático",
      "Suporte prioritário",
    ],
    popular: true,
  },
  ENTERPRISE: {
    name: "Enterprise",
    price: -1, // custom
    maxProducts: -1,
    maxTechnicians: -1,
    features: [
      "Tudo do Profissional",
      "Customizações exclusivas",
      "API dedicada",
      "Suporte com SLA",
      "Treinamento personalizado",
      "Domínio próprio",
    ],
  },
} as const;

export type TenantPlan = keyof typeof PLANS;

export const PRODUCT_CATEGORIES = [
  { value: "CFTV", label: "CFTV / Câmeras" },
  { value: "CERCA_ELETRICA", label: "Cerca Elétrica" },
  { value: "ALARME", label: "Alarme" },
  { value: "SENSOR", label: "Sensores" },
  { value: "AUTOMACAO", label: "Automação" },
  { value: "SERVICO", label: "Serviço Avulso" },
  { value: "OUTROS", label: "Outros" },
] as const;

export const ORDER_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING_PAYMENT: { label: "Aguardando Pagamento", color: "#f59e0b" },
  PAID: { label: "Pago", color: "#22c55e" },
  SCHEDULED: { label: "Agendado", color: "#3b82f6" },
  IN_PROGRESS: { label: "Em Andamento", color: "#8b5cf6" },
  COMPLETED: { label: "Concluído", color: "#06d6a0" },
  CANCELLED: { label: "Cancelado", color: "#ef4444" },
  REFUNDED: { label: "Estornado", color: "#6b7280" },
};

export const SCHEDULE_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  AVAILABLE: { label: "Disponível", color: "#22c55e" },
  RESERVED: { label: "Reservado", color: "#f59e0b" },
  CONFIRMED: { label: "Confirmado", color: "#3b82f6" },
  IN_PROGRESS: { label: "Em Andamento", color: "#8b5cf6" },
  COMPLETED: { label: "Concluído", color: "#06d6a0" },
  CANCELLED: { label: "Cancelado", color: "#ef4444" },
};

export const DAYS_OF_WEEK = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
] as const;

export const BRAZILIAN_STATES = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO",
  "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR",
  "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
] as const;
