import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

/**
 * Locale-aware navigation utilities.
 *
 * Use these instead of next/navigation and next/link:
 * - Link: Automatically handles locale in URLs
 * - redirect: Server-side redirect with locale
 * - usePathname: Returns pathname without locale prefix
 * - useRouter: Router with locale-aware navigation
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
