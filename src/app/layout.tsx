import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "VistorIA Pro - Laudos de Vistoria com IA",
  description: "Plataforma SaaS para criação de laudos de vistoria imobiliária com análise inteligente de fotos usando IA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="pt-BR" className={inter.variable}>
        <body className="antialiased">
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
