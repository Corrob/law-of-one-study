"use client";

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";
import CitationModal from "@/components/CitationModal";
import { Quote } from "@/lib/types";

type CitationModalState =
  | { type: "ra"; session: number; question: number }
  | { type: "confederation"; reference: string; text: string; url: string; entity: string };

interface CitationModalContextValue {
  openCitation: (session: number, question: number) => void;
  openConfederationCitation: (reference: string, fallbackUrl?: string) => void;
  closeCitation: () => void;
  setQuotes: (quotes: Quote[]) => void;
}

const CitationModalContext = createContext<CitationModalContextValue | null>(null);

export function useCitationModal() {
  const context = useContext(CitationModalContext);
  if (!context) {
    throw new Error("useCitationModal must be used within CitationModalProvider");
  }
  return context;
}

interface CitationModalProviderProps {
  children: ReactNode;
}

/**
 * Provides citation modal state at the app level.
 *
 * This prevents the modal from closing when streaming content causes
 * re-renders of the message components. The modal state lives above
 * the content that changes.
 */
export function CitationModalProvider({ children }: CitationModalProviderProps) {
  const [modalState, setModalState] = useState<CitationModalState | null>(null);
  const quotesRef = useRef<Quote[]>([]);

  const setQuotes = useCallback((quotes: Quote[]) => {
    quotesRef.current = quotes;
  }, []);

  const openCitation = useCallback((session: number, question: number) => {
    setModalState({ type: "ra", session, question });
  }, []);

  const openConfederationCitation = useCallback((reference: string, fallbackUrl?: string) => {
    const quote = quotesRef.current.find((q) => q.reference === reference);
    if (!quote) {
      // Quote text not available — fall back to opening transcript in new tab
      if (fallbackUrl) {
        window.open(fallbackUrl, "_blank", "noopener,noreferrer");
      }
      return;
    }

    const entity = reference.split(",")[0].trim();
    setModalState({
      type: "confederation",
      reference,
      text: quote.text,
      url: quote.url,
      entity,
    });
  }, []);

  const closeCitation = useCallback(() => {
    setModalState(null);
  }, []);

  return (
    <CitationModalContext.Provider value={{ openCitation, openConfederationCitation, closeCitation, setQuotes }}>
      {children}
      {modalState?.type === "ra" && (
        <CitationModal
          isOpen={true}
          onClose={closeCitation}
          session={modalState.session}
          question={modalState.question}
        />
      )}
      {modalState?.type === "confederation" && (
        <CitationModal
          isOpen={true}
          onClose={closeCitation}
          confederationRef={modalState.reference}
          confederationText={modalState.text}
          confederationUrl={modalState.url}
          confederationEntity={modalState.entity}
        />
      )}
    </CitationModalContext.Provider>
  );
}
