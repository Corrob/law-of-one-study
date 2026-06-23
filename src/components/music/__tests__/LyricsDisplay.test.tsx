import { render, screen } from "@testing-library/react";
import LyricsDisplay from "../LyricsDisplay";
import { type LyricCue } from "@/lib/schemas/music";

const cues: LyricCue[] = [
  { start: 0, end: 2, text: "first line" },
  { start: 2, end: 5, text: "second line" },
  { start: 5, end: 8, text: "third line" },
];

const baseProps = {
  cues,
  densityColor: "#38bdf8",
  reducedMotion: true,
  lit: true,
};

describe("LyricsDisplay", () => {
  it("renders every lyric line", () => {
    render(<LyricsDisplay {...baseProps} activeIndex={-1} lit={false} />);
    expect(screen.getByText("first line")).toBeInTheDocument();
    expect(screen.getByText("second line")).toBeInTheDocument();
    expect(screen.getByText("third line")).toBeInTheDocument();
  });

  it("renders lyric lines as non-interactive text (no tap targets)", () => {
    render(<LyricsDisplay {...baseProps} activeIndex={1} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("marks the lit active line with aria-current and glows it in", () => {
    render(<LyricsDisplay {...baseProps} activeIndex={1} />);
    expect(screen.getByText("second line").closest("p")).toHaveAttribute(
      "aria-current",
      "true"
    );
    // The active line text glows in with the entrance animation.
    expect(screen.getByText("second line")).toHaveClass("lyric-glow-in");
  });

  it("drops the highlight when the line is no longer lit (instrumental gap)", () => {
    render(<LyricsDisplay {...baseProps} activeIndex={1} lit={false} />);
    expect(screen.getByText("second line")).not.toHaveAttribute("aria-current");
  });

  it("dims surrounding lines, with past lines fainter than upcoming ones", () => {
    render(<LyricsDisplay {...baseProps} activeIndex={1} />);
    const past = screen.getByText("first line");
    const upcoming = screen.getByText("third line");
    const pastOpacity = Number(past.style.opacity);
    const upcomingOpacity = Number(upcoming.style.opacity);
    expect(pastOpacity).toBeGreaterThan(0);
    expect(pastOpacity).toBeLessThan(1);
    expect(pastOpacity).toBeLessThan(upcomingOpacity);
  });

  it("renders with no active line (activeIndex -1)", () => {
    render(<LyricsDisplay {...baseProps} activeIndex={-1} lit={false} />);
    expect(screen.getByText("first line")).not.toHaveAttribute("aria-current");
  });
});
