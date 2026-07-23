import { MetadataRoute } from "next";
import { getChannelingThemes } from "@/lib/ask/channeling";

const BASE = "https://lawofone.study";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Conscious-channeling browse page + one entry per theme (English-only; the
  // default locale has no path prefix under localePrefix: "as-needed").
  const channeling: MetadataRoute.Sitemap = [
    {
      url: `${BASE}/channeling`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...getChannelingThemes().map((theme) => ({
      url: `${BASE}/channeling/${theme.id}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];

  return [
    {
      url: BASE,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE}/support`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...channeling,
  ];
}
