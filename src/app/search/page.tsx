"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import NavigationWrapper from "@/components/NavigationWrapper";
import SearchResultCard from "@/components/SearchResultCard";
import SearchInput from "@/components/SearchInput";
import { SearchResult } from "@/lib/schemas";
import { getRandomSuggestions } from "@/data/search-suggestions";

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
  const urlQuery = searchParams.get("q") || "";

  const [inputValue, setInputValue] = useState(urlQuery);
  const [searchedQuery, setSearchedQuery] = useState(""); // The query used for current results/highlights
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [greeting, setGreeting] = useState<string | null>(null);
  const initialSearchDone = useRef(false);
  const lastPushedQuery = useRef<string | null>(null);

  // Randomize greeting and suggestions on client to avoid hydration mismatch
  useEffect(() => {
    setGreeting(SEARCH_GREETINGS[Math.floor(Math.random() * SEARCH_GREETINGS.length)]);
    setSuggestions(getRandomSuggestions(6));
  }, []);

  // Perform the actual search API call
  const performSearch = useCallback(async (searchQuery: string) => {
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
        body: JSON.stringify({ query: trimmed, limit: SEARCH_LIMIT }),
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
    const trimmed = searchQuery.trim();
    if (!trimmed || trimmed.length < 2) return;

    // Track that we're pushing this query (not a browser navigation)
    lastPushedQuery.current = trimmed;
    // Update URL with search query
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    performSearch(trimmed);
  }, [router, performSearch]);

  // Auto-search when URL has a query param (on initial load or back navigation)
  useEffect(() => {
    if (urlQuery && !initialSearchDone.current) {
      // Initial page load with query param
      initialSearchDone.current = true;
      setInputValue(urlQuery);
      performSearch(urlQuery);
    } else if (urlQuery && urlQuery !== lastPushedQuery.current) {
      // Browser back/forward navigation - URL changed but not from our push
      lastPushedQuery.current = urlQuery;
      setInputValue(urlQuery);
      performSearch(urlQuery);
    } else if (!urlQuery && hasSearched) {
      // Navigated back to /search without query - reset state
      lastPushedQuery.current = null;
      setHasSearched(false);
      setResults([]);
      setInputValue("");
      setSearchedQuery("");
    }
  }, [urlQuery, performSearch, hasSearched]);

  const handleAskAbout = (result: SearchResult) => {
    const prompt = `Tell me more about this passage from ${result.reference}: "${result.text.slice(0, 200)}${result.text.length > 200 ? "..." : ""}"`;
    router.push(`/chat?q=${encodeURIComponent(prompt)}`);
  };

  const handleSuggestedSearch = (suggestion: string) => {
    setInputValue(suggestion);
    handleSearch(suggestion);
  };

  const handleNewSearch = useCallback(() => {
    setInputValue("");
    setSearchedQuery("");
    setResults([]);
    setHasSearched(false);
    setError(null);
    initialSearchDone.current = false;
    lastPushedQuery.current = null;
    router.push("/search");
  }, [router]);

  // Show welcome state (centered) or results state (top-aligned)
  const showWelcome = !hasSearched && !isLoading;

  return (
    <main className="h-dvh flex flex-col cosmic-bg relative">
      {/* Starfield background */}
      <div className="starfield" />

      <NavigationWrapper showNewSearch={hasSearched} onNewSearch={handleNewSearch}>
        <div className="flex-1 overflow-hidden relative z-10 flex flex-col">
          {/* Welcome State - Centered */}
          {showWelcome && (
            <div className="flex-1 flex flex-col items-center justify-center px-4 pb-16">
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

              {/* Semantic search explanation */}
              <p className="text-[var(--lo1-stardust)]/70 text-sm text-center mb-8 max-w-md">
                Search by meaning, not just words—describe what you seek.
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
          {!showWelcome && (
            <>
              {/* Sticky Search Header */}
              <div className="px-4 pt-4 pb-3 bg-[var(--lo1-deep-space)]/50 backdrop-blur-sm">
                <div className="max-w-2xl mx-auto">
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
