import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CitationLink from "../CitationLink";
import { CitationModalProvider } from "@/contexts/CitationModalContext";

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<object>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren<object>) => <>{children}</>,
}));

// Store mock language for dynamic changes in tests
let mockLanguage = "en";

// Mock next-intl with translation function
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      questioner: "Questioner",
      ra: "Ra",
      loading: "Loading...",
      loadError: "Failed to load quote",
      quoteNotFound: "Quote not found",
      showEnglishOriginal: "Show English original",
      hideEnglishOriginal: "Hide English original",
    };
    return translations[key] || key;
  },
}));

// Mock useLanguage with dynamic language
jest.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: mockLanguage, setLanguage: jest.fn() }),
}));

// Store mock for dynamic test manipulation
const mockFetchBilingualQuote = jest.fn();

// Mock quote-utils
jest.mock("@/lib/quote-utils", () => ({
  fetchBilingualQuote: (...args: unknown[]) => mockFetchBilingualQuote(...args),
  formatWholeQuote: jest.fn((text) => text),
  getRaMaterialUrl: (session: number, question: number, locale: string) =>
    `https://www.llresearch.org${locale === 'en' ? '' : '/' + locale}/channeling/ra-contact/${session}#${question}`,
}));

// Helper to render with provider
function renderWithProvider(ui: React.ReactElement) {
  return render(<CitationModalProvider>{ui}</CitationModalProvider>);
}

describe("CitationLink", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLanguage = "en";
    mockFetchBilingualQuote.mockResolvedValue({
      text: "Questioner: Test question?\n\nRa: I am Ra. Test answer.",
      originalText: undefined,
    });
  });

  describe("rendering", () => {
    it("should render the display text", () => {
      renderWithProvider(<CitationLink session={50} question={7} displayText="(Ra 50.7)" />);

      expect(screen.getByText("(Ra 50.7)")).toBeInTheDocument();
    });

    it("should render as a button element", () => {
      renderWithProvider(<CitationLink session={50} question={7} displayText="(Ra 50.7)" />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("should have citation-link class", () => {
      renderWithProvider(<CitationLink session={50} question={7} displayText="(Ra 50.7)" />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("citation-link");
    });

    it("should have descriptive title attribute", () => {
      renderWithProvider(<CitationLink session={50} question={7} displayText="(Ra 50.7)" />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", "View Ra 50.7");
    });
  });

  describe("modal interaction", () => {
    it("should open modal when clicked", () => {
      renderWithProvider(<CitationLink session={50} question={7} displayText="(Ra 50.7)" />);

      const button = screen.getByRole("button", { name: "(Ra 50.7)" });
      fireEvent.click(button);

      // Modal should be visible with the reference as a link
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "50.7" })).toBeInTheDocument();
    });

    it("should close modal when X button is clicked", () => {
      renderWithProvider(<CitationLink session={50} question={7} displayText="(Ra 50.7)" />);

      // Open modal
      const button = screen.getByRole("button", { name: "(Ra 50.7)" });
      fireEvent.click(button);

      expect(screen.getByRole("dialog")).toBeInTheDocument();

      // Close modal
      const closeButton = screen.getByLabelText("Close");
      fireEvent.click(closeButton);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should have link to llresearch.org in modal", () => {
      renderWithProvider(<CitationLink session={50} question={7} displayText="(Ra 50.7)" />);

      // Open modal
      const button = screen.getByRole("button", { name: "(Ra 50.7)" });
      fireEvent.click(button);

      // Reference link goes to llresearch.org
      const externalLink = screen.getByRole("link", { name: "50.7" });
      expect(externalLink).toHaveAttribute("href", "https://www.llresearch.org/channeling/ra-contact/50#7");
      expect(externalLink).toHaveAttribute("target", "_blank");
      expect(externalLink).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  describe("different references", () => {
    it("should handle single-digit session and question", () => {
      renderWithProvider(<CitationLink session={1} question={1} displayText="(Ra 1.1)" />);

      const button = screen.getByRole("button", { name: "(Ra 1.1)" });
      fireEvent.click(button);

      const externalLink = screen.getByRole("link", { name: "1.1" });
      expect(externalLink).toHaveAttribute("href", "https://www.llresearch.org/channeling/ra-contact/1#1");
    });

    it("should handle three-digit session", () => {
      renderWithProvider(<CitationLink session={106} question={23} displayText="(Ra 106.23)" />);

      const button = screen.getByRole("button", { name: "(Ra 106.23)" });
      fireEvent.click(button);

      const externalLink = screen.getByRole("link", { name: "106.23" });
      expect(externalLink).toHaveAttribute("href", "https://www.llresearch.org/channeling/ra-contact/106#23");
    });
  });

  describe("locale-aware URLs", () => {
    it("should use Spanish URL when language is Spanish", () => {
      mockLanguage = "es";
      mockFetchBilingualQuote.mockResolvedValue({
        text: "Interrogador: ¿Pregunta de prueba?\n\nRa: Soy Ra. Respuesta de prueba.",
        originalText: "Questioner: Test question?\n\nRa: I am Ra. Test answer.",
      });

      renderWithProvider(<CitationLink session={50} question={7} displayText="(Ra 50.7)" />);

      const button = screen.getByRole("button", { name: "(Ra 50.7)" });
      fireEvent.click(button);

      const externalLink = screen.getByRole("link", { name: "50.7" });
      expect(externalLink).toHaveAttribute("href", "https://www.llresearch.org/es/channeling/ra-contact/50#7");
    });
  });

  describe("bilingual support", () => {
    it("should show English original toggle when Spanish with original text", async () => {
      mockLanguage = "es";
      mockFetchBilingualQuote.mockResolvedValue({
        text: "Interrogador: ¿Pregunta?\n\nRa: Soy Ra. Respuesta.",
        originalText: "Questioner: Question?\n\nRa: I am Ra. Answer.",
      });

      renderWithProvider(<CitationLink session={50} question={7} displayText="(Ra 50.7)" />);

      const button = screen.getByRole("button", { name: "(Ra 50.7)" });
      fireEvent.click(button);

      // Wait for quote to load and toggle to appear (includes arrow prefix)
      await waitFor(() => {
        expect(screen.getByText(/Show English original/)).toBeInTheDocument();
      });
    });

    it("should not show English original toggle for English language", async () => {
      mockLanguage = "en";
      mockFetchBilingualQuote.mockResolvedValue({
        text: "Questioner: Question?\n\nRa: I am Ra. Answer.",
        originalText: undefined,
      });

      renderWithProvider(<CitationLink session={50} question={7} displayText="(Ra 50.7)" />);

      const button = screen.getByRole("button", { name: "(Ra 50.7)" });
      fireEvent.click(button);

      // Wait for quote to load
      await waitFor(() => {
        expect(screen.getByText(/I am Ra/)).toBeInTheDocument();
      });

      // Toggle should not appear
      expect(screen.queryByText(/Show English original/)).not.toBeInTheDocument();
    });

    it("should toggle English original visibility", async () => {
      mockLanguage = "es";
      mockFetchBilingualQuote.mockResolvedValue({
        text: "Ra: Soy Ra. Respuesta en español.",
        originalText: "Ra: I am Ra. Answer in English.",
      });

      renderWithProvider(<CitationLink session={50} question={7} displayText="(Ra 50.7)" />);

      const button = screen.getByRole("button", { name: "(Ra 50.7)" });
      fireEvent.click(button);

      // Wait for toggle to appear
      await waitFor(() => {
        expect(screen.getByText(/Show English original/)).toBeInTheDocument();
      });

      // Click to show English original
      fireEvent.click(screen.getByText(/Show English original/));

      // Should show hide button
      await waitFor(() => {
        expect(screen.getByText(/Hide English original/)).toBeInTheDocument();
      });
    });
  });

  describe("error handling", () => {
    it("should show error when quote not found", async () => {
      mockFetchBilingualQuote.mockResolvedValue(null);

      renderWithProvider(<CitationLink session={999} question={999} displayText="(Ra 999.999)" />);

      const button = screen.getByRole("button", { name: "(Ra 999.999)" });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText("Quote not found")).toBeInTheDocument();
      });
    });

    it("should show error when fetch fails", async () => {
      mockFetchBilingualQuote.mockRejectedValue(new Error("Network error"));

      renderWithProvider(<CitationLink session={50} question={7} displayText="(Ra 50.7)" />);

      const button = screen.getByRole("button", { name: "(Ra 50.7)" });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText("Failed to load quote")).toBeInTheDocument();
      });
    });
  });
});
