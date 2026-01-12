import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support | Law of One Study Companion",
  description:
    "Support the Law of One Study Companion - a free, open-source, community-funded tool for exploring the Ra Material.",
  alternates: {
    canonical: "/donate",
  },
  openGraph: {
    title: "Support | Law of One Study Companion",
    description:
      "Support the Law of One Study Companion - a free, open-source tool for exploring the Ra Material.",
    url: "https://lawofone.study/donate",
    type: "website",
  },
};

export default function DonateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
