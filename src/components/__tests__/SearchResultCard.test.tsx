import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchResultCard from "../SearchResultCard";

// Mock quote-utils to return text as-is for testing
jest.mock("@/lib/quote-utils", () => ({
  formatWholeQuote: (text: string) => text,
  formatQuoteWithAttribution: (text: string, reference: string, url: string) =>
    `"${text}"\n— ${reference}\n\n${url}`,
  // Mock fetchBilingualQuote to return null (no translation available)
  fetchBilingualQuote: jest.fn().mockResolvedValue(null),
}));

// Mock useLanguage to return English by default
jest.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "en", setLanguage: jest.fn() }),
}));

const mockResult = {
  text: "Questioner: What is the Law of One? Ra: I am Ra. The Law of One states that all things are one.",
  reference: "Ra 1.7",
  session: 1,
  question: 7,
  url: "https://lawofone.info/s/1#7",
};

describe("SearchResultCard", () => {
  const mockOnAskAbout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
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

  it("links to lawofone.info", () => {
    render(
      <SearchResultCard result={mockResult} query="law" onAskAbout={mockOnAskAbout} />
    );

    const links = screen.getAllByRole("link");
    const lawOfOneLinks = links.filter(link =>
      link.getAttribute("href")?.includes("lawofone.info")
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
});
