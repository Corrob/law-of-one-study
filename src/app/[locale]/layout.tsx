import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { PostHogProvider } from "@/providers/PostHogProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { type AvailableLanguage } from "@/lib/language-config";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import PwaResumeReload from "@/components/PwaResumeReload";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import ReducedMotionProvider from "@/providers/ReducedMotionProvider";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as AvailableLanguage)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Get messages for the locale
  const messages = await getMessages();

  return (
    <PostHogProvider>
      <ThemeProvider>
        <ReducedMotionProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <ServiceWorkerRegistration />
            <PwaResumeReload />
            <PwaInstallPrompt />
            {children}
          </NextIntlClientProvider>
        </ReducedMotionProvider>
      </ThemeProvider>
    </PostHogProvider>
  );
}
