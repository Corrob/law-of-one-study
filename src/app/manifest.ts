import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Law of One Study Companion",
    short_name: "Law of One",
    description:
      "AI-powered companion for exploring the Ra Material. Search 1,500+ Q&A pairs from 106 sessions.",
    start_url: "/",
    display: "standalone",
    background_color: "#1a1f4e",
    theme_color: "#1a1f4e",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
