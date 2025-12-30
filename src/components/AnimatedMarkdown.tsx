"use client";

import { useState, useEffect, useRef, useMemo, cloneElement, isValidElement } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

interface AnimatedMarkdownProps {
  content: string;
  onComplete: () => void;
  speed?: number; // ms per word
}

// Global word counter shared across all text nodes during a single render
let globalWordIndex = 0;

export default function AnimatedMarkdown({ content, onComplete, speed = 50 }: AnimatedMarkdownProps) {
  const [visibleWords, setVisibleWords] = useState(0);
  const hasCompletedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  // Keep onComplete ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Count total words in content
  const totalWords = useMemo(() => {
    const words = content.match(/\s*\S+\s*/g) || [];
    return words.length;
  }, [content]);

  useEffect(() => {
    // Reset state for new content
    hasCompletedRef.current = false;
    setVisibleWords(0);

    if (totalWords === 0) {
      // Empty content - complete immediately
      onCompleteRef.current();
      return;
    }

    let index = 0;

    const interval = setInterval(() => {
      if (index < totalWords) {
        index++;
        setVisibleWords(index);
      } else {
        clearInterval(interval);
        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true;
          onCompleteRef.current();
        }
      }
    }, speed);

    return () => clearInterval(interval);
  }, [content, totalWords, speed]);

  // Reset global counter before each render
  globalWordIndex = 0;

  // Custom components that handle word-by-word animation
  const animatedComponents: Components = {
    p: ({ children, ...props }) => (
      <p className="mb-3 last:mb-0" {...props}>
        <AnimatedChildren visibleWords={visibleWords}>{children}</AnimatedChildren>
      </p>
    ),
    ul: ({ children, ...props }) => (
      <ul className="list-disc list-inside mb-3 space-y-1" {...props}>{children}</ul>
    ),
    ol: ({ children, ...props }) => (
      <ol className="list-decimal list-inside mb-3 space-y-1" {...props}>{children}</ol>
    ),
    li: ({ children, ...props }) => (
      <AnimatedListItem visibleWords={visibleWords} {...props}>
        {children}
      </AnimatedListItem>
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
  };

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={animatedComponents}>
      {content}
    </ReactMarkdown>
  );
}

// Component for animated list items - hides bullet until first word is visible
function AnimatedListItem({
  children,
  visibleWords,
  ...props
}: {
  children: React.ReactNode;
  visibleWords: number;
  [key: string]: unknown;
}) {
  const startWordIndex = globalWordIndex;

  // Count how many words are in this list item (excluding nested lists)
  const extractTextContent = (node: React.ReactNode): string => {
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(extractTextContent).join('');
    // Skip nested list elements (ul, ol) - they'll be animated separately
    if (isValidElement(node)) {
      const element = node as React.ReactElement;
      if (element.type === 'ul' || element.type === 'ol') {
        return '';
      }
      // Recursively extract from other elements
      const props = element.props as { children?: React.ReactNode };
      return extractTextContent(props.children);
    }
    return '';
  };

  const textContent = extractTextContent(children);
  const words = textContent.match(/\s*\S+\s*/g) || [];
  const hasVisibleWords = startWordIndex < visibleWords;

  return (
    <li
      className="ml-2"
      style={{
        opacity: hasVisibleWords ? 1 : 0,
        transition: "opacity 150ms ease-in",
      }}
      {...props}
    >
      <AnimatedChildren visibleWords={visibleWords}>{children}</AnimatedChildren>
    </li>
  );
}

// Component to handle animated text within markdown elements
function AnimatedChildren({
  children,
  visibleWords
}: {
  children: React.ReactNode;
  visibleWords: number;
}) {
  const animateNode = (node: React.ReactNode): React.ReactNode => {
    if (typeof node === 'string') {
      // Split text into words, preserving both leading and trailing whitespace
      const words = node.match(/\s*\S+\s*/g) || [];

      return words.map((word, idx) => {
        const wordIndex = globalWordIndex++;
        const isVisible = wordIndex < visibleWords;

        return (
          <span
            key={idx}
            style={{
              opacity: isVisible ? 1 : 0,
              transition: "opacity 150ms ease-in",
            }}
          >
            {word}
          </span>
        );
      });
    }

    if (Array.isArray(node)) {
      return node.map((child, idx) => {
        const animated = animateNode(child);
        // If the result is already a React element, don't wrap it
        if (isValidElement(animated)) {
          return <span key={idx}>{animated}</span>;
        }
        // For arrays or fragments, return as-is with key
        return <span key={idx}>{animated}</span>;
      });
    }

    // Handle React elements (like <strong>, <em>) by recursively processing their children
    if (isValidElement(node)) {
      const props = node.props as { children?: React.ReactNode };
      // Clone with only the children replaced (props are already in the node)
      return cloneElement(node, {}, animateNode(props.children));
    }

    // For other node types, just return as-is
    return node;
  };

  return <>{animateNode(children)}</>;
}
