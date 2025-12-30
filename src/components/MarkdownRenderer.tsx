"use client";

import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { parseConceptsInText } from "@/lib/conceptParser";
import ConceptPopover from "./ConceptPopover";
import { ReactNode } from "react";

interface MarkdownRendererProps {
  content: string;
  onSearch?: (term: string) => void;
}

export default function MarkdownRenderer({ content, onSearch }: MarkdownRendererProps) {
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
    p: ({ children, ...props }) => <p className="mb-3 last:mb-0" {...props}>{processChildrenWithConcepts(children, onSearch)}</p>,
    li: ({ children, ...props }) => <li {...props}>{processChildrenWithConcepts(children, onSearch)}</li>,
    strong: ({ children, ...props }) => <strong className="font-semibold text-[var(--lo1-starlight)]" {...props}>{processChildrenWithConcepts(children, onSearch)}</strong>,
    em: ({ children, ...props }) => <em className="italic" {...props}>{processChildrenWithConcepts(children, onSearch)}</em>,
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
function processChildrenWithConcepts(children: ReactNode, onSearch: (term: string) => void): ReactNode {
  if (typeof children === "string") {
    return <LinkedText text={children} onSearch={onSearch} />;
  }

  if (Array.isArray(children)) {
    return children.map((child, i) => {
      if (typeof child === "string") {
        return <LinkedText key={i} text={child} onSearch={onSearch} />;
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

// Extract concept linking logic for reuse
function LinkedText({ text, onSearch }: { text: string; onSearch: (term: string) => void }) {
  const segments = parseConceptsInText(text);

  // Process segments to attach punctuation to concepts
  const processedElements: ReactNode[] = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const nextSeg = segments[i + 1];

    if (seg.type === "text") {
      // Regular text segment
      processedElements.push(<span key={i}>{seg.content}</span>);
    } else {
      // Concept - check if next segment is punctuation-only
      if (nextSeg && nextSeg.type === "text" && isPunctuationOnly(nextSeg.content)) {
        // Wrap concept and punctuation together to prevent line-break between them
        processedElements.push(
          <span key={i} style={{ whiteSpace: "nowrap" }}>
            <ConceptPopover
              term={seg.searchTerm}
              displayText={seg.displayText}
              onSearch={onSearch}
            />
            {nextSeg.content}
          </span>
        );
        i++; // Skip the punctuation segment since we've included it
      } else {
        processedElements.push(
          <ConceptPopover
            key={i}
            term={seg.searchTerm}
            displayText={seg.displayText}
            onSearch={onSearch}
          />
        );
      }
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
};
