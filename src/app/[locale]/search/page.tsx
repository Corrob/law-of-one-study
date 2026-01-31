"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { AvailableLanguage } from "@/lib/language-config";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import NavigationWrapper from "@/components/NavigationWrapper";
import SearchInput from "@/components/SearchInput";
import SearchWelcome from "@/components/SearchWelcome";
import SearchResults from "@/components/SearchResults";
import { SearchResult, type SearchMode } from "@/lib/schemas";

// Number of suggestions available per mode
const PASSAGE_SUGGESTION_COUNT = 52;
const SENTENCE_SUGGESTION_COUNT = 52;

/** Maximum number of search results to return */
const SEARCH_LIMIT = 20;

export default function SearchPage() {
  const locale = useLocale() as AvailableLanguage;
  const t = useTranslations("search");
  const tPassageSuggestions = useTranslations("searchSuggestions.passage");
  const tSentenceSuggestions = useTranslations("searchSuggestions.sentence");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read URL params once on mount
  const initialUrlQuery = useRef(searchParams.get("q") || "");
  const initialUrlMode = useRef(searchParams.get("mode") as SearchMode | null);

  const [mode, setMode] = useState<SearchMode | null>("sentence");
  const [inputValue, setInputValue] = useState("");
  const [searchedQuery, setSearchedQuery] = useState(""); // The query used for current results/highlights
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [suggestionKeys, setSuggestionKeys] = useState<number[]>([]);
  const [greeting, setGreeting] = useState<string | null>(null);
  const didInitialLoad = useRef(false);

  // Helper to generate random keys
  const getRandomKeys = useCallback((count: number, maxCount: number): number[] => {
    const keys = Array.from({ length: maxCount }, (_, i) => i + 1);
    const shuffled = keys.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }, []);

  // Randomize greeting on client to avoid hydration mismatch
  useEffect(() => {
    const greetingKeys = ["1", "2", "3", "4", "5", "6", "7"];
    const randomKey = greetingKeys[Math.floor(Math.random() * greetingKeys.length)];
    setGreeting(t(`greetings.${randomKey}`));
  }, [t]);

  // Update suggestions when mode changes
  useEffect(() => {
    if (mode === "sentence") {
      setSuggestionKeys(getRandomKeys(6, SENTENCE_SUGGESTION_COUNT));
    } else if (mode === "passage") {
      setSuggestionKeys(getRandomKeys(6, PASSAGE_SUGGESTION_COUNT));
    }
  }, [mode, getRandomKeys]);

  // Get translated suggestions from keys
  const suggestions = useMemo(() => {
    if (!mode) return [];
    const translator = mode === "sentence" ? tSentenceSuggestions : tPassageSuggestions;
    return suggestionKeys.map(key => translator(String(key)));
  }, [suggestionKeys, mode, tSentenceSuggestions, tPassageSuggestions]);

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
        body: JSON.stringify({ query: trimmed, limit: SEARCH_LIMIT, mode: searchMode, language: locale }),
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
  }, [locale]);

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

    // If we have a mode in URL, set it (otherwise keep default "sentence")
    if (urlMode === "sentence" || urlMode === "passage") {
      setMode(urlMode);
    }

    // If we have a query, perform the search
    if (urlQuery && urlQuery.length >= 2) {
      const searchMode = (urlMode === "sentence" || urlMode === "passage") ? urlMode : "sentence";
      setInputValue(urlQuery);
      performSearch(urlQuery, searchMode);
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
        // No mode in URL - default to sentence
        setMode("sentence");
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

  const handleAskAbout = (result: SearchResult, displayText: string) => {
    // Use the translated display text passed from SearchResultCard
    const text = displayText || result.sentence || result.text || "";
    const truncatedText = text.slice(0, 200) + (text.length > 200 ? "..." : "");
    const prompt = t("askAboutPrompt", { reference: result.reference, text: truncatedText });
    router.push(`/chat?q=${encodeURIComponent(prompt)}`);
  };

  const handleSuggestedSearch = (suggestion: string) => {
    setInputValue(suggestion);
    handleSearch(suggestion);
  };

  const handleNewSearch = useCallback(() => {
    // Reset all state and update URL
    setMode("sentence");
    setInputValue("");
    setSearchedQuery("");
    setResults([]);
    setHasSearched(false);
    setError(null);
    router.push("/search");
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

  // Two UI states:
  // 1. No search yet - show search welcome with toggle
  // 2. Has searched - show results with toggle
  const showSearchWelcome = !hasSearched && !isLoading;

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
          {showSearchWelcome && (
            <motion.div
              className="starfield"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            />
          )}
        </AnimatePresence>
        {/* Keep starfield visible but static during results */}
        {!showSearchWelcome && (
          <div className="starfield opacity-30" />
        )}

        <NavigationWrapper showNewSearch={hasSearched} onNewSearch={handleNewSearch}>
          <div className="flex-1 overflow-hidden relative z-10 flex flex-col min-h-0">
            <AnimatePresence mode="wait">
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
              {!showSearchWelcome && (
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
