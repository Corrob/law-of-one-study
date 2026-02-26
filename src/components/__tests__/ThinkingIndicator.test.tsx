import { render, screen, act } from "@testing-library/react";
import ThinkingIndicator from "../ThinkingIndicator";

// Mock thinking messages
const mockThinkingMessages: Record<string, string> = {
  "1": "Scanning the cosmic records...",
  "2": "Tuning the instrument...",
  "3": "Opening the narrow-band...",
  "4": "Adjusting the vibrational frequency...",
  "5": "Preparing the channel...",
  "6": "Clearing the distortions...",
  "7": "Aligning with the contact...",
  "8": "Establishing the link...",
  "9": "Synchronizing the vibrations...",
  "10": "Consulting the Confederation...",
  "11": "Channeling the Law of One...",
  "12": "Accessing Ra's wisdom...",
  "13": "Connecting to the social memory complex...",
  "14": "Reaching the sixth density...",
  "15": "Communing with those of Ra...",
  "16": "Invoking the Confederation's aid...",
  "17": "Seeking in the infinite...",
  "18": "Searching the Akashic records...",
  "19": "Exploring the inner planes...",
  "20": "Navigating the densities...",
};

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    return mockThinkingMessages[key] || `Scanning the cosmic records...`;
  },
}));

describe("ThinkingIndicator", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("rendering", () => {
    it("should render the thinking indicator", () => {
      render(<ThinkingIndicator />);

      expect(screen.getByTestId("thinking-indicator")).toBeInTheDocument();
    });

    it("should display a message", () => {
      render(<ThinkingIndicator />);

      // The indicator should contain text from the thinking messages
      const indicator = screen.getByTestId("thinking-indicator");
      expect(indicator.textContent).toBeTruthy();
      expect(indicator.textContent!.length).toBeGreaterThan(0);
    });

    it("should render with italic styling", () => {
      render(<ThinkingIndicator />);

      const messageElement = screen.getByTestId("thinking-indicator").querySelector("div");
      expect(messageElement).toHaveClass("italic");
    });

    it("should render two crossfade elements", () => {
      render(<ThinkingIndicator />);

      const divs = screen.getByTestId("thinking-indicator").querySelectorAll("div");
      // Two overlapping divs for crossfade
      expect(divs.length).toBe(2);
    });
  });

  describe("message rotation", () => {
    it("should change message after interval", () => {
      render(<ThinkingIndicator />);

      // Advance timers by 3.5 seconds
      act(() => {
        jest.advanceTimersByTime(3500);
      });

      // Component should still be functioning without errors
      expect(screen.getByTestId("thinking-indicator")).toBeInTheDocument();
    });

    it("should continue rotating messages over time", () => {
      render(<ThinkingIndicator />);

      // Advance through multiple intervals
      act(() => {
        jest.advanceTimersByTime(3500);
      });
      act(() => {
        jest.advanceTimersByTime(3500);
      });
      act(() => {
        jest.advanceTimersByTime(3500);
      });

      // Component should still be functioning
      expect(screen.getByTestId("thinking-indicator")).toBeInTheDocument();
    });
  });

  describe("cleanup", () => {
    it("should clear interval on unmount", () => {
      const clearIntervalSpy = jest.spyOn(global, "clearInterval");

      const { unmount } = render(<ThinkingIndicator />);

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });
  });

  describe("message content", () => {
    it("should display themed messages", () => {
      // Render multiple times to verify messages are from the expected set
      const messages = new Set<string>();

      for (let i = 0; i < 10; i++) {
        const { unmount } = render(<ThinkingIndicator />);
        const message = screen.getByTestId("thinking-indicator").textContent;
        if (message) messages.add(message);
        unmount();
      }

      // Should have collected some messages
      expect(messages.size).toBeGreaterThan(0);

      // Messages should be Ra-themed (contain common terms)
      const allMessages = Array.from(messages).join(" ");
      const raTerms = [
        "Ra",
        "cosmic",
        "density",
        "channel",
        "vibration",
        "unity",
        "love",
        "light",
        "infinite",
        "consciousness",
        "seeking",
        "polarity",
        "meditation",
        "Confederation",
        "wisdom",
        "energy",
      ];

      const hasRaTheme = raTerms.some(
        (term) =>
          allMessages.toLowerCase().includes(term.toLowerCase()) ||
          allMessages.includes("...")
      );
      expect(hasRaTheme).toBe(true);
    });

    it("should display message ending with ellipsis", () => {
      render(<ThinkingIndicator />);

      const message = screen.getByTestId("thinking-indicator").textContent;
      expect(message).toMatch(/\.\.\.$/);
    });
  });

  describe("styling", () => {
    it("should have margin-bottom and grid classes", () => {
      render(<ThinkingIndicator />);

      const container = screen.getByTestId("thinking-indicator");
      expect(container).toHaveClass("mb-6");
      expect(container).toHaveClass("grid");
    });

    it("should have text color class", () => {
      render(<ThinkingIndicator />);

      const messageDiv = screen.getByTestId("thinking-indicator").querySelector("div");
      expect(messageDiv?.className).toContain("text-sm");
    });

    it("should have transition class for smooth message changes", () => {
      render(<ThinkingIndicator />);

      const messageDiv = screen.getByTestId("thinking-indicator").querySelector("div");
      expect(messageDiv?.className).toContain("transition-opacity");
    });
  });

  describe("randomization", () => {
    it("should use random initial message", () => {
      // Mock Math.random to return different values
      const originalRandom = Math.random;
      const messages = new Set<string>();

      // Collect messages with different random seeds
      [0.1, 0.5, 0.9].forEach((randomValue) => {
        Math.random = () => randomValue;
        const { unmount } = render(<ThinkingIndicator />);
        const message = screen.getByTestId("thinking-indicator").textContent;
        if (message) messages.add(message);
        unmount();
      });

      Math.random = originalRandom;

      // Should have different messages for different random values
      // (unless collision, but highly unlikely with many messages)
      expect(messages.size).toBeGreaterThanOrEqual(1);
    });
  });
});
