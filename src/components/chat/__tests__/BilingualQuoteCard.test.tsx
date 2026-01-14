import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BilingualQuoteCard from "../BilingualQuoteCard";

// Mock the language context
jest.mock("@/contexts/LanguageContext", () => ({
  useLanguage: jest.fn(() => ({ language: "es", setLanguage: jest.fn() })),
}));

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      questioner: "Interrogador",
      ra: "Ra",
      collapse: "Colapsar",
      expand: "Mostrar más",
      loading: "Cargando...",
      showEnglishOriginal: "Mostrar original en inglés",
      hideEnglishOriginal: "Ocultar original en inglés",
      englishOriginal: "Original en Inglés",
      translationUnavailable: "Traducción no disponible",
    };
    return translations[key] || key;
  },
}));

// Mock quote-utils
const mockFetchBilingualQuote = jest.fn();
jest.mock("@/lib/quote-utils", () => ({
  fetchBilingualQuote: (...args: unknown[]) => mockFetchBilingualQuote(...args),
  formatWholeQuote: (text: string) => text,
  formatQuoteWithAttribution: (text: string, ref: string) => `${text}\n\n- ${ref}`,
}));

// Mock analytics
jest.mock("@/lib/analytics", () => ({
  analytics: {
    quoteDisplayed: jest.fn(),
    quoteLinkClicked: jest.fn(),
    quoteCopied: jest.fn(),
  },
}));

const mockQuote = {
  text: "Ra: I am Ra. This is a test quote.",
  reference: "1.7",
  url: "https://lawofone.info/s/1#7",
};

describe("BilingualQuoteCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders quote with Spanish translation when available", async () => {
    mockFetchBilingualQuote.mockResolvedValue({
      text: "Ra: Soy Ra. Esta es una cita de prueba.",
      originalText: "Ra: I am Ra. This is a test quote.",
    });

    render(<BilingualQuoteCard quote={mockQuote} targetLanguage="es" />);

    // Initially shows the original quote text
    expect(screen.getByText(/I am Ra/)).toBeInTheDocument();

    // Wait for translation to load
    await waitFor(() => {
      expect(screen.getByText(/Soy Ra/)).toBeInTheDocument();
    });

    // Should not show fallback indicator
    expect(screen.queryByText(/no disponible/i)).not.toBeInTheDocument();
  });

  it("shows fallback indicator when translation unavailable", async () => {
    // Return English text without originalText (indicating fallback)
    mockFetchBilingualQuote.mockResolvedValue({
      text: "Ra: I am Ra. This is a test quote.",
      // No originalText means we're showing English as fallback
    });

    render(<BilingualQuoteCard quote={mockQuote} targetLanguage="es" />);

    // Wait for the fallback indicator
    await waitFor(() => {
      expect(screen.getByText(/Traducción no disponible/)).toBeInTheDocument();
    });
  });

  it("renders reference link correctly", () => {
    mockFetchBilingualQuote.mockResolvedValue({
      text: "Ra: Soy Ra. Esta es una cita de prueba.",
      originalText: "Ra: I am Ra. This is a test quote.",
    });

    render(<BilingualQuoteCard quote={mockQuote} targetLanguage="es" />);

    const link = screen.getByRole("link", { name: "1.7" });
    expect(link).toHaveAttribute("href", "https://lawofone.info/s/1#7");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("shows Spanish UI label for questioner", () => {
    mockFetchBilingualQuote.mockResolvedValue({
      text: "Ra: Soy Ra.",
      originalText: "Ra: I am Ra.",
    });

    render(<BilingualQuoteCard quote={mockQuote} targetLanguage="es" />);

    expect(screen.getByText("Interrogador")).toBeInTheDocument();
  });

  it("shows expand button for partial quotes", async () => {
    const partialQuote = {
      ...mockQuote,
      text: "...Ra: I am Ra. This is a partial quote...",
    };

    mockFetchBilingualQuote.mockResolvedValue({
      text: "Ra: Soy Ra. Esta es una cita parcial.",
      originalText: "Ra: I am Ra. This is a partial quote.",
    });

    render(<BilingualQuoteCard quote={partialQuote} targetLanguage="es" />);

    // Should show ellipsis buttons
    const ellipsisButtons = screen.getAllByText("...");
    expect(ellipsisButtons.length).toBeGreaterThan(0);
  });

  it("expands to show full quote with English original toggle", async () => {
    const user = userEvent.setup();
    const partialQuote = {
      ...mockQuote,
      text: "...Ra: I am Ra...",
    };

    mockFetchBilingualQuote.mockResolvedValue({
      text: "Interrogador: Pregunta completa. Ra: Soy Ra. Respuesta completa.",
      originalText: "Questioner: Full question. Ra: I am Ra. Full answer.",
    });

    render(<BilingualQuoteCard quote={partialQuote} targetLanguage="es" />);

    // Wait for initial translation
    await waitFor(() => {
      expect(mockFetchBilingualQuote).toHaveBeenCalled();
    });

    // Click expand button
    const expandButtons = screen.getAllByText("...");
    await user.click(expandButtons[0]);

    // Wait for expanded content
    await waitFor(() => {
      expect(screen.getByText(/Mostrar original en inglés/)).toBeInTheDocument();
    });
  });

  it("toggles English original visibility", async () => {
    const user = userEvent.setup();
    const partialQuote = {
      ...mockQuote,
      text: "...Ra: I am Ra...",
    };

    mockFetchBilingualQuote.mockResolvedValue({
      text: "Interrogador: Pregunta. Ra: Soy Ra. Respuesta.",
      originalText: "Questioner: Question. Ra: I am Ra. Answer.",
    });

    render(<BilingualQuoteCard quote={partialQuote} targetLanguage="es" />);

    // Expand the quote first
    await waitFor(() => {
      expect(mockFetchBilingualQuote).toHaveBeenCalled();
    });

    const expandButtons = screen.getAllByText("...");
    await user.click(expandButtons[0]);

    // Click "Show English original"
    await waitFor(() => {
      expect(screen.getByText(/Mostrar original en inglés/)).toBeInTheDocument();
    });

    const showOriginalButton = screen.getByText(/Mostrar original en inglés/);
    await user.click(showOriginalButton);

    // Should now show English original section
    await waitFor(() => {
      expect(screen.getByText("Original en Inglés")).toBeInTheDocument();
    });

    // Should show hide button
    expect(screen.getByText(/Ocultar original en inglés/)).toBeInTheDocument();
  });

  it("does not show English original toggle when using fallback", async () => {
    const user = userEvent.setup();
    const partialQuote = {
      ...mockQuote,
      text: "...Ra: I am Ra...",
    };

    // Simulate fallback - no originalText
    mockFetchBilingualQuote.mockResolvedValue({
      text: "Questioner: Question. Ra: I am Ra. Answer.",
    });

    render(<BilingualQuoteCard quote={partialQuote} targetLanguage="es" />);

    // Expand the quote
    await waitFor(() => {
      expect(mockFetchBilingualQuote).toHaveBeenCalled();
    });

    const expandButtons = screen.getAllByText("...");
    await user.click(expandButtons[0]);

    // Wait a bit for any potential render
    await waitFor(() => {
      expect(screen.getByText(/Traducción no disponible/)).toBeInTheDocument();
    });

    // Should NOT show "Show English original" since we're already showing English
    expect(screen.queryByText(/Mostrar original en inglés/)).not.toBeInTheDocument();
  });

  it("renders with data-testid for testing", () => {
    mockFetchBilingualQuote.mockResolvedValue({
      text: "Ra: Soy Ra.",
      originalText: "Ra: I am Ra.",
    });

    render(<BilingualQuoteCard quote={mockQuote} targetLanguage="es" />);

    expect(screen.getByTestId("bilingual-quote-card")).toBeInTheDocument();
  });
});
