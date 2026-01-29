"use client";

import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { parseConceptsInText } from "@/lib/conceptParser";
import { parseCitationsInText } from "@/lib/citationParser";
import ConceptPopover from "./ConceptPopover";
import CitationLink from "./CitationLink";
import { ReactNode } from "react";
import type { AvailableLanguage } from "@/lib/language-config";

interface MarkdownRendererProps {
  content: string;
  onSearch?: (term: string) => void;
  locale?: AvailableLanguage;
}

export default function MarkdownRenderer({ content, onSearch, locale = "en" }: MarkdownRendererProps) {
  // If no search handler, just render plain markdown
  if (!onSearch) {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    );
  }

  // With search handler, render markdown with concept linking
  const componentsWithConcepts: Components = {
    ...markdownComponents,
    // Override text rendering to add concept linking
    p: ({ children, ...props }) => <p className="mb-3 last:mb-0" {...props}>{processChildrenWithConcepts(children, onSearch, locale)}</p>,
    li: ({ children, ...props }) => <li {...props}>{processChildrenWithConcepts(children, onSearch, locale)}</li>,
    strong: ({ children, ...props }) => <strong className="font-semibold text-[var(--lo1-starlight)]" {...props}>{processChildrenWithConcepts(children, onSearch, locale)}</strong>,
    em: ({ children, ...props }) => <em className="italic" {...props}>{processChildrenWithConcepts(children, onSearch, locale)}</em>,
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={componentsWithConcepts}
    >
      {content}
    </ReactMarkdown>
  );
}

// Process children nodes and add concept linking to text nodes
function processChildrenWithConcepts(children: ReactNode, onSearch: (term: string) => void, locale: AvailableLanguage): ReactNode {
  if (typeof children === "string") {
    return <LinkedText text={children} onSearch={onSearch} locale={locale} />;
  }

  if (Array.isArray(children)) {
    return children.map((child, i) => {
      if (typeof child === "string") {
        return <LinkedText key={i} text={child} onSearch={onSearch} locale={locale} />;
      }
      return child;
    });
  }

  return children;
}

// Check if text is just punctuation (should stay attached to previous element)
function isPunctuationOnly(text: string): boolean {
  return /^[.,!?;:'")\]}>]+$/.test(text.trim());
}

// Process text for concept linking (used for text segments after citation parsing)
function processTextWithConcepts(text: string, onSearch: (term: string) => void, keyPrefix: string, locale: AvailableLanguage): ReactNode[] {
  const segments = parseConceptsInText(text, locale);
  const processedElements: ReactNode[] = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const nextSeg = segments[i + 1];

    if (seg.type === "text") {
      processedElements.push(seg.content);
    } else {
      // Concept - check if next segment is punctuation-only
      if (nextSeg && nextSeg.type === "text" && isPunctuationOnly(nextSeg.content)) {
        processedElements.push(
          <span key={`${keyPrefix}-${i}`} style={{ whiteSpace: "nowrap" }}>
            <ConceptPopover
              term={seg.searchTerm}
              displayText={seg.displayText}
              onSearch={onSearch}
            />
            {nextSeg.content}
          </span>
        );
        i++; // Skip the punctuation segment
      } else {
        processedElements.push(
          <ConceptPopover
            key={`${keyPrefix}-${i}`}
            term={seg.searchTerm}
            displayText={seg.displayText}
            onSearch={onSearch}
          />
        );
      }
    }
  }

  return processedElements;
}

// Extract citation and concept linking logic
// First parses citations, then parses concepts within text segments
function LinkedText({ text, onSearch, locale }: { text: string; onSearch: (term: string) => void; locale: AvailableLanguage }) {
  const citationSegments = parseCitationsInText(text);
  const processedElements: ReactNode[] = [];

  for (let i = 0; i < citationSegments.length; i++) {
    const seg = citationSegments[i];

    if (seg.type === "citation") {
      // Render citation as clickable link
      processedElements.push(
        <CitationLink
          key={`cite-${i}`}
          session={seg.session}
          question={seg.question}
          displayText={seg.displayText}
        />
      );
    } else {
      // Text segment - parse for concepts
      const conceptElements = processTextWithConcepts(seg.content, onSearch, `text-${i}`, locale);
      processedElements.push(...conceptElements);
    }
  }

  return <>{processedElements}</>;
}

// Custom markdown components with Tailwind styling
const markdownComponents: Components = {
  // Paragraphs
  p: ({ children, ...props }) => (
    <p className="mb-3 last:mb-0" {...props}>{children}</p>
  ),

  // Unordered lists
  ul: ({ children, ...props }) => (
    <ul className="list-disc list-outside mb-3 space-y-2 pl-5" {...props}>{children}</ul>
  ),

  // Ordered lists
  ol: ({ children, ...props }) => (
    <ol className="list-decimal list-outside mb-3 space-y-2 pl-5" {...props}>{children}</ol>
  ),

  // List items
  li: ({ children, ...props }) => (
    <li {...props}>{children}</li>
  ),

  // Bold text
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-[var(--lo1-starlight)]" {...props}>{children}</strong>
  ),

  // Italic text
  em: ({ children, ...props }) => (
    <em className="italic" {...props}>{children}</em>
  ),

  // Table components
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto mb-3">
      <table className="w-full border-collapse text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-[var(--lo1-deep-purple)]/30" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }) => (
    <tbody className="divide-y divide-[var(--lo1-mystic-purple)]/20" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }) => (
    <tr className="hover:bg-[var(--lo1-deep-purple)]/10 transition-colors" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }) => (
    <th className="px-3 py-2 text-left font-semibold text-[var(--lo1-starlight)] border-b border-[var(--lo1-mystic-purple)]/30" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="px-3 py-2 text-[var(--lo1-text-light)]" {...props}>
      {children}
    </td>
  ),
};
