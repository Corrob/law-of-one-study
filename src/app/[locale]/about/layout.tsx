import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | Law of One Study Companion",
  description:
    "Learn about the Law of One Study Companion - an AI-powered tool for exploring the Ra Material. Free, open-source, and community-funded.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About | Law of One Study Companion",
    description:
      "Learn about the Law of One Study Companion - an AI-powered tool for exploring the Ra Material.",
    url: "https://lawofone.study/about",
    type: "website",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
