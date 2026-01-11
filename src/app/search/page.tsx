"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import NavigationWrapper from "@/components/NavigationWrapper";
import SearchResultCard from "@/components/SearchResultCard";
import SearchInput from "@/components/SearchInput";
import ModeToggle from "@/components/ModeToggle";
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

  return (
    <main className="h-dvh flex flex-col cosmic-bg relative">
      {/* Starfield background */}
      <div className="starfield" />

      <NavigationWrapper showNewSearch={hasSearched || mode !== null} onNewSearch={handleNewSearch}>
        <div className="flex-1 overflow-hidden relative z-10 flex flex-col">
          {/* Mode Selection State */}
          {showModeSelection && (
            <div className="flex-1 flex flex-col items-center justify-center px-4 pb-16">
              <h2 className="font-[family-name:var(--font-cormorant)] text-2xl md:text-3xl text-[var(--lo1-starlight)] mb-8 text-center">
                How would you like to search?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
                {/* Sentence Search Card */}
                <button
                  onClick={() => handleModeSelect("sentence")}
                  className="flex flex-col items-center p-6 rounded-xl
                             bg-[var(--lo1-indigo)]/50 border border-[var(--lo1-celestial)]/20
                             hover:border-[var(--lo1-gold)]/40 hover:bg-[var(--lo1-indigo)]/70
                             transition-all duration-300 cursor-pointer text-center group"
                >
                  <svg
                    className="w-8 h-8 text-[var(--lo1-gold)] mb-3 group-hover:scale-110 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                    />
                  </svg>
                  <h3 className="font-[family-name:var(--font-cormorant)] text-xl text-[var(--lo1-starlight)] mb-2">
                    Sentence Search
                  </h3>
                  <p className="text-sm text-[var(--lo1-stardust)]">
                    Find quotes you already know
                  </p>
                </button>

                {/* Passage Search Card */}
                <button
                  onClick={() => handleModeSelect("passage")}
                  className="flex flex-col items-center p-6 rounded-xl
                             bg-[var(--lo1-indigo)]/50 border border-[var(--lo1-celestial)]/20
                             hover:border-[var(--lo1-gold)]/40 hover:bg-[var(--lo1-indigo)]/70
                             transition-all duration-300 cursor-pointer text-center group"
                >
                  <svg
                    className="w-8 h-8 text-[var(--lo1-gold)] mb-3 group-hover:scale-110 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                  <h3 className="font-[family-name:var(--font-cormorant)] text-xl text-[var(--lo1-starlight)] mb-2">
                    Passage Search
                  </h3>
                  <p className="text-sm text-[var(--lo1-stardust)]">
                    Discover quotes by concept
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Search Welcome State - Mode selected, no search yet */}
          {showSearchWelcome && (
            <div className="flex-1 flex flex-col items-center justify-center px-4 pb-16">
              {/* Mode Toggle */}
              <div className="mb-6">
                <ModeToggle mode={mode} onChange={handleModeChange} />
              </div>

              {/* Greeting */}
              {greeting && (
                <h2 className="font-[family-name:var(--font-cormorant)] text-2xl md:text-3xl text-[var(--lo1-starlight)] mb-6 text-center">
                  {greeting}
                </h2>
              )}

              {/* Search Input */}
              <div className="w-full max-w-lg mb-6">
                <SearchInput
                  value={inputValue}
                  onChange={setInputValue}
                  onSearch={() => handleSearch(inputValue)}
                  isLoading={isLoading}
                />
              </div>

              {/* Mode-specific explanation */}
              <p className="text-[var(--lo1-stardust)]/70 text-sm text-center mb-8 max-w-md">
                {mode === "sentence"
                  ? "Search by partial quote or phrase you remember"
                  : "Search by meaning—describe what you seek"}
              </p>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="w-full max-w-2xl">
                  <p className="text-[var(--lo1-stardust)]/60 text-xs mb-3 text-center uppercase tracking-wider">
                    Try these
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => handleSuggestedSearch(suggestion)}
                        className="px-3 py-2 rounded-lg text-sm
                                   bg-[var(--lo1-indigo)]/60 border border-[var(--lo1-celestial)]/20
                                   text-[var(--lo1-stardust)] hover:text-[var(--lo1-starlight)]
                                   hover:border-[var(--lo1-gold)]/30 hover:bg-[var(--lo1-indigo)]/80
                                   transition-all duration-200 cursor-pointer"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Results State - Top-aligned with sticky search */}
          {!showModeSelection && !showSearchWelcome && (
            <>
              {/* Sticky Search Header */}
              <div className="px-4 pt-4 pb-3 bg-[var(--lo1-deep-space)]/50 backdrop-blur-sm">
                <div className="max-w-2xl mx-auto">
                  {/* Mode Toggle */}
                  <div className="flex justify-center mb-3">
                    <ModeToggle mode={mode!} onChange={handleModeChange} />
                  </div>
                  <SearchInput
                    value={inputValue}
                    onChange={setInputValue}
                    onSearch={() => handleSearch(inputValue)}
                    isLoading={isLoading}
                    compact
                  />
                </div>
              </div>

              {/* Results Area */}
              <div className="flex-1 overflow-y-auto px-4 pb-6">
                <div className="max-w-2xl mx-auto">
                  {/* Loading State */}
                  {isLoading && (
                    <div className="text-center py-12">
                      <div className="text-[var(--lo1-stardust)] italic animate-pulse">
                        Searching the cosmic records...
                      </div>
                    </div>
                  )}

                  {/* Error State */}
                  {error && !isLoading && (
                    <div className="text-center py-12">
                      <p className="text-[var(--lo1-error)]">{error}</p>
                    </div>
                  )}

                  {/* No Results */}
                  {hasSearched && !isLoading && !error && results.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-[var(--lo1-stardust)]">
                        No passages found. Try rephrasing your question or using different words.
                      </p>
                    </div>
                  )}

                  {/* Results */}
                  {results.length > 0 && !isLoading && (
                    <div className="space-y-5">
                      <p className="text-sm text-[var(--lo1-stardust)]/60 pt-2">
                        Closest {results.length} matches by meaning
                      </p>
                      {results.map((result, index) => (
                        <SearchResultCard
                          key={`${result.reference}-${index}`}
                          result={result}
                          query={searchedQuery}
                          onAskAbout={() => handleAskAbout(result)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </NavigationWrapper>
    </main>
  );
}
