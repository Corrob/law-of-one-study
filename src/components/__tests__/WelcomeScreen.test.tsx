import { render, screen, fireEvent } from "@testing-library/react";
import WelcomeScreen from "../WelcomeScreen";

// Mock next-intl with namespace-aware translations
// Include all 46 starters in the mock
const mockStarters: Record<string, string> = {};
for (let i = 1; i <= 46; i++) {
  mockStarters[String(i)] = `Starter question ${i}`;
}
// Override first 3 for specific tests
mockStarters["1"] = "What is the Law of One?";
mockStarters["2"] = "Tell me about densities";
mockStarters["3"] = "What is love/light?";

jest.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const welcomeTranslations: Record<string, string> = {
      "greetings.seeker": "Welcome, seeker.",
      "greetings.loveLight": "In love and light.",
      "greetings.journey": "The journey continues.",
      "greetings.serve": "How may I serve?",
      "greetings.wanderer": "Greetings, wanderer.",
      "orExplore": "Or explore:",
      "disclaimer": "This AI companion provides helpful explanations, but only the highlighted quote cards contain authentic passages from the Ra Material.",
      "learnMore": "Learn more",
    };
    if (namespace === "starters") {
      return mockStarters[key] || `Starter question ${key}`;
    }
    return welcomeTranslations[key] || key;
  },
}));

describe("WelcomeScreen", () => {
  const mockOnSelectStarter = jest.fn();
  const originalRandom = Math.random;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Math.random to return deterministic values for testing
    // This ensures we always get keys 1, 2, 3 (index 0, 1, 2 after shuffle)
    let callCount = 0;
    Math.random = () => {
      callCount++;
      // Return values that result in no shuffling for the first 3 items
      return callCount < 5 ? 0.1 : 0.9;
    };
  });

  afterEach(() => {
    Math.random = originalRandom;
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

      // Should render 3 starters (text depends on random selection)
      const buttons = screen.getAllByRole("button").filter(
        (btn) => btn.className.includes("starter-card")
      );
      expect(buttons).toHaveLength(3);
      // Each button should have some text (from translations)
      buttons.forEach((btn) => {
        expect(btn.textContent).toBeTruthy();
      });
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

    it("should render disclaimer link to about page", () => {
      render(<WelcomeScreen onSelectStarter={mockOnSelectStarter} />);

      const learnMoreLink = screen.getByText("Learn more");
      expect(learnMoreLink).toHaveAttribute("href", "/about");
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

      // Click any starter button
      const starterButtons = screen.getAllByRole("button").filter(
        (btn) => btn.className.includes("starter-card")
      );
      fireEvent.click(starterButtons[0]);

      // Should be called with the button's text content
      expect(mockOnSelectStarter).toHaveBeenCalledWith(starterButtons[0].textContent);
    });

    it("should call onSelectStarter with correct text for each starter", () => {
      render(<WelcomeScreen onSelectStarter={mockOnSelectStarter} />);

      const starterButtons = screen.getAllByRole("button").filter(
        (btn) => btn.className.includes("starter-card")
      );

      // Click each starter and verify the callback receives the correct text
      starterButtons.forEach((btn, index) => {
        mockOnSelectStarter.mockClear();
        fireEvent.click(btn);
        expect(mockOnSelectStarter).toHaveBeenCalledWith(btn.textContent);
      });
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

  describe("confederation toggle", () => {
    it("should render SourceFilter when onConfederationChange is provided", () => {
      const mockOnConfederationChange = jest.fn();
      render(
        <WelcomeScreen
          onSelectStarter={mockOnSelectStarter}
          includeConfederation={false}
          onConfederationChange={mockOnConfederationChange}
        />
      );

      // SourceFilter renders a switch role element
      const switches = screen.getAllByRole("switch");
      expect(switches.length).toBeGreaterThanOrEqual(1);
    });

    it("should not render SourceFilter when onConfederationChange is not provided", () => {
      render(<WelcomeScreen onSelectStarter={mockOnSelectStarter} />);

      // Without onThinkingModeChange or onConfederationChange, no switches should render
      const switches = screen.queryAllByRole("switch");
      expect(switches).toHaveLength(0);
    });
  });

  describe("styling", () => {
    it("should have proper classes on starter buttons", () => {
      render(<WelcomeScreen onSelectStarter={mockOnSelectStarter} />);

      const starterButtons = screen.getAllByRole("button").filter(
        (btn) => btn.className.includes("starter-card")
      );
      expect(starterButtons.length).toBeGreaterThan(0);
      starterButtons.forEach((btn) => {
        expect(btn.className).toContain("starter-card");
      });
    });

    it("should have greeting with proper font styling", () => {
      render(<WelcomeScreen onSelectStarter={mockOnSelectStarter} />);

      const greeting = screen.getByRole("heading", { level: 1 });
      expect(greeting).toBeInTheDocument();
      expect(greeting.className).toContain("font-[family-name:var(--font-cormorant)]");
    });
  });
});
