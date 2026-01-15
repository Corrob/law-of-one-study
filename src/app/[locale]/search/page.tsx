"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import NavigationWrapper from "@/components/NavigationWrapper";
import SearchInput from "@/components/SearchInput";
import SearchModeSelection from "@/components/SearchModeSelection";
import SearchWelcome from "@/components/SearchWelcome";
import SearchResults from "@/components/SearchResults";
import { SearchResult, type SearchMode } from "@/lib/schemas";
import { getRandomSuggestions } from "@/data/search-suggestions";
import { getRandomSentenceSuggestions } from "@/data/sentence-suggestions";

/** Maximum number of search results to return */
const SEARCH_LIMIT = 20;

// Spiritual greetings for the search page
const SEARCH_GREETINGS = [
  "What calls to your seeking?",
  "The sessions await your inquiry.",
  "Search the infinite.",
  "What wisdom do you seek?",
  "Seek and you shall find.",
  "What mystery draws you?",
  "The material holds many truths.",
];

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read URL params once on mount
  const initialUrlQuery = useRef(searchParams.get("q") || "");
  const initialUrlMode = useRef(searchParams.get("mode") as SearchMode | null);

  const [mode, setMode] = useState<SearchMode | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [searchedQuery, setSearchedQuery] = useState(""); // The query used for current results/highlights
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [greeting, setGreeting] = useState<string | null>(null);
  const didInitialLoad = useRef(false);

  // Randomize greeting on client to avoid hydration mismatch
  useEffect(() => {
    setGreeting(SEARCH_GREETINGS[Math.floor(Math.random() * SEARCH_GREETINGS.length)]);
  }, []);

  // Update suggestions when mode changes
  useEffect(() => {
    if (mode === "sentence") {
      setSuggestions(getRandomSentenceSuggestions(6));
    } else if (mode === "passage") {
      setSuggestions(getRandomSuggestions(6));
    }
  }, [mode]);

  // Perform the actual search API call
  const performSearch = useCallback(async (searchQuery: string, searchMode: SearchMode) => {
    const trimmed = searchQuery.trim();
    if (!trimmed || trimmed.length < 2) return;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    setSearchedQuery(trimmed); // Lock in the query for highlights

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, limit: SEARCH_LIMIT, mode: searchMode }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Too many requests. Please wait a moment and try again.");
        }
        throw new Error("Search failed. Please try again.");
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle search: update URL and perform search
  const handleSearch = useCallback((searchQuery: string) => {
    if (!mode) return;
    const trimmed = searchQuery.trim();
    if (!trimmed || trimmed.length < 2) return;

    // Update URL for bookmarking/sharing (write-only, we don't react to this)
    router.push(`/search?mode=${mode}&q=${encodeURIComponent(trimmed)}`);
    performSearch(trimmed, mode);
  }, [router, performSearch, mode]);

  // Initial load: read URL params once and perform search if needed
  useEffect(() => {
    if (didInitialLoad.current) return;
    didInitialLoad.current = true;

    const urlMode = initialUrlMode.current;
    const urlQuery = initialUrlQuery.current;

    // If we have a mode in URL, set it
    if (urlMode === "sentence" || urlMode === "passage") {
      setMode(urlMode);

      // If we also have a query, perform the search
      if (urlQuery && urlQuery.length >= 2) {
        setInputValue(urlQuery);
        performSearch(urlQuery, urlMode);
      }
    }
  }, [performSearch]);

  // Handle browser back/forward navigation
  // popstate only fires on actual browser navigation, not on router.push
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const urlQuery = params.get("q") || "";
      const urlMode = params.get("mode") as SearchMode | null;

      if (urlMode === "sentence" || urlMode === "passage") {
        setMode(urlMode);
        if (urlQuery && urlQuery.length >= 2) {
          setInputValue(urlQuery);
          performSearch(urlQuery, urlMode);
        } else {
          // Mode but no query - show search welcome
          setInputValue("");
          setResults([]);
          setHasSearched(false);
          setSearchedQuery("");
        }
      } else {
        // No mode - back to mode selection
        setMode(null);
        setInputValue("");
        setResults([]);
        setHasSearched(false);
        setSearchedQuery("");
        setError(null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [performSearch]);

  const handleAskAbout = (result: SearchResult) => {
    // Get display text - prefer sentence if available, fall back to passage text
    const displayText = result.sentence || result.text || "";
    const prompt = `Tell me more about this passage from ${result.reference}: "${displayText.slice(0, 200)}${displayText.length > 200 ? "..." : ""}"`;
    router.push(`/chat?q=${encodeURIComponent(prompt)}`);
  };

  const handleSuggestedSearch = (suggestion: string) => {
    setInputValue(suggestion);
    handleSearch(suggestion);
  };

  const handleNewSearch = useCallback(() => {
    // Reset all state and update URL
    setMode(null);
    setInputValue("");
    setSearchedQuery("");
    setResults([]);
    setHasSearched(false);
    setError(null);
    router.push("/search");
  }, [router]);

  // Handle mode selection from welcome screen
  const handleModeSelect = useCallback((selectedMode: SearchMode) => {
    setMode(selectedMode);
    router.push(`/search?mode=${selectedMode}`);
  }, [router]);

  // Handle mode change (when toggling during search)
  const handleModeChange = useCallback((newMode: SearchMode) => {
    setMode(newMode);

    if (hasSearched && inputValue.trim().length >= 2) {
      // Re-search with new mode
      router.push(`/search?mode=${newMode}&q=${encodeURIComponent(inputValue.trim())}`);
      performSearch(inputValue.trim(), newMode);
    } else {
      router.push(`/search?mode=${newMode}`);
    }
  }, [hasSearched, inputValue, router, performSearch]);

  // Three UI states:
  // 1. No mode selected - show mode selection
  // 2. Mode selected but no search - show search welcome with toggle
  // 3. Has searched - show results with toggle
  const showModeSelection = mode === null && !hasSearched && !isLoading;
  const showSearchWelcome = mode !== null && !hasSearched && !isLoading;

  // Create the animated input element with layoutId for position animation
  const inputElement = (
    <motion.div
      layoutId="search-input"
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <SearchInput
        value={inputValue}
        onChange={setInputValue}
        onSearch={() => handleSearch(inputValue)}
        isLoading={isLoading}
        compact={!showSearchWelcome}
      />
    </motion.div>
  );

  return (
    <LayoutGroup>
      <main className="h-dvh flex flex-col cosmic-bg relative">
        {/* Starfield background - fades out when showing results */}
        <AnimatePresence>
          {(showModeSelection || showSearchWelcome) && (
            <motion.div
              className="starfield"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            />
          )}
        </AnimatePresence>
        {/* Keep starfield visible but static during results */}
        {!showModeSelection && !showSearchWelcome && (
          <div className="starfield opacity-30" />
        )}

        <NavigationWrapper showNewSearch={hasSearched || mode !== null} onNewSearch={handleNewSearch}>
          <div className="flex-1 overflow-hidden relative z-10 flex flex-col min-h-0">
            <AnimatePresence mode="wait">
              {/* Mode Selection State */}
              {showModeSelection && (
                <motion.div
                  key="mode-selection"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 flex flex-col"
                >
                  <SearchModeSelection onSelectMode={handleModeSelect} />
                </motion.div>
              )}

              {/* Search Welcome State */}
              {showSearchWelcome && (
                <motion.div
                  key="search-welcome"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 flex flex-col"
                >
                  <SearchWelcome
                    mode={mode!}
                    greeting={greeting}
                    suggestions={suggestions}
                    onModeChange={handleModeChange}
                    onSuggestedSearch={handleSuggestedSearch}
                    inputElement={inputElement}
                  />
                </motion.div>
              )}

              {/* Results State */}
              {!showModeSelection && !showSearchWelcome && (
                <motion.div
                  key="search-results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="flex-1 flex flex-col min-h-0"
                >
                  <SearchResults
                    mode={mode!}
                    results={results}
                    searchedQuery={searchedQuery}
                    isLoading={isLoading}
                    error={error}
                    hasSearched={hasSearched}
                    onModeChange={handleModeChange}
                    onAskAbout={handleAskAbout}
                    inputElement={inputElement}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </NavigationWrapper>
      </main>
    </LayoutGroup>
  );
}
