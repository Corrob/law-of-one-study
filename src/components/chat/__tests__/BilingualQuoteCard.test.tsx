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
jest.mock("@/lib/quote-utils", () => ({
  formatWholeQuote: (text: string) => text,
  formatQuoteWithAttribution: (text: string, ref: string) => `${text}\n\n- ${ref}`,
  getRaMaterialUrl: (session: number, question: number, locale: string) =>
    `https://www.llresearch.org${locale === 'en' ? '' : '/' + locale}/channeling/ra-contact/${session}#${question}`,
}));

// Mock the SWR hook
let mockBilingualData: { text: string; originalText?: string } | null = null;
let mockIsLoading = false;
jest.mock("@/hooks/useBilingualQuote", () => ({
  useBilingualQuote: () => ({
    data: mockBilingualData,
    isLoading: mockIsLoading,
    error: null,
  }),
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
  url: "https://www.llresearch.org/channeling/ra-contact/1#7",
};

describe("BilingualQuoteCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBilingualData = null;
    mockIsLoading = false;
  });

  it("renders quote with Spanish translation when available", () => {
    mockBilingualData = {
      text: "Ra: Soy Ra. Esta es una cita de prueba.",
      originalText: "Ra: I am Ra. This is a test quote.",
    };

    render(<BilingualQuoteCard quote={mockQuote} targetLanguage="es" />);

    // Shows translated text
    expect(screen.getByText(/Soy Ra/)).toBeInTheDocument();

    // Should not show fallback indicator
    expect(screen.queryByText(/no disponible/i)).not.toBeInTheDocument();
  });

  it("shows fallback indicator when translation unavailable", () => {
    // Return English text without originalText (indicating fallback)
    mockBilingualData = {
      text: "Ra: I am Ra. This is a test quote.",
      // No originalText means we're showing English as fallback
    };

    render(<BilingualQuoteCard quote={mockQuote} targetLanguage="es" />);

    // Should show the fallback indicator
    expect(screen.getByText(/Traducción no disponible/)).toBeInTheDocument();
  });

  it("renders reference link correctly with locale", () => {
    mockBilingualData = {
      text: "Ra: Soy Ra. Esta es una cita de prueba.",
      originalText: "Ra: I am Ra. This is a test quote.",
    };

    render(<BilingualQuoteCard quote={mockQuote} targetLanguage="es" />);

    const link = screen.getByRole("link", { name: "1.7" });
    // URL should include Spanish locale
    expect(link).toHaveAttribute("href", "https://www.llresearch.org/es/channeling/ra-contact/1#7");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("shows Spanish UI label for questioner", () => {
    mockBilingualData = {
      text: "Ra: Soy Ra.",
      originalText: "Ra: I am Ra.",
    };

    render(<BilingualQuoteCard quote={mockQuote} targetLanguage="es" />);

    expect(screen.getByText("Interrogador")).toBeInTheDocument();
  });

  it("shows expand button for partial quotes", () => {
    const partialQuote = {
      ...mockQuote,
      text: "...Ra: I am Ra. This is a partial quote...",
    };

    mockBilingualData = {
      text: "Ra: Soy Ra. Esta es una cita parcial.",
      originalText: "Ra: I am Ra. This is a partial quote.",
    };

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

    mockBilingualData = {
      text: "Interrogador: Pregunta completa. Ra: Soy Ra. Respuesta completa.",
      originalText: "Questioner: Full question. Ra: I am Ra. Full answer.",
    };

    render(<BilingualQuoteCard quote={partialQuote} targetLanguage="es" />);

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

    mockBilingualData = {
      text: "Interrogador: Pregunta. Ra: Soy Ra. Respuesta.",
      originalText: "Questioner: Question. Ra: I am Ra. Answer.",
    };

    render(<BilingualQuoteCard quote={partialQuote} targetLanguage="es" />);

    const expandButtons = screen.getAllByText("...");
    await user.click(expandButtons[0]);

    // Click "Show English original"
    await waitFor(() => {
      expect(screen.getByText(/Mostrar original en inglés/)).toBeInTheDocument();
    });

    const showOriginalButton = screen.getByText(/Mostrar original en inglés/);
    await user.click(showOriginalButton);

    // Should now show hide button (indicating English original is visible)
    await waitFor(() => {
      expect(screen.getByText(/Ocultar original en inglés/)).toBeInTheDocument();
    });
  });

  it("does not show English original toggle when using fallback", async () => {
    const user = userEvent.setup();
    const partialQuote = {
      ...mockQuote,
      text: "...Ra: I am Ra...",
    };

    // Simulate fallback - no originalText
    mockBilingualData = {
      text: "Questioner: Question. Ra: I am Ra. Answer.",
    };

    render(<BilingualQuoteCard quote={partialQuote} targetLanguage="es" />);

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
    mockBilingualData = {
      text: "Ra: Soy Ra.",
      originalText: "Ra: I am Ra.",
    };

    render(<BilingualQuoteCard quote={mockQuote} targetLanguage="es" />);

    expect(screen.getByTestId("bilingual-quote-card")).toBeInTheDocument();
  });
});
