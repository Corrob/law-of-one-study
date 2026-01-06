import { render, screen, fireEvent } from "@testing-library/react";
import WelcomeScreen from "../WelcomeScreen";

// Mock the data module
jest.mock("@/data/starters", () => ({
  getRandomQuote: jest.fn(() => ({
    text: "We are all one.",
    reference: "Ra 1.1",
    url: "https://lawofone.info/s/1#1",
  })),
  getRandomStarters: jest.fn(() => [
    "What is the Law of One?",
    "Tell me about densities",
    "What is love/light?",
  ]),
}));

// Mock ThemeToggle
jest.mock("../ThemeToggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme Toggle</div>,
}));

describe("WelcomeScreen", () => {
  const mockOnSelectStarter = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render the welcome screen", () => {
      render(<WelcomeScreen onSelectStarter={mockOnSelectStarter} />);

      expect(screen.getByText(/We are all one/)).toBeInTheDocument();
    });

    it("should render the quote", () => {
      render(<WelcomeScreen onSelectStarter={mockOnSelectStarter} />);

      expect(screen.getByText(/We are all one/)).toBeInTheDocument();
      expect(screen.getByText(/Ra 1.1/)).toBeInTheDocument();
    });

    it("should render quote as a link", () => {
      render(<WelcomeScreen onSelectStarter={mockOnSelectStarter} />);

      // Find the quote link (external link starting with https://)
      const links = screen.getAllByRole("link");
      const quoteLink = links.find(
        (link) => link.getAttribute("href")?.startsWith("https://lawofone")
      );
      expect(quoteLink).toHaveAttribute("href", "https://lawofone.info/s/1#1");
      expect(quoteLink).toHaveAttribute("target", "_blank");
      expect(quoteLink).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("should render conversation starters", () => {
      render(<WelcomeScreen onSelectStarter={mockOnSelectStarter} />);

      expect(screen.getByText("What is the Law of One?")).toBeInTheDocument();
      expect(screen.getByText("Tell me about densities")).toBeInTheDocument();
      expect(screen.getByText("What is love/light?")).toBeInTheDocument();
    });

    it("should render 'Or explore:' label", () => {
      render(<WelcomeScreen onSelectStarter={mockOnSelectStarter} />);

      expect(screen.getByText("Or explore:")).toBeInTheDocument();
    });

    it("should render the disclaimer", () => {
      render(<WelcomeScreen onSelectStarter={mockOnSelectStarter} />);

      expect(
        screen.getByText(/This AI companion provides helpful explanations/)
      ).toBeInTheDocument();
    });

    it("should render disclaimer link to support page", () => {
      render(<WelcomeScreen onSelectStarter={mockOnSelectStarter} />);

      const learnMoreLink = screen.getByText("Learn more");
      expect(learnMoreLink).toHaveAttribute("href", "/support");
    });

    it("should render theme toggle", () => {
      render(<WelcomeScreen onSelectStarter={mockOnSelectStarter} />);

      expect(screen.getByTestId("theme-toggle")).toBeInTheDocument();
    });
  });

  describe("input element slot", () => {
    it("should render inputElement when provided", () => {
      render(
        <WelcomeScreen
          onSelectStarter={mockOnSelectStarter}
          inputElement={<input data-testid="custom-input" />}
        />
      );

      expect(screen.getByTestId("custom-input")).toBeInTheDocument();
    });

    it("should not render input wrapper when no inputElement", () => {
      render(<WelcomeScreen onSelectStarter={mockOnSelectStarter} />);

      // The wrapper with welcome-input-glow should not exist
      expect(document.querySelector(".welcome-input-glow")).not.toBeInTheDocument();
    });
  });

  describe("starter button interactions", () => {
    it("should call onSelectStarter when starter is clicked", () => {
      render(<WelcomeScreen onSelectStarter={mockOnSelectStarter} />);

      fireEvent.click(screen.getByText("What is the Law of One?"));

      expect(mockOnSelectStarter).toHaveBeenCalledWith("What is the Law of One?");
    });

    it("should call onSelectStarter with correct text for each starter", () => {
      render(<WelcomeScreen onSelectStarter={mockOnSelectStarter} />);

      fireEvent.click(screen.getByText("Tell me about densities"));
      expect(mockOnSelectStarter).toHaveBeenCalledWith("Tell me about densities");

      mockOnSelectStarter.mockClear();

      fireEvent.click(screen.getByText("What is love/light?"));
      expect(mockOnSelectStarter).toHaveBeenCalledWith("What is love/light?");
    });

    it("should render starters as buttons", () => {
      render(<WelcomeScreen onSelectStarter={mockOnSelectStarter} />);

      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("accessibility", () => {
    it("should have accessible links", () => {
      render(<WelcomeScreen onSelectStarter={mockOnSelectStarter} />);

      const links = screen.getAllByRole("link");
      expect(links.length).toBeGreaterThanOrEqual(2); // Quote link + Learn more link
    });

    it("should have accessible buttons for starters", () => {
      render(<WelcomeScreen onSelectStarter={mockOnSelectStarter} />);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toBeEnabled();
      });
    });
  });

  describe("styling", () => {
    it("should have proper classes on quote card", () => {
      render(<WelcomeScreen onSelectStarter={mockOnSelectStarter} />);

      // Get the external quote link (starts with https://)
      const links = screen.getAllByRole("link");
      const quoteLink = links.find(
        (link) => link.getAttribute("href")?.startsWith("https://")
      );
      expect(quoteLink?.className).toContain("light-quote-card");
    });

    it("should have proper classes on starter buttons", () => {
      render(<WelcomeScreen onSelectStarter={mockOnSelectStarter} />);

      const button = screen.getByText("What is the Law of One?");
      expect(button.className).toContain("starter-card");
    });
  });
});
