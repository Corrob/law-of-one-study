import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Create the i18n middleware
const intlMiddleware = createIntlMiddleware(routing);

const isDev = process.env.NODE_ENV === "development";

/**
 * Add security headers to a response.
 */
function addSecurityHeaders(response: NextResponse, nonce: string) {
  // Build CSP with nonce
  // In development, skip nonce and use unsafe-inline/unsafe-eval for HMR
  // (nonce causes unsafe-inline to be ignored per CSP spec)
  const cspHeader = isDev
    ? [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https:",
        "connect-src 'self' ws://localhost:* http://localhost:*",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join("; ")
    : [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https:",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "upgrade-insecure-requests",
      ].join("; ");

  // Set CSP header on response
  response.headers.set("Content-Security-Policy", cspHeader);

  // Also set other security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );
  response.headers.set("X-DNS-Prefetch-Control", "on");
  if (!isDev) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }

  return response;
}

/**
 * Proxy for nonce-based Content Security Policy and i18n routing.
 *
 * - Handles locale routing (en uses unprefixed paths, es uses /es prefix)
 * - Generates a unique nonce for each request for CSP
 * - Adds security headers to all responses
 */
export function proxy(request: NextRequest) {
  // Generate a random nonce for this request
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  // Clone request headers and add nonce
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  // Run the i18n middleware first
  const intlResponse = intlMiddleware(request);

  // If it's a redirect, add security headers and return
  if (intlResponse.status >= 300 && intlResponse.status < 400) {
    return addSecurityHeaders(intlResponse as NextResponse, nonce);
  }

  // Create response with modified request headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Copy any headers set by intl middleware (like locale cookie)
  intlResponse.headers.forEach((value, key) => {
    response.headers.set(key, value);
  });

  return addSecurityHeaders(response, nonce);
}

// Match all routes except static files and API routes
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.svg (favicon files)
     * - ingest (PostHog proxy)
     * - sections (static JSON files for Ra Material quotes)
     * - images (static images like tarot cards)
     */
    "/((?!api|_next/static|_next/image|favicon\\.ico|icon\\.svg|ingest|sections|images).*)",
  ],
};
