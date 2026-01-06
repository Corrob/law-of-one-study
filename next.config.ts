import type { NextConfig } from "next";

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
  // Security headers are now managed by middleware.ts for nonce-based CSP
};

export default nextConfig;
