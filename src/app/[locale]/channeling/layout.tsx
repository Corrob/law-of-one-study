import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conscious Channeling | Law of One Study Companion",
  description:
    "Browse curated themes from L/L Research's conscious channeling — Q'uo, Latwii, and Hatonn — in plain summaries, each linked to the original transcript on llresearch.org.",
  alternates: {
    canonical: "/channeling",
  },
  openGraph: {
    title: "Conscious Channeling | Law of One Study Companion",
    description:
      "Curated themes from L/L Research's conscious channeling (Q'uo, Latwii, Hatonn), linked to the original transcripts.",
    url: "https://lawofone.study/channeling",
    type: "website",
  },
};

export default function ChannelingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
