import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MeditationPlayer from "../MeditationPlayer";
import { type Meditation } from "@/data/meditations";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      play: "Play meditation",
      pause: "Pause meditation",
      loopOn: "Repeat on",
      loopOff: "Repeat off",
      audioNotAvailable: "Audio coming soon",
      audioNotAvailableDesc: "This meditation audio is being prepared.",
    };
    return translations[key] ?? key;
  },
  useLocale: () => "en",
}));

// Mock HTMLMediaElement methods
beforeAll(() => {
  Object.defineProperty(HTMLMediaElement.prototype, "play", {
    configurable: true,
    value: jest.fn().mockResolvedValue(undefined),
  });
  Object.defineProperty(HTMLMediaElement.prototype, "pause", {
    configurable: true,
    value: jest.fn(),
  });
});

const mockMeditation: Meditation = {
  id: "finding-love",
  titleKey: "findingLove",
  descriptionKey: "findingLoveDesc",
  quoteKey: "findingLoveQuote",
  references: ["10.14"],
  referenceUrls: ["https://lawofone.info/s/10#14"],
  durationSeconds: 404,
  audioFile: "finding-love-in-the-moment.mp3",
};

describe("MeditationPlayer", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders play button and time display", () => {
    render(<MeditationPlayer meditation={mockMeditation} />);

    expect(screen.getByLabelText("Play meditation")).toBeInTheDocument();
    expect(screen.getByText("0:00")).toBeInTheDocument();
    expect(screen.getByText("6:44")).toBeInTheDocument();
  });

  it("renders seek slider", () => {
    render(<MeditationPlayer meditation={mockMeditation} />);

    expect(screen.getByLabelText("Seek")).toBeInTheDocument();
  });

  it("renders loop toggle defaulting to on", () => {
    render(<MeditationPlayer meditation={mockMeditation} />);

    const loopButton = screen.getByLabelText("Repeat on");
    expect(loopButton).toBeInTheDocument();
    expect(loopButton).toHaveAttribute("aria-pressed", "true");
  });

  it("toggles loop state on click", async () => {
    const user = userEvent.setup();
    render(<MeditationPlayer meditation={mockMeditation} />);

    const loopButton = screen.getByLabelText("Repeat on");
    await user.click(loopButton);

    expect(screen.getByLabelText("Repeat off")).toBeInTheDocument();
    expect(localStorage.getItem("meditation-loop-enabled")).toBe("false");
  });

  it("reads loop preference from localStorage", async () => {
    localStorage.setItem("meditation-loop-enabled", "false");
    render(<MeditationPlayer meditation={mockMeditation} />);

    await waitFor(() => {
      expect(screen.getByLabelText("Repeat off")).toBeInTheDocument();
    });
    expect(screen.getByLabelText("Repeat off")).toHaveAttribute("aria-pressed", "false");
  });

  it("renders audio element with correct src", () => {
    const { container } = render(
      <MeditationPlayer meditation={mockMeditation} />
    );

    const audio = container.querySelector("audio");
    expect(audio).toHaveAttribute(
      "src",
      "/meditations/finding-love-in-the-moment.mp3"
    );
  });

  it("sets audio preload to metadata", () => {
    const { container } = render(
      <MeditationPlayer meditation={mockMeditation} />
    );

    const audio = container.querySelector("audio");
    expect(audio).toHaveAttribute("preload", "metadata");
  });
});
