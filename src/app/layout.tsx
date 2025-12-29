import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "@/providers/PostHogProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
    inLanguage: "en-US",
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} ${cormorant.variable} antialiased`}>
        <PostHogProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
