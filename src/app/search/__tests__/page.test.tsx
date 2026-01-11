import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock next/navigation
const mockPush = jest.fn();
let mockUrlQuery = "";
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({
    get: (key: string) => (key === "q" ? mockUrlQuery : null),
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

import SearchPage from "../page";

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("SearchPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUrlQuery = "";
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ results: [] }),
    });
  });

  describe("initial state", () => {
    it("renders search input", () => {
      render(<SearchPage />);

      expect(screen.getByRole("textbox", { name: "Search query" })).toBeInTheDocument();
    });

    it("shows suggestions on initial load", () => {
      render(<SearchPage />);

      expect(screen.getByText("suggestion 1")).toBeInTheDocument();
      expect(screen.getByText("suggestion 2")).toBeInTheDocument();
    });

    it("does not show Search button when input is empty", () => {
      render(<SearchPage />);

      expect(screen.queryByRole("button", { name: "Search" })).not.toBeInTheDocument();
    });
  });

  describe("search triggering - core behavior", () => {
    it("does NOT trigger search when typing (the bug fix)", async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      const input = screen.getByRole("textbox", { name: "Search query" });
      await user.type(input, "love");

      // This is the key test for the bug fix:
      // Typing should NOT trigger a fetch - only Enter or button click should
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("triggers search when Enter is pressed", async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      const input = screen.getByRole("textbox", { name: "Search query" });
      await user.type(input, "love{Enter}");

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/search", expect.any(Object));
      });
    });

    it("triggers search when Search button is clicked", async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      const input = screen.getByRole("textbox", { name: "Search query" });
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

      const input = screen.getByRole("textbox", { name: "Search query" });
      await user.type(input, "a{Enter}");

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("updates URL when search is performed", async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      const input = screen.getByRole("textbox", { name: "Search query" });
      await user.type(input, "love{Enter}");

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/search?q=love");
      });
    });
  });

  describe("URL-based search", () => {
    it("performs search on initial load when URL has query param", async () => {
      mockUrlQuery = "initial query";

      await act(async () => {
        render(<SearchPage />);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/search",
          expect.objectContaining({
            body: JSON.stringify({ query: "initial query", limit: 20 }),
          })
        );
      });
    });

    it("populates input with URL query param", async () => {
      mockUrlQuery = "initial query";

      await act(async () => {
        render(<SearchPage />);
      });

      expect(screen.getByDisplayValue("initial query")).toBeInTheDocument();
    });
  });

  describe("editing after search - core behavior", () => {
    it("does NOT trigger additional search when typing after initial search (the bug fix)", async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      // Perform initial search
      const input = screen.getByRole("textbox", { name: "Search query" });
      await user.type(input, "love{Enter}");

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // Clear the mock to track new calls
      mockFetch.mockClear();

      // Type more characters (without pressing Enter)
      await user.type(input, " and light");

      // This is the key test for the bug fix:
      // Typing more characters should NOT trigger a new search
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("suggestions", () => {
    it("performs search when suggestion is clicked", async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      await user.click(screen.getByText("suggestion 1"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/search",
          expect.objectContaining({
            body: JSON.stringify({ query: "suggestion 1", limit: 20 }),
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
        expect(screen.getByText("Searching the cosmic records...")).toBeInTheDocument();
      });

      // Clean up by resolving the promise
      await act(async () => {
        resolvePromise!({ ok: true, json: () => Promise.resolve({ results: [] }) });
      });
    });
  });
});
