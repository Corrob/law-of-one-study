import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InstallAppContent from "../InstallAppContent";

// next-intl: echo keys.
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Strip the heavy shell/animation wrappers to plain passthroughs.
jest.mock("@/components/NavigationWrapper", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock("@/components/MotionFadeIn", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock("@/components/MotionStaggerGroup", () => ({
  MotionStaggerGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  MotionStaggerItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

function mockMatchMedia(standalone: boolean) {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: standalone && query.includes("standalone"),
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
}

function fireBeforeInstallPrompt(outcome: "accepted" | "dismissed" = "accepted") {
  const e = new Event("beforeinstallprompt") as Event & {
    prompt: jest.Mock;
    userChoice: Promise<{ outcome: string }>;
  };
  e.prompt = jest.fn().mockResolvedValue(undefined);
  e.userChoice = Promise.resolve({ outcome });
  act(() => {
    window.dispatchEvent(e);
  });
  return e;
}

describe("InstallAppContent — direct install button", () => {
  beforeEach(() => mockMatchMedia(false));

  it("shows the hint when the browser hasn't offered an install prompt", () => {
    render(<InstallAppContent />);
    expect(screen.getByText("installHint")).toBeInTheDocument();
    expect(screen.queryByText("installButton")).not.toBeInTheDocument();
  });

  it("reveals the install button after beforeinstallprompt fires", () => {
    render(<InstallAppContent />);
    fireBeforeInstallPrompt();
    expect(screen.getByText("installButton")).toBeInTheDocument();
    expect(screen.queryByText("installHint")).not.toBeInTheDocument();
  });

  it("prompts and shows the installed state when accepted", async () => {
    render(<InstallAppContent />);
    const evt = fireBeforeInstallPrompt("accepted");
    await userEvent.click(screen.getByText("installButton"));
    expect(evt.prompt).toHaveBeenCalled();
    expect(await screen.findByText("installedLabel")).toBeInTheDocument();
  });

  it("shows the installed state immediately when running standalone", () => {
    mockMatchMedia(true);
    render(<InstallAppContent />);
    expect(screen.getByText("installedLabel")).toBeInTheDocument();
    expect(screen.queryByText("installButton")).not.toBeInTheDocument();
  });
});
