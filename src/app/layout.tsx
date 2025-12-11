import type { Metadata, Viewport } from "next";
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
  // Base URL para links absolutos
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://vistoria-pro.com.br'),
  
  // Título com template para páginas internas
  title: {
    default: "VistorIA Pro - Laudos de Vistoria com Inteligência Artificial",
    template: "%s | VistorIA Pro",
  },
  
  // Descrição otimizada para SEO
  description: "Plataforma #1 de vistorias imobiliárias com IA. Crie laudos profissionais em minutos com análise automática de fotos e vídeos. Claude 4 AI detecta problemas, estima custos e gera relatórios completos.",
  
  // Keywords relevantes
  keywords: [
    "vistoria imobiliária",
    "laudo de vistoria",
    "vistoria com IA",
    "software vistoria imóveis",
    "laudo imobiliário",
    "vistoria entrada saída",
    "app vistoria",
    "relatório vistoria",
    "inspeção imobiliária",
    "vistoria aluguel",
    "checklist vistoria",
    "vistoria profissional",
  ],
  
  // Autoria
  authors: [{ name: "VistorIA Pro", url: "https://vistoria-pro.com.br" }],
  creator: "VistorIA Pro",
  publisher: "VistorIA Pro",
  
  // Robots
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  
  // PWA / App
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VistorIA Pro",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  
  // Open Graph (Facebook, LinkedIn, WhatsApp)
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://vistoria-pro.com.br",
    siteName: "VistorIA Pro",
    title: "VistorIA Pro - Laudos de Vistoria com Inteligência Artificial",
    description: "Crie laudos de vistoria profissionais em minutos. IA Claude 4 analisa fotos, detecta problemas automaticamente e estima custos de reparo.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "VistorIA Pro - Vistorias Inteligentes com IA",
        type: "image/png",
      },
    ],
  },
  
  // Twitter Cards
  twitter: {
    card: "summary_large_image",
    title: "VistorIA Pro - Laudos de Vistoria com IA",
    description: "Crie laudos profissionais em minutos com análise automática de IA. Detecta problemas, estima custos e gera relatórios completos.",
    images: ["/og-image.png"],
    creator: "@vistoriapro",
    site: "@vistoriapro",
  },
  
  // Links alternativos
  alternates: {
    canonical: "https://vistoria-pro.com.br",
    languages: {
      "pt-BR": "https://vistoria-pro.com.br",
    },
  },
  
  // Verificação de propriedade
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || "",
    // yandex: "",
    // bing: "",
  },
  
  // Categoria do app
  category: "technology",
  
  // Outros
  applicationName: "VistorIA Pro",
  referrer: "origin-when-cross-origin",
  generator: "Next.js",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#6366f1" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://vistoria-pro.com.br/#organization",
        "name": "VistorIA Pro",
        "url": "https://vistoria-pro.com.br",
        "logo": {
          "@type": "ImageObject",
          "url": "https://vistoria-pro.com.br/logo.png",
          "width": 512,
          "height": 512
        },
        "description": "Plataforma líder em vistorias imobiliárias com inteligência artificial",
        "sameAs": [
          "https://twitter.com/vistoriapro",
          "https://linkedin.com/company/vistoriapro"
        ]
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://vistoria-pro.com.br/#software",
        "name": "VistorIA Pro",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web Browser",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "BRL",
          "description": "Plano gratuito com 3 vistorias"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.9",
          "ratingCount": "127",
          "bestRating": "5",
          "worstRating": "1"
        },
        "description": "Crie laudos de vistoria profissionais em minutos com IA Claude 4",
        "publisher": {
          "@id": "https://vistoria-pro.com.br/#organization"
        }
      },
      {
        "@type": "WebSite",
        "@id": "https://vistoria-pro.com.br/#website",
        "url": "https://vistoria-pro.com.br",
        "name": "VistorIA Pro",
        "publisher": {
          "@id": "https://vistoria-pro.com.br/#organization"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://vistoria-pro.com.br/search?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      }
    ]
  };

  return (
    <ClerkProvider>
      <html lang="pt-BR" className={inter.variable}>
        <head>
          <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        </head>
        <body className="antialiased">
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
