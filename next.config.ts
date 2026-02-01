import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const STATIC_CACHE_MAX_AGE = "public, max-age=2592000"; // 30 days

const nextConfig: NextConfig = {
  // Required for PostHog proxy
  skipTrailingSlashRedirect: true,
  // PostHog reverse proxy to avoid ad blockers
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
      {
        source: "/ingest/decide",
        destination: "https://us.i.posthog.com/decide",
      },
    ];
  },
  // Cache static assets that rarely change
  async headers() {
    return [
      {
        // Ra material JSON files - cache for 30 days
        source: "/sections/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: STATIC_CACHE_MAX_AGE,
          },
        ],
      },
      {
        // Tarot and other static images - cache for 30 days
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: STATIC_CACHE_MAX_AGE,
          },
        ],
      },
      {
        // PWA icons - cache for 30 days
        source: "/icons/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: STATIC_CACHE_MAX_AGE,
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
