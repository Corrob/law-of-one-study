"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
    const words = content.match(/\S+\s*/g) || [];
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

  // Count how many words are in this list item
  const extractTextContent = (node: React.ReactNode): string => {
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(extractTextContent).join('');
    return '';
  };

  const textContent = extractTextContent(children);
  const words = textContent.match(/\S+\s*/g) || [];
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
      // Split text into words
      const words = node.match(/\S+\s*/g) || [];

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
      return node.map((child, idx) => (
        <span key={idx}>{animateNode(child)}</span>
      ));
    }

    // Handle React elements (like <strong>, <em>) by recursively processing their children
    if (node && typeof node === 'object' && 'props' in node) {
      const element = node as React.ReactElement<{ children?: React.ReactNode }>;
      const props = element.props as { children?: React.ReactNode; [key: string]: unknown };
      return {
        ...element,
        props: {
          ...props,
          children: animateNode(props.children)
        }
      } as React.ReactElement;
    }

    // For other node types, just return as-is
    return node;
  };

  return <>{animateNode(children)}</>;
}
