import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WebSeg - Plataforma SaaS para Segurança Eletrônica",
  description:
    "Crie sua loja virtual de CFTV, cerca elétrica e alarmes em minutos. Agendamento de instalação integrado ao checkout, pagamento seguro e painel admin completo.",
  keywords: [
    "CFTV",
    "segurança eletrônica",
    "câmeras",
    "cerca elétrica",
    "alarme",
    "loja virtual",
    "SaaS",
    "instalação",
    "agendamento",
  ],
  authors: [{ name: "WebSeg" }],
  openGraph: {
    title: "WebSeg - Sua loja virtual de CFTV em minutos",
    description:
      "Plataforma completa para empresas de segurança eletrônica. Loja online, agendamento e gestão integrados.",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
