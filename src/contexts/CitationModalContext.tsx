"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import CitationModal from "@/components/CitationModal";

interface CitationModalState {
  session: number;
  question: number;
}

interface CitationModalContextValue {
  openCitation: (session: number, question: number) => void;
  closeCitation: () => void;
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

  const openCitation = useCallback((session: number, question: number) => {
    setModalState({ session, question });
  }, []);

  const closeCitation = useCallback(() => {
    setModalState(null);
  }, []);

  return (
    <CitationModalContext.Provider value={{ openCitation, closeCitation }}>
      {children}
      {modalState && (
        <CitationModal
          isOpen={true}
          onClose={closeCitation}
          session={modalState.session}
          question={modalState.question}
        />
      )}
    </CitationModalContext.Provider>
  );
}
