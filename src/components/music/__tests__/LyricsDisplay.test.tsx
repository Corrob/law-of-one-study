import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  onSeekToLine: () => {},
};

describe("LyricsDisplay", () => {
  it("renders every lyric line", () => {
    render(<LyricsDisplay {...baseProps} activeIndex={-1} lit={false} />);
    expect(screen.getByRole("button", { name: "first line" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "second line" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "third line" })).toBeInTheDocument();
  });

  it("marks the lit active line with aria-current and glows it in", () => {
    render(<LyricsDisplay {...baseProps} activeIndex={1} />);
    expect(screen.getByRole("button", { name: "second line" })).toHaveAttribute(
      "aria-current",
      "true"
    );
    // The active line text glows in with the entrance animation.
    expect(screen.getByText("second line")).toHaveClass("lyric-glow-in");
  });

  it("drops the highlight when the line is no longer lit (instrumental gap)", () => {
    render(<LyricsDisplay {...baseProps} activeIndex={1} lit={false} />);
    expect(
      screen.getByRole("button", { name: "second line" })
    ).not.toHaveAttribute("aria-current");
  });

  it("dims surrounding lines, with past lines fainter than upcoming ones", () => {
    render(<LyricsDisplay {...baseProps} activeIndex={1} />);
    const past = screen.getByRole("button", { name: "first line" });
    const upcoming = screen.getByRole("button", { name: "third line" });
    const pastOpacity = Number(past.style.opacity);
    const upcomingOpacity = Number(upcoming.style.opacity);
    expect(pastOpacity).toBeGreaterThan(0);
    expect(pastOpacity).toBeLessThan(1);
    expect(pastOpacity).toBeLessThan(upcomingOpacity);
  });

  it("seeks to a line's start time when tapped", async () => {
    const onSeek = jest.fn();
    const user = userEvent.setup();
    render(
      <LyricsDisplay {...baseProps} activeIndex={0} onSeekToLine={onSeek} />
    );
    await user.click(screen.getByRole("button", { name: "third line" }));
    expect(onSeek).toHaveBeenCalledWith(5);
  });

  it("renders with no active line (activeIndex -1)", () => {
    render(<LyricsDisplay {...baseProps} activeIndex={-1} lit={false} />);
    expect(
      screen.getByRole("button", { name: "first line" })
    ).not.toHaveAttribute("aria-current");
  });
});
