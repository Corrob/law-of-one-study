"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type SearchMode = "chat" | "quote";

interface SearchModeContextType {
  mode: SearchMode;
  setMode: (mode: SearchMode) => void;
  toggleMode: () => void;
}

const SearchModeContext = createContext<SearchModeContextType | undefined>(undefined);

export function SearchModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<SearchMode>("chat");

  const toggleMode = () => {
    setMode((prev) => (prev === "chat" ? "quote" : "chat"));
  };

  return (
    <SearchModeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </SearchModeContext.Provider>
  );
}

export function useSearchMode() {
  const context = useContext(SearchModeContext);
  if (context === undefined) {
    throw new Error("useSearchMode must be used within a SearchModeProvider");
  }
  return context;
}
