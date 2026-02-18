import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import CitationLink from "../CitationLink";
import { CitationModalProvider, useCitationModal } from "@/contexts/CitationModalContext";

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

// Mock quote-utils
jest.mock("@/lib/quote-utils", () => ({
  formatWholeQuote: jest.fn((text) => text),
  getRaMaterialUrl: (session: number, question: number, locale: string) =>
    `https://www.llresearch.org${locale === 'en' ? '' : '/' + locale}/channeling/ra-contact/${session}#${question}`,
}));

// Mock SWR hooks for quote fetching
let mockQuoteData: { text: string; originalText?: string } | null = null;
let mockIsLoading = false;
let mockError: Error | null = null;

jest.mock("@/hooks/useBilingualQuote", () => ({
  useQuoteData: () => ({
    data: mockQuoteData,
    isLoading: mockIsLoading,
    error: mockError,
  }),
}));

// Helper to render with provider
function renderWithProvider(ui: React.ReactElement) {
  return render(<CitationModalProvider>{ui}</CitationModalProvider>);
}

describe("CitationLink", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLanguage = "en";
    mockQuoteData = {
      text: "Questioner: Test question?\n\nRa: I am Ra. Test answer.",
      originalText: undefined,
    };
    mockIsLoading = false;
    mockError = null;
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
      mockQuoteData = {
        text: "Interrogador: ¿Pregunta de prueba?\n\nRa: Soy Ra. Respuesta de prueba.",
        originalText: "Questioner: Test question?\n\nRa: I am Ra. Test answer.",
      };

      renderWithProvider(<CitationLink session={50} question={7} displayText="(Ra 50.7)" />);

      const button = screen.getByRole("button", { name: "(Ra 50.7)" });
      fireEvent.click(button);

      const externalLink = screen.getByRole("link", { name: "50.7" });
      expect(externalLink).toHaveAttribute("href", "https://www.llresearch.org/es/channeling/ra-contact/50#7");
    });
  });

  describe("bilingual support", () => {
    it("should show English original toggle when Spanish with original text", () => {
      mockLanguage = "es";
      mockQuoteData = {
        text: "Interrogador: ¿Pregunta?\n\nRa: Soy Ra. Respuesta.",
        originalText: "Questioner: Question?\n\nRa: I am Ra. Answer.",
      };

      renderWithProvider(<CitationLink session={50} question={7} displayText="(Ra 50.7)" />);

      const button = screen.getByRole("button", { name: "(Ra 50.7)" });
      fireEvent.click(button);

      // Toggle should appear (includes arrow prefix)
      expect(screen.getByText(/Show English original/)).toBeInTheDocument();
    });

    it("should not show English original toggle for English language", () => {
      mockLanguage = "en";
      mockQuoteData = {
        text: "Questioner: Question?\n\nRa: I am Ra. Answer.",
        originalText: undefined,
      };

      renderWithProvider(<CitationLink session={50} question={7} displayText="(Ra 50.7)" />);

      const button = screen.getByRole("button", { name: "(Ra 50.7)" });
      fireEvent.click(button);

      // Quote should be visible
      expect(screen.getByText(/I am Ra/)).toBeInTheDocument();

      // Toggle should not appear
      expect(screen.queryByText(/Show English original/)).not.toBeInTheDocument();
    });

    it("should toggle English original visibility", async () => {
      mockLanguage = "es";
      mockQuoteData = {
        text: "Ra: Soy Ra. Respuesta en español.",
        originalText: "Ra: I am Ra. Answer in English.",
      };

      renderWithProvider(<CitationLink session={50} question={7} displayText="(Ra 50.7)" />);

      const button = screen.getByRole("button", { name: "(Ra 50.7)" });
      fireEvent.click(button);

      // Toggle should appear
      expect(screen.getByText(/Show English original/)).toBeInTheDocument();

      // Click to show English original
      fireEvent.click(screen.getByText(/Show English original/));

      // Should show hide button
      await waitFor(() => {
        expect(screen.getByText(/Hide English original/)).toBeInTheDocument();
      });
    });
  });

  describe("error handling", () => {
    it("should show error when quote not found", () => {
      mockQuoteData = null;

      renderWithProvider(<CitationLink session={999} question={999} displayText="(Ra 999.999)" />);

      const button = screen.getByRole("button", { name: "(Ra 999.999)" });
      fireEvent.click(button);

      expect(screen.getByText("Quote not found")).toBeInTheDocument();
    });

    it("should show error when fetch fails", () => {
      mockError = new Error("Network error");

      renderWithProvider(<CitationLink session={50} question={7} displayText="(Ra 50.7)" />);

      const button = screen.getByRole("button", { name: "(Ra 50.7)" });
      fireEvent.click(button);

      expect(screen.getByText("Failed to load quote")).toBeInTheDocument();
    });
  });

  describe("confederation citations", () => {
    it("should render as a button element", () => {
      renderWithProvider(
        <CitationLink
          confederationRef="Q'uo, 2024-01-24"
          entity="Q'uo"
          url="https://www.llresearch.org/channeling/transcript/2024-01-24_quo"
          displayText="(Q'uo, 2024-01-24)"
        />
      );

      const button = screen.getByRole("button", { name: "(Q'uo, 2024-01-24)" });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass("citation-link");
    });

    it("should have descriptive title attribute", () => {
      renderWithProvider(
        <CitationLink
          confederationRef="Q'uo, 2024-01-24"
          entity="Q'uo"
          url="https://www.llresearch.org/channeling/transcript/2024-01-24_quo"
          displayText="(Q'uo, 2024-01-24)"
        />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", "View Q'uo transcript");
    });

    it("should open confederation modal when quotes are available in context", () => {
      // Helper component that injects quotes into the citation context
      function QuoteInjector() {
        const { setQuotes } = useCitationModal();
        useEffect(() => {
          setQuotes([{
            text: "I am Q'uo. We greet you in the love and light.",
            reference: "Q'uo, 2024-01-24",
            url: "https://www.llresearch.org/channeling/transcript/2024-01-24_quo",
          }]);
        }, [setQuotes]);
        return null;
      }

      render(
        <CitationModalProvider>
          <QuoteInjector />
          <CitationLink
            confederationRef="Q'uo, 2024-01-24"
            entity="Q'uo"
            url="https://www.llresearch.org/channeling/transcript/2024-01-24_quo"
            displayText="(Q'uo, 2024-01-24)"
          />
        </CitationModalProvider>
      );

      const button = screen.getByRole("button", { name: "(Q'uo, 2024-01-24)" });
      fireEvent.click(button);

      // Modal should open with the confederation passage
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText(/I am Q'uo/)).toBeInTheDocument();
    });

    it("should fall back to opening URL when quote not in context", () => {
      const mockOpen = jest.fn();
      jest.spyOn(window, "open").mockImplementation(mockOpen);

      renderWithProvider(
        <CitationLink
          confederationRef="Q'uo, 2024-01-24"
          entity="Q'uo"
          url="https://www.llresearch.org/channeling/transcript/2024-01-24_quo"
          displayText="(Q'uo, 2024-01-24)"
        />
      );

      const button = screen.getByRole("button", { name: "(Q'uo, 2024-01-24)" });
      fireEvent.click(button);

      // No modal, but URL opened in new tab
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(mockOpen).toHaveBeenCalledWith(
        "https://www.llresearch.org/channeling/transcript/2024-01-24_quo",
        "_blank",
        "noopener,noreferrer"
      );

      jest.restoreAllMocks();
    });
  });
});
