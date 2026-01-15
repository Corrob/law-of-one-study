import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock next/navigation for useSearchParams
let mockUrlQuery = "";
let mockUrlMode: string | null = null;

jest.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => {
      if (key === "q") return mockUrlQuery;
      if (key === "mode") return mockUrlMode;
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
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ results: [], mode: "passage" }),
    });
  });

  describe("mode selection", () => {
    it("shows mode selection cards on initial load", () => {
      render(<SearchPage />);

      // Translation keys are returned by mock
      expect(screen.getByText("search.sentenceSearch")).toBeInTheDocument();
      expect(screen.getByText("search.passageSearch")).toBeInTheDocument();
      expect(screen.getByText("search.sentenceDescription")).toBeInTheDocument();
      expect(screen.getByText("search.passageDescription")).toBeInTheDocument();
    });

    it("does not show search input until mode is selected", () => {
      render(<SearchPage />);

      expect(screen.queryByRole("textbox", { name: "Search query" })).not.toBeInTheDocument();
    });

    it("shows search input after selecting passage mode", async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      await user.click(screen.getByText("search.passageSearch"));

      // Wait for animation transition
      await waitFor(() => {
        expect(screen.getByRole("textbox", { name: "Search query" })).toBeInTheDocument();
      });
    });

    it("shows search input after selecting sentence mode", async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      await user.click(screen.getByText("search.sentenceSearch"));

      // Wait for animation transition
      await waitFor(() => {
        expect(screen.getByRole("textbox", { name: "Search query" })).toBeInTheDocument();
      });
    });

    it("updates URL when mode is selected", async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      await user.click(screen.getByText("search.sentenceSearch"));

      expect(mockPush).toHaveBeenCalledWith("/search?mode=sentence");
    });

    it("shows sentence suggestions after selecting sentence mode", async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      await user.click(screen.getByText("search.sentenceSearch"));

      // Wait for animation transition - suggestions are translation keys
      // The mock returns keys like "searchSuggestions.sentence.1"
      await waitFor(() => {
        const buttons = screen.getAllByRole("button");
        const suggestionButtons = buttons.filter(
          (btn) => btn.textContent?.startsWith("searchSuggestions.sentence.")
        );
        expect(suggestionButtons.length).toBeGreaterThan(0);
      });
    });

    it("shows passage suggestions after selecting passage mode", async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      await user.click(screen.getByText("search.passageSearch"));

      // Wait for animation transition - suggestions are translation keys
      // The mock returns keys like "searchSuggestions.passage.1"
      await waitFor(() => {
        const buttons = screen.getAllByRole("button");
        const suggestionButtons = buttons.filter(
          (btn) => btn.textContent?.startsWith("searchSuggestions.passage.")
        );
        expect(suggestionButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe("search with mode", () => {
    it("triggers search with sentence mode", async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      // Select sentence mode
      await user.click(screen.getByText("search.sentenceSearch"));

      // Wait for animation transition
      const input = await screen.findByRole("textbox", { name: "Search query" });
      await user.type(input, "love{Enter}");

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/search",
          expect.objectContaining({
            body: JSON.stringify({ query: "love", limit: 20, mode: "sentence", language: "en" }),
          })
        );
      });
    });

    it("triggers search with passage mode", async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      // Select passage mode
      await user.click(screen.getByText("search.passageSearch"));

      // Wait for animation transition
      const input = await screen.findByRole("textbox", { name: "Search query" });
      await user.type(input, "love{Enter}");

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/search",
          expect.objectContaining({
            body: JSON.stringify({ query: "love", limit: 20, mode: "passage", language: "en" }),
          })
        );
      });
    });

    it("includes mode in URL when search is performed", async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      await user.click(screen.getByText("search.passageSearch"));
      mockPush.mockClear();

      // Wait for animation transition
      const input = await screen.findByRole("textbox", { name: "Search query" });
      await user.type(input, "love{Enter}");

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/search?mode=passage&q=love");
      });
    });
  });

  describe("mode toggle", () => {
    it("shows mode toggle after selecting a mode", async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      await user.click(screen.getByText("search.passageSearch"));

      // Wait for animation transition and toggle buttons
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "search.modeToggle.sentence" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "search.modeToggle.passage" })).toBeInTheDocument();
      });
    });

    it("re-searches when mode is toggled with existing query", async () => {
      const user = userEvent.setup();

      // Return results for this test so we can verify the results state
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          results: [{ reference: "Ra 1.1", text: "Love is everything" }],
          mode: "passage",
        }),
      });

      render(<SearchPage />);

      // Select passage mode and search
      await user.click(screen.getByText("search.passageSearch"));
      const input = await screen.findByRole("textbox", { name: "Search query" });
      await user.type(input, "love{Enter}");

      // Wait for search to complete and results to render
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // Wait for search results state to settle (results are shown)
      // Translation key with param interpolation: search.matchCount
      await waitFor(() => {
        expect(screen.getByText(/search\.matchCount/)).toBeInTheDocument();
      });

      mockFetch.mockClear();

      // Toggle to sentence mode - use findByRole to ensure toggle is ready
      const sentenceButton = await screen.findByRole("button", { name: "search.modeToggle.sentence" });
      await user.click(sentenceButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/search",
          expect.objectContaining({
            body: JSON.stringify({ query: "love", limit: 20, mode: "sentence", language: "en" }),
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
            body: JSON.stringify({ query: "initial query", limit: 20, mode: "sentence", language: "en" }),
          })
        );
      });
    });

    it("shows search input when URL has mode param", async () => {
      mockUrlMode = "passage";

      await act(async () => {
        render(<SearchPage />);
      });

      // Wait for animation transition
      await waitFor(() => {
        expect(screen.getByRole("textbox", { name: "Search query" })).toBeInTheDocument();
      });
    });
  });

  describe("search triggering - core behavior", () => {
    it("does NOT trigger search when typing (the bug fix)", async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      await user.click(screen.getByText("search.passageSearch"));

      // Wait for animation transition
      const input = await screen.findByRole("textbox", { name: "Search query" });
      await user.type(input, "love");

      // This is the key test for the bug fix:
      // Typing should NOT trigger a fetch - only Enter or button click should
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("triggers search when Search button is clicked", async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      await user.click(screen.getByText("search.passageSearch"));

      // Wait for animation transition
      const input = await screen.findByRole("textbox", { name: "Search query" });
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

      await user.click(screen.getByText("search.passageSearch"));

      // Wait for animation transition
      const input = await screen.findByRole("textbox", { name: "Search query" });
      await user.type(input, "a{Enter}");

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("suggestions", () => {
    it("performs search when suggestion is clicked", async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      await user.click(screen.getByText("search.passageSearch"));

      // Wait for suggestions to appear
      await waitFor(() => {
        const buttons = screen.getAllByRole("button");
        const suggestionButtons = buttons.filter(
          (btn) => btn.textContent?.startsWith("searchSuggestions.passage.")
        );
        expect(suggestionButtons.length).toBeGreaterThan(0);
      });

      // Find any suggestion button and click it
      const buttons = screen.getAllByRole("button");
      const suggestionButton = buttons.find(
        (btn) => btn.textContent?.startsWith("searchSuggestions.passage.")
      );
      const suggestionText = suggestionButton!.textContent;
      await user.click(suggestionButton!);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/search",
          expect.objectContaining({
            body: JSON.stringify({ query: suggestionText, limit: 20, mode: "passage", language: "en" }),
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

      await user.click(screen.getByText("search.passageSearch"));

      // Wait for animation transition
      const input = await screen.findByRole("textbox", { name: "Search query" });
      await user.type(input, "love{Enter}");

      await waitFor(() => {
        // Translation key is returned by mock
        expect(screen.getByText("search.searching")).toBeInTheDocument();
      });

      // Clean up by resolving the promise
      await act(async () => {
        resolvePromise!({ ok: true, json: () => Promise.resolve({ results: [], mode: "passage" }) });
      });
    });
  });
});
