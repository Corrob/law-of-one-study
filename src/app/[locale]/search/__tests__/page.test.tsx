import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock next/navigation for useSearchParams
let mockUrlQuery = "";
let mockUrlMode: string | null = null;
let mockUrlConfederation: string | null = null;

jest.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => {
      if (key === "q") return mockUrlQuery;
      if (key === "mode") return mockUrlMode;
      if (key === "confederation") return mockUrlConfederation;
      return null;
    },
  }),
}));

// Mock @/i18n/navigation for useRouter
const mockPush = jest.fn();
jest.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/search",
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock NavigationWrapper to simplify testing
jest.mock("@/components/NavigationWrapper", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Note: Search suggestions are now handled via next-intl translations
// The global mock in jest.setup.js returns the translation key as text

import SearchPage from "../page";

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("SearchPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUrlQuery = "";
    mockUrlMode = null;
    mockUrlConfederation = null;
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ results: [], mode: "sentence" }),
    });
  });

  describe("initial state", () => {
    it("shows search input immediately on load (defaults to sentence mode)", () => {
      render(<SearchPage />);

      expect(screen.getByRole("textbox", { name: "Search query" })).toBeInTheDocument();
    });

    it("shows sentence suggestions by default", async () => {
      render(<SearchPage />);

      await waitFor(() => {
        const buttons = screen.getAllByRole("button");
        const suggestionButtons = buttons.filter(
          (btn) => btn.textContent?.startsWith("searchSuggestions.sentence.")
        );
        expect(suggestionButtons.length).toBeGreaterThan(0);
      });
    });

    it("shows mode toggle with sentence active by default", () => {
      render(<SearchPage />);

      expect(screen.getByRole("button", { name: "search.modeToggle.sentence" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "search.modeToggle.passage" })).toBeInTheDocument();
    });
  });

  describe("search with mode", () => {
    it("triggers search with default sentence mode and ra source", async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      const input = screen.getByRole("textbox", { name: "Search query" });
      await user.type(input, "love{Enter}");

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/search",
          expect.objectContaining({
            body: JSON.stringify({ query: "love", limit: 20, mode: "sentence", source: "ra", language: "en" }),
          })
        );
      });
    });

    it("triggers search with passage mode after toggling", async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      // Toggle to passage mode
      const passageButton = screen.getByRole("button", { name: "search.modeToggle.passage" });
      await user.click(passageButton);

      const input = screen.getByRole("textbox", { name: "Search query" });
      await user.type(input, "love{Enter}");

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/search",
          expect.objectContaining({
            body: JSON.stringify({ query: "love", limit: 20, mode: "passage", source: "ra", language: "en" }),
          })
        );
      });
    });

    it("includes mode in URL when search is performed (no confederation by default)", async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      const input = screen.getByRole("textbox", { name: "Search query" });
      await user.type(input, "love{Enter}");

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/search?mode=sentence&q=love");
      });
    });
  });

  describe("mode toggle", () => {
    it("re-searches when mode is toggled with existing query", async () => {
      const user = userEvent.setup();

      // Return results for this test so we can verify the results state
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          results: [{ reference: "Ra 1.1", text: "Love is everything" }],
          mode: "sentence",
        }),
      });

      render(<SearchPage />);

      // Search in default sentence mode
      const input = screen.getByRole("textbox", { name: "Search query" });
      await user.type(input, "love{Enter}");

      // Wait for search to complete and results to render
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // Wait for search results state to settle
      await waitFor(() => {
        expect(screen.getByText(/search\.matchCount/)).toBeInTheDocument();
      });

      mockFetch.mockClear();

      // Toggle to passage mode
      const passageButton = await screen.findByRole("button", { name: "search.modeToggle.passage" });
      await user.click(passageButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/search",
          expect.objectContaining({
            body: JSON.stringify({ query: "love", limit: 20, mode: "passage", source: "ra", language: "en" }),
          })
        );
      });
    });
  });

  describe("URL-based search with mode", () => {
    it("performs search on initial load when URL has query and mode params", async () => {
      mockUrlQuery = "initial query";
      mockUrlMode = "sentence";

      await act(async () => {
        render(<SearchPage />);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/search",
          expect.objectContaining({
            body: JSON.stringify({ query: "initial query", limit: 20, mode: "sentence", source: "ra", language: "en" }),
          })
        );
      });
    });

    it("performs search with passage mode from URL", async () => {
      mockUrlQuery = "initial query";
      mockUrlMode = "passage";

      await act(async () => {
        render(<SearchPage />);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/search",
          expect.objectContaining({
            body: JSON.stringify({ query: "initial query", limit: 20, mode: "passage", source: "ra", language: "en" }),
          })
        );
      });
    });

    it("defaults to sentence mode when URL has query but no mode", async () => {
      mockUrlQuery = "initial query";
      mockUrlMode = null;

      await act(async () => {
        render(<SearchPage />);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/search",
          expect.objectContaining({
            body: JSON.stringify({ query: "initial query", limit: 20, mode: "sentence", source: "ra", language: "en" }),
          })
        );
      });
    });

    it("performs search with confederation=1 from URL", async () => {
      mockUrlQuery = "initial query";
      mockUrlMode = "sentence";
      mockUrlConfederation = "1";

      await act(async () => {
        render(<SearchPage />);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/search",
          expect.objectContaining({
            body: JSON.stringify({ query: "initial query", limit: 20, mode: "sentence", source: "all", language: "en" }),
          })
        );
      });
    });

    it("shows search input when URL has mode param", async () => {
      mockUrlMode = "passage";

      await act(async () => {
        render(<SearchPage />);
      });

      await waitFor(() => {
        expect(screen.getByRole("textbox", { name: "Search query" })).toBeInTheDocument();
      });
    });
  });

  describe("search triggering - core behavior", () => {
    it("does NOT trigger search when typing (the bug fix)", async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      const input = screen.getByRole("textbox", { name: "Search query" });
      await user.type(input, "love");

      // Typing should NOT trigger a fetch - only Enter or button click should
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("triggers search when Search button is clicked", async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      const input = screen.getByRole("textbox", { name: "Search query" });
      await user.type(input, "love");

      const searchButton = screen.getByRole("button", { name: "search.searchButton" });
      await user.click(searchButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/search", expect.any(Object));
      });
    });

    it("does not trigger search for queries shorter than 2 characters", async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      const input = screen.getByRole("textbox", { name: "Search query" });
      await user.type(input, "a{Enter}");

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("suggestions", () => {
    it("performs search when suggestion is clicked", async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      // Wait for suggestions to appear (default sentence mode)
      await waitFor(() => {
        const buttons = screen.getAllByRole("button");
        const suggestionButtons = buttons.filter(
          (btn) => btn.textContent?.startsWith("searchSuggestions.sentence.")
        );
        expect(suggestionButtons.length).toBeGreaterThan(0);
      });

      // Find any suggestion button and click it
      const buttons = screen.getAllByRole("button");
      const suggestionButton = buttons.find(
        (btn) => btn.textContent?.startsWith("searchSuggestions.sentence.")
      );
      const suggestionText = suggestionButton!.textContent;
      await user.click(suggestionButton!);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/search",
          expect.objectContaining({
            body: JSON.stringify({ query: suggestionText, limit: 20, mode: "sentence", source: "ra", language: "en" }),
          })
        );
      });
    });
  });

  describe("loading state", () => {
    it("shows loading indicator during search", async () => {
      const user = userEvent.setup();
      // Make fetch hang to see loading state
      let resolvePromise: (value: unknown) => void;
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          })
      );

      render(<SearchPage />);

      const input = screen.getByRole("textbox", { name: "Search query" });
      await user.type(input, "love{Enter}");

      await waitFor(() => {
        // Translation key is returned by mock
        expect(screen.getByText("search.searching")).toBeInTheDocument();
      });

      // Clean up by resolving the promise
      await act(async () => {
        resolvePromise!({ ok: true, json: () => Promise.resolve({ results: [], mode: "sentence" }) });
      });
    });
  });
});
