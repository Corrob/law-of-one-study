import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PwaInstallPrompt, {
  shouldShowPrompt,
  detectIosSafari,
} from "../PwaInstallPrompt";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      title: "Install the App",
      description: "Install for quicker access.",
      iosDescription: "Tap the share button in Safari.",
      install: "Install",
      learnMore: "Learn more",
      dismiss: "Dismiss",
    };
    return translations[key] ?? key;
  },
}));

// Mock @/i18n/navigation
jest.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    href,
    onClick,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
    className?: string;
  }) => (
    <a href={href} onClick={onClick} className={className}>
      {children}
    </a>
  ),
}));

// Helper to mock matchMedia
function mockMatchMedia(standalone: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: query === "(display-mode: standalone)" ? standalone : false,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  });
}

describe("shouldShowPrompt", () => {
  beforeEach(() => {
    localStorage.clear();
    mockMatchMedia(false);
  });

  it("returns true when no flags are set and not standalone", () => {
    expect(shouldShowPrompt()).toBe(true);
  });

  it("returns false when dismissed", () => {
    localStorage.setItem("lo1-pwa-prompt-dismissed", "true");
    expect(shouldShowPrompt()).toBe(false);
  });

  it("returns false when installed", () => {
    localStorage.setItem("lo1-pwa-installed", "true");
    expect(shouldShowPrompt()).toBe(false);
  });

  it("returns false and sets installed flag when in standalone mode", () => {
    mockMatchMedia(true);
    expect(shouldShowPrompt()).toBe(false);
    expect(localStorage.getItem("lo1-pwa-installed")).toBe("true");
  });
});

describe("detectIosSafari", () => {
  const originalUserAgent = navigator.userAgent;
  const originalPlatform = navigator.platform;
  const originalMaxTouchPoints = navigator.maxTouchPoints;

  afterEach(() => {
    Object.defineProperty(navigator, "userAgent", {
      writable: true,
      value: originalUserAgent,
    });
    Object.defineProperty(navigator, "platform", {
      writable: true,
      value: originalPlatform,
    });
    Object.defineProperty(navigator, "maxTouchPoints", {
      writable: true,
      value: originalMaxTouchPoints,
    });
  });

  it("returns false for Chrome on desktop", () => {
    Object.defineProperty(navigator, "userAgent", {
      writable: true,
      value:
        "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    });
    expect(detectIosSafari()).toBe(false);
  });

  it("returns true for Safari on iPhone", () => {
    Object.defineProperty(navigator, "userAgent", {
      writable: true,
      value:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    });
    expect(detectIosSafari()).toBe(true);
  });

  it("returns false for Chrome on iPhone", () => {
    Object.defineProperty(navigator, "userAgent", {
      writable: true,
      value:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/120.0 Safari/604.1",
    });
    expect(detectIosSafari()).toBe(false);
  });
});

describe("PwaInstallPrompt", () => {
  beforeEach(() => {
    localStorage.clear();
    mockMatchMedia(false);
  });

  it("renders nothing by default (no beforeinstallprompt, not iOS)", () => {
    const { container } = render(<PwaInstallPrompt />);
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when already dismissed", () => {
    localStorage.setItem("lo1-pwa-prompt-dismissed", "true");
    const { container } = render(<PwaInstallPrompt />);
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when in standalone mode", () => {
    mockMatchMedia(true);
    const { container } = render(<PwaInstallPrompt />);
    expect(container.innerHTML).toBe("");
  });

  it("shows prompt when beforeinstallprompt fires and dismisses on click", async () => {
    const user = userEvent.setup();
    render(<PwaInstallPrompt />);

    // Simulate the browser firing beforeinstallprompt
    const mockEvent = new Event("beforeinstallprompt", { cancelable: true });
    Object.assign(mockEvent, {
      prompt: jest.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: "dismissed" as const }),
    });

    act(() => {
      window.dispatchEvent(mockEvent);
    });

    expect(screen.getByText("Install the App")).toBeInTheDocument();
    expect(screen.getByText("Install")).toBeInTheDocument();
    expect(screen.getByText("Learn more")).toBeInTheDocument();

    // Dismiss the prompt
    await user.click(screen.getByLabelText("Dismiss"));
    expect(screen.queryByText("Install the App")).not.toBeInTheDocument();
    expect(localStorage.getItem("lo1-pwa-prompt-dismissed")).toBe("true");
  });

  it("sets installed flag when user accepts install", async () => {
    const user = userEvent.setup();
    render(<PwaInstallPrompt />);

    const mockPrompt = jest.fn().mockResolvedValue(undefined);
    const mockEvent = new Event("beforeinstallprompt", { cancelable: true });
    Object.assign(mockEvent, {
      prompt: mockPrompt,
      userChoice: Promise.resolve({ outcome: "accepted" as const }),
    });

    act(() => {
      window.dispatchEvent(mockEvent);
    });

    await user.click(screen.getByText("Install"));

    expect(mockPrompt).toHaveBeenCalled();
    expect(localStorage.getItem("lo1-pwa-installed")).toBe("true");
  });

  it("dismisses when Learn more is clicked", async () => {
    const user = userEvent.setup();
    render(<PwaInstallPrompt />);

    const mockEvent = new Event("beforeinstallprompt", { cancelable: true });
    Object.assign(mockEvent, {
      prompt: jest.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: "dismissed" as const }),
    });

    act(() => {
      window.dispatchEvent(mockEvent);
    });

    await user.click(screen.getByText("Learn more"));
    expect(localStorage.getItem("lo1-pwa-prompt-dismissed")).toBe("true");
  });

  it("stays dismissed when beforeinstallprompt fires again after dismissal", async () => {
    const user = userEvent.setup();
    render(<PwaInstallPrompt />);

    const makeEvent = () => {
      const e = new Event("beforeinstallprompt", { cancelable: true });
      Object.assign(e, {
        prompt: jest.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: "dismissed" as const }),
      });
      return e;
    };

    // Show and dismiss
    act(() => {
      window.dispatchEvent(makeEvent());
    });
    await user.click(screen.getByLabelText("Dismiss"));
    expect(screen.queryByText("Install the App")).not.toBeInTheDocument();

    // Fire event again (simulates page navigation re-triggering)
    act(() => {
      window.dispatchEvent(makeEvent());
    });
    expect(screen.queryByText("Install the App")).not.toBeInTheDocument();
  });
});
