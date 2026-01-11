import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock next/navigation
let mockUrlQuery = "";
let mockUrlMode: string | null = null;
const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({
    get: (key: string) => {
      if (key === "q") return mockUrlQuery;
      if (key === "mode") return mockUrlMode;
      return null;
    },
  }),
}));

// Mock NavigationWrapper to simplify testing
jest.mock("@/components/NavigationWrapper", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock search suggestions
jest.mock("@/data/search-suggestions", () => ({
  getRandomSuggestions: () => ["suggestion 1", "suggestion 2"],
}));

jest.mock("@/data/sentence-suggestions", () => ({
  getRandomSentenceSuggestions: () => ["You are infinity", "all things are one"],
}));

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

      expect(screen.getByText("Sentence Search")).toBeInTheDocument();
      expect(screen.getByText("Passage Search")).toBeInTheDocument();
      expect(screen.getByText("Find a specific quote by meaning")).toBeInTheDocument();
      expect(screen.getByText("Discover quotes by concept")).toBeInTheDocument();
    });

    it("does not show search input until mode is selected", () => {
      render(<SearchPage />);

      expect(screen.queryByRole("textbox", { name: "Search query" })).not.toBeInTheDocument();
    });

    it("shows search input after selecting passage mode", async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      await user.click(screen.getByText("Passage Search"));

      // Wait for animation transition
      await waitFor(() => {
        expect(screen.getByRole("textbox", { name: "Search query" })).toBeInTheDocument();
      });
    });

    it("shows search input after selecting sentence mode", async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      await user.click(screen.getByText("Sentence Search"));

      // Wait for animation transition
      await waitFor(() => {
        expect(screen.getByRole("textbox", { name: "Search query" })).toBeInTheDocument();
      });
    });

    it("updates URL when mode is selected", async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      await user.click(screen.getByText("Sentence Search"));

      expect(mockPush).toHaveBeenCalledWith("/search?mode=sentence");
    });

    it("shows sentence suggestions after selecting sentence mode", async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      await user.click(screen.getByText("Sentence Search"));

      // Wait for animation transition
      await waitFor(() => {
        expect(screen.getByText("You are infinity")).toBeInTheDocument();
      });
    });

    it("shows passage suggestions after selecting passage mode", async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      await user.click(screen.getByText("Passage Search"));

      // Wait for animation transition
      await waitFor(() => {
        expect(screen.getByText("suggestion 1")).toBeInTheDocument();
      });
    });
  });

  describe("search with mode", () => {
    it("triggers search with sentence mode", async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      // Select sentence mode
      await user.click(screen.getByText("Sentence Search"));

      // Wait for animation transition
      const input = await screen.findByRole("textbox", { name: "Search query" });
      await user.type(input, "love{Enter}");

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/search",
          expect.objectContaining({
            body: JSON.stringify({ query: "love", limit: 20, mode: "sentence" }),
          })
        );
      });
    });

    it("triggers search with passage mode", async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      // Select passage mode
      await user.click(screen.getByText("Passage Search"));

      // Wait for animation transition
      const input = await screen.findByRole("textbox", { name: "Search query" });
      await user.type(input, "love{Enter}");

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/search",
          expect.objectContaining({
            body: JSON.stringify({ query: "love", limit: 20, mode: "passage" }),
          })
        );
      });
    });

    it("includes mode in URL when search is performed", async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      await user.click(screen.getByText("Passage Search"));
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

      await user.click(screen.getByText("Passage Search"));

      // Wait for animation transition and toggle buttons
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Sentence" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Passage" })).toBeInTheDocument();
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
      await user.click(screen.getByText("Passage Search"));
      const input = await screen.findByRole("textbox", { name: "Search query" });
      await user.type(input, "love{Enter}");

      // Wait for search to complete and results to render
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // Wait for search results state to settle (results are shown)
      await waitFor(() => {
        expect(screen.getByText(/Closest .* matches by meaning/)).toBeInTheDocument();
      });

      mockFetch.mockClear();

      // Toggle to sentence mode - use findByRole to ensure toggle is ready
      const sentenceButton = await screen.findByRole("button", { name: "Sentence" });
      await user.click(sentenceButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/search",
          expect.objectContaining({
            body: JSON.stringify({ query: "love", limit: 20, mode: "sentence" }),
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
            body: JSON.stringify({ query: "initial query", limit: 20, mode: "sentence" }),
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

      await user.click(screen.getByText("Passage Search"));

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

      await user.click(screen.getByText("Passage Search"));

      // Wait for animation transition
      const input = await screen.findByRole("textbox", { name: "Search query" });
      await user.type(input, "love");

      const searchButton = screen.getByRole("button", { name: "Search" });
      await user.click(searchButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/search", expect.any(Object));
      });
    });

    it("does not trigger search for queries shorter than 2 characters", async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      await user.click(screen.getByText("Passage Search"));

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

      await user.click(screen.getByText("Passage Search"));

      // Wait for animation transition
      const suggestion = await screen.findByText("suggestion 1");
      await user.click(suggestion);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/search",
          expect.objectContaining({
            body: JSON.stringify({ query: "suggestion 1", limit: 20, mode: "passage" }),
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

      await user.click(screen.getByText("Passage Search"));

      // Wait for animation transition
      const input = await screen.findByRole("textbox", { name: "Search query" });
      await user.type(input, "love{Enter}");

      await waitFor(() => {
        expect(screen.getByText("Searching the cosmic records...")).toBeInTheDocument();
      });

      // Clean up by resolving the promise
      await act(async () => {
        resolvePromise!({ ok: true, json: () => Promise.resolve({ results: [], mode: "passage" }) });
      });
    });
  });
});
