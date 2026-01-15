import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Law of One Study Companion | AI-Powered Ra Material Explorer",
  description:
    "Explore the Ra Material with an AI-powered study companion. Search 1,500+ Q&A pairs from 106 sessions. Free, open-source tool for Law of One students.",
  keywords: [
    "Law of One",
    "Ra Material",
    "L/L Research",
    "Ra Contact",
    "spiritual study",
    "metaphysics",
    "channeling",
    "consciousness",
  ],
  authors: [{ name: "Law of One Study Community" }],
  metadataBase: new URL("https://lawofone.study"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Law of One Study Companion",
    description:
      "AI-powered companion for exploring the Ra Material. Search 1,500+ Q&A pairs from 106 sessions.",
    url: "https://lawofone.study",
    siteName: "Law of One Study Companion",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Law of One Study Companion - AI-powered Ra Material explorer",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Law of One Study Companion",
    description: "AI-powered companion for exploring the Ra Material",
    images: ["/og-image.png"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  // Get nonce from middleware for CSP
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") ?? undefined;

  // Get locale from next-intl (set by middleware based on URL)
  const locale = await getLocale();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Law of One Study Companion",
    description: "AI-powered companion for exploring the Ra Material",
    url: "https://lawofone.study",
    applicationCategory: "EducationalApplication",
    about: {
      "@type": "Thing",
      name: "The Law of One",
      description: "The Ra Material - channeled teachings from the social memory complex Ra",
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    inLanguage: locale === "es" ? "es" : "en-US",
  };

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* suppressHydrationWarning needed because browsers strip nonce from DOM after execution */}
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  // Default to dark mode unless user explicitly chose light
                  document.documentElement.setAttribute('data-theme', theme || 'dark');
                } catch (e) {
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              })();
            `,
          }}
        />
        <script
          nonce={nonce}
          suppressHydrationWarning
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} ${cormorant.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
