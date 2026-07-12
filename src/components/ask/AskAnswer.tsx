"use client";

import { memo, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "@/i18n/navigation";
import { renderAskMarkdown } from "@/lib/ask/resource-links";
import { type AvailableLanguage } from "@/lib/language-config";

interface AskAnswerProps {
  /** Raw assistant text, may contain {{CITE:...}} and {{LINK:...}} markers. */
  content: string;
}

// Citation links we generate always point here; match the exact origin so a
// model-authored link to a look-alike host doesn't get the trusted chip styling.
const CITATION_ORIGIN = "https://www.llresearch.org";

const buildMarkdownComponents = (citationTitle: string): Components => ({
  p: ({ children, ...props }) => (
    <p className="mb-3 last:mb-0 leading-relaxed" {...props}>
      {children}
    </p>
  ),
  // Section headings for longer answers — styled on-theme (react-markdown would
  // otherwise fall back to large unstyled browser defaults).
  h2: ({ children, ...props }) => (
    <h2 className="mt-4 mb-2 text-base font-semibold text-[var(--lo1-gold)]" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="mt-4 mb-1.5 text-sm font-semibold text-[var(--lo1-gold)]" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4 className="mt-3 mb-1 text-sm font-semibold text-[var(--lo1-starlight)]" {...props}>
      {children}
    </h4>
  ),
  ul: ({ children, ...props }) => (
    <ul className="list-disc list-outside mb-3 space-y-1.5 pl-5" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="list-decimal list-outside mb-3 space-y-1.5 pl-5" {...props}>
      {children}
    </ol>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-[var(--lo1-starlight)]" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em className="italic" {...props}>
      {children}
    </em>
  ),
  a: ({ children, href, ...props }) => {
    // Internal resource link ({{LINK:...}} marker) → locale-aware client-side
    // navigation in the same tab; visually distinct from citation chips.
    if (typeof href === "string" && href.startsWith("/")) {
      return (
        <Link
          href={href}
          className="text-[var(--lo1-gold)] underline decoration-dotted underline-offset-2
                     hover:decoration-solid transition-colors cursor-pointer"
        >
          {children}
        </Link>
      );
    }
    const isCitation = typeof href === "string" && href.startsWith(CITATION_ORIGIN);
    if (isCitation) {
      // Citation chip → the original session on L/L Research's site.
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-baseline align-baseline mx-0.5 px-1.5 py-0.5 rounded text-xs font-medium
                     bg-[var(--lo1-gold)]/15 text-[var(--lo1-gold)] hover:bg-[var(--lo1-gold)]/25
                     no-underline transition-colors cursor-pointer"
          title={citationTitle}
        >
          {children}
        </a>
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[var(--lo1-gold)] hover:underline cursor-pointer"
        {...props}
      >
        {children}
      </a>
    );
  },
});

/**
 * Renders an assistant answer: citation markers become locale-aware links to
 * L/L Research, resource-link markers become internal links to the site's own
 * features, then the result is rendered as Markdown. No Ra Material is
 * reproduced verbatim — only the assistant's own words plus source links.
 */
const AskAnswer = memo(function AskAnswer({ content }: AskAnswerProps) {
  const locale = useLocale() as AvailableLanguage;
  const t = useTranslations("ask");
  const citationTitle = t("citationTitle");
  const components = useMemo(() => buildMarkdownComponents(citationTitle), [citationTitle]);
  const markdown = renderAskMarkdown(content, locale);
  return (
    <div className="text-[var(--lo1-text-light)]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
});

export default AskAnswer;
