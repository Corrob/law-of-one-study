import { render, screen, fireEvent } from "@testing-library/react";
import WelcomeScreen from "../WelcomeScreen";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "greetings.seeker": "Welcome, seeker.",
      "greetings.loveLight": "In love and light.",
      "greetings.journey": "The journey continues.",
      "greetings.serve": "How may I serve?",
      "greetings.wanderer": "Greetings, wanderer.",
      "orExplore": "Or explore:",
      "disclaimer": "This AI companion provides helpful explanations, but only the highlighted quote cards contain authentic passages from the Ra Material.",
      "learnMore": "Learn more",
    };
    return translations[key] || key;
  },
}));

// Mock the data module
jest.mock("@/data/starters", () => ({
  getRandomStarters: jest.fn(() => [
    "What is the Law of One?",
    "Tell me about densities",
    "What is love/light?",
  ]),
}));

describe("WelcomeScreen", () => {
  const mockOnSelectStarter = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render the welcome screen with a greeting", () => {
      render(<WelcomeScreen onSelectStarter={mockOnSelectStarter} />);

      // Should render one of the greetings
      const greetings = [
        "Welcome, seeker.",
        "In love and light.",
        "The journey continues.",
        "How may I serve?",
        "Greetings, wanderer.",
      ];
      const greeting = screen.getByRole("heading", { level: 1 });
      expect(greetings).toContain(greeting.textContent);
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

    it("should render disclaimer link to donate page", () => {
      render(<WelcomeScreen onSelectStarter={mockOnSelectStarter} />);

      const learnMoreLink = screen.getByText("Learn more");
      expect(learnMoreLink).toHaveAttribute("href", "/donate");
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
    it("should have accessible link to support page", () => {
      render(<WelcomeScreen onSelectStarter={mockOnSelectStarter} />);

      const links = screen.getAllByRole("link");
      expect(links.length).toBeGreaterThanOrEqual(1); // Learn more link
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
    it("should have proper classes on starter buttons", () => {
      render(<WelcomeScreen onSelectStarter={mockOnSelectStarter} />);

      const button = screen.getByText("What is the Law of One?");
      expect(button.className).toContain("starter-card");
    });

    it("should have greeting with proper font styling", () => {
      render(<WelcomeScreen onSelectStarter={mockOnSelectStarter} />);

      const greeting = screen.getByRole("heading", { level: 1 });
      expect(greeting).toBeInTheDocument();
      expect(greeting.className).toContain("font-[family-name:var(--font-cormorant)]");
    });
  });
});
