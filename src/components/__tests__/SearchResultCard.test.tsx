import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchResultCard from "../SearchResultCard";

// Mock quote-utils to return text as-is for testing
jest.mock("@/lib/quote-utils", () => ({
  formatWholeQuote: (text: string) => text,
  formatQuoteWithAttribution: (text: string, reference: string, url: string) =>
    `"${text}"\n— ${reference}\n\n${url}`,
  fetchBilingualQuote: jest.fn(),
  // Include the real splitIntoSentences for bilingual tests
  splitIntoSentences: (text: string) => {
    const normalized = text.replace(/\.(?=[A-Z])/g, ". ");
    return normalized.split(/(?<=[.!?])\s+/).filter(s => s.trim());
  },
}));

// Mock SWR hooks for quote fetching
let mockQuoteData: { text: string; originalText?: string } | null = null;
let mockIsLoading = false;
jest.mock("@/hooks/useBilingualQuote", () => ({
  useQuoteData: () => ({
    data: mockQuoteData,
    isLoading: mockIsLoading,
    error: null,
  }),
}));

// Mock language - will be overridden in specific tests
let mockLanguage = "en";
jest.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: mockLanguage, setLanguage: jest.fn() }),
}));

const mockResult = {
  text: "Questioner: What is the Law of One? Ra: I am Ra. The Law of One states that all things are one.",
  reference: "Ra 1.7",
  session: 1,
  question: 7,
  url: "https://llresearch.org/s/1#7",
};

describe("SearchResultCard", () => {
  const mockOnAskAbout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockLanguage = "en"; // Reset to English
    mockQuoteData = null;
    mockIsLoading = false;
  });

  it("renders the result reference", () => {
    render(
      <SearchResultCard result={mockResult} query="law" onAskAbout={mockOnAskAbout} />
    );

    expect(screen.getByText("1.7")).toBeInTheDocument();
  });

  it("renders Questioner and Ra labels", () => {
    render(
      <SearchResultCard result={mockResult} query="law" onAskAbout={mockOnAskAbout} />
    );

    // Translation keys are returned by mock
    expect(screen.getByText("quote.questioner")).toBeInTheDocument();
    expect(screen.getByText("quote.ra")).toBeInTheDocument();
  });

  it("renders action buttons", () => {
    render(
      <SearchResultCard result={mockResult} query="law" onAskAbout={mockOnAskAbout} />
    );

    // Translation keys are returned by mock
    expect(screen.getByText("search.readFullPassage")).toBeInTheDocument();
    expect(screen.getByText("search.askAboutThis")).toBeInTheDocument();
  });

  it("calls onAskAbout when Ask button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <SearchResultCard result={mockResult} query="law" onAskAbout={mockOnAskAbout} />
    );

    await user.click(screen.getByText("search.askAboutThis"));

    expect(mockOnAskAbout).toHaveBeenCalledTimes(1);
  });

  it("links to llresearch.org", () => {
    render(
      <SearchResultCard result={mockResult} query="law" onAskAbout={mockOnAskAbout} />
    );

    const links = screen.getAllByRole("link");
    const lawOfOneLinks = links.filter(link =>
      link.getAttribute("href")?.includes("llresearch.org")
    );

    expect(lawOfOneLinks.length).toBeGreaterThan(0);
  });

  it("highlights search terms in text", () => {
    render(
      <SearchResultCard result={mockResult} query="law" onAskAbout={mockOnAskAbout} />
    );

    // Should have highlighted "Law" (the whole word)
    const marks = document.querySelectorAll("mark");
    expect(marks.length).toBeGreaterThan(0);
  });

  it("highlights entire words with prefix match", () => {
    const resultWithLawful = {
      ...mockResult,
      text: "Ra: This is lawful behavior according to the Law.",
    };

    render(
      <SearchResultCard result={resultWithLawful} query="law" onAskAbout={mockOnAskAbout} />
    );

    // Both "lawful" and "Law" should be highlighted
    const marks = document.querySelectorAll("mark");
    const highlightedTexts = Array.from(marks).map(m => m.textContent?.toLowerCase());

    expect(highlightedTexts).toContain("lawful");
    expect(highlightedTexts).toContain("law");
  });

  it("does not highlight mid-word matches", () => {
    const resultWithFlaw = {
      ...mockResult,
      text: "Ra: This is a flaw in understanding.",
    };

    render(
      <SearchResultCard result={resultWithFlaw} query="law" onAskAbout={mockOnAskAbout} />
    );

    // "flaw" should NOT be highlighted
    const marks = document.querySelectorAll("mark");
    const highlightedTexts = Array.from(marks).map(m => m.textContent?.toLowerCase());

    expect(highlightedTexts).not.toContain("flaw");
  });

  describe("bilingual sentence matching", () => {
    const sentenceResult = {
      reference: "Ra 10.14",
      session: 10,
      question: 14,
      url: "https://llresearch.org/s/10#14",
      sentence: "See the Creator.",
      sentenceIndex: 2,
      speaker: "ra" as const,
      score: 0.95,
    };

    it("displays Spanish translation when language is Spanish", () => {
      mockLanguage = "es";
      mockQuoteData = {
        text: "Ra: Soy Ra. Ve al Creador. Mira la creación que te rodea.",
        originalText: "Ra: I am Ra. See the Creator. Gaze at the creation around you.",
      };

      render(
        <SearchResultCard result={sentenceResult} query="creator" onAskAbout={mockOnAskAbout} />
      );

      // Should display Spanish translation
      expect(screen.getByText("Ve al Creador.")).toBeInTheDocument();
    });

    it("filters out 'I am Ra' / 'Soy Ra' greeting sentences", () => {
      mockLanguage = "es";
      mockQuoteData = {
        text: "Ra: Soy Ra. La creación entera es del Único Creador.",
        originalText: "Ra: I am Ra. The entire creation is of the One Creator.",
      };

      const resultWithGreeting = {
        ...sentenceResult,
        sentence: "The entire creation is of the One Creator.",
        sentenceIndex: 1,
      };

      render(
        <SearchResultCard result={resultWithGreeting} query="creator" onAskAbout={mockOnAskAbout} />
      );

      // Should show the content sentence, not "Soy Ra"
      expect(screen.getByText("La creación entera es del Único Creador.")).toBeInTheDocument();

      // "Soy Ra" should not appear as the matched sentence
      expect(screen.queryByText("Ra: Soy Ra.")).not.toBeInTheDocument();
    });

    it("uses position-based matching for multi-sentence passages", () => {
      mockLanguage = "es";
      mockQuoteData = {
        text: "Ra: Soy Ra. Primera oración. Segunda oración. Tercera oración.",
        originalText: "Ra: I am Ra. First sentence. Second sentence. Third sentence.",
      };

      const resultWithThirdSentence = {
        ...sentenceResult,
        sentence: "Third sentence.",
        sentenceIndex: 3,
      };

      render(
        <SearchResultCard result={resultWithThirdSentence} query="sentence" onAskAbout={mockOnAskAbout} />
      );

      // Should find "Third sentence" at position 2/3 in English (after filtering "I am Ra")
      // and map to position 2/3 in Spanish = "Tercera oración"
      expect(screen.getByText("Tercera oración.")).toBeInTheDocument();
    });

    it("handles punctuation differences in matching", () => {
      mockLanguage = "es";
      mockQuoteData = {
        text: "Ra: Soy Ra. El amor es la luz, la luz es el amor.",
        originalText: "Ra: I am Ra. Love is light; light is love.",
      };

      const resultWithPunctuation = {
        ...sentenceResult,
        sentence: "Love is light; light is love.",
        sentenceIndex: 1,
      };

      render(
        <SearchResultCard result={resultWithPunctuation} query="love" onAskAbout={mockOnAskAbout} />
      );

      // Should match despite punctuation differences
      expect(screen.getByText("El amor es la luz, la luz es el amor.")).toBeInTheDocument();
    });

    it("falls back to first content sentence when match not found", () => {
      mockLanguage = "es";
      mockQuoteData = {
        text: "Ra: Soy Ra. Esta es la primera oración de contenido.",
        originalText: "Ra: I am Ra. Completely different text here.",
      };

      const resultWithNoMatch = {
        ...sentenceResult,
        sentence: "This text does not exist in the original.",
        sentenceIndex: 5,
      };

      render(
        <SearchResultCard result={resultWithNoMatch} query="text" onAskAbout={mockOnAskAbout} />
      );

      // Should fall back to first content sentence (not "Soy Ra")
      expect(screen.getByText("Esta es la primera oración de contenido.")).toBeInTheDocument();
    });
  });
});
