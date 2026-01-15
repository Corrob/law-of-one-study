/**
 * Mock for @/i18n/navigation used in tests.
 *
 * Provides mock implementations of locale-aware navigation utilities.
 * This avoids ESM module issues with next-intl/navigation in Jest.
 */
import React from "react";

// Mock Link component that passes through to a regular anchor
export const Link = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
>(function MockLink({ href, children, ...props }, ref) {
  return React.createElement("a", { ref, href, ...props }, children);
});

// Mock redirect that throws (like the real one)
export function redirect(pathname: string): never {
  throw new Error(`NEXT_REDIRECT: ${pathname}`);
}

// Mock usePathname - returns the current path
export function usePathname(): string {
  return "/";
}

// Mock useRouter with common navigation methods
export function useRouter() {
  return {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  };
}

// Mock getPathname
export function getPathname(params: { locale: string; href: string }): string {
  return params.href;
}
