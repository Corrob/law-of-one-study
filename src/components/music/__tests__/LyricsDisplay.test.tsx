import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LyricsDisplay from "../LyricsDisplay";
import { type LyricCue } from "@/lib/schemas/music";

const cues: LyricCue[] = [
  { start: 0, end: 2, text: "first line" },
  { start: 2, end: 5, text: "second line" },
  { start: 5, end: 8, text: "third line" },
];

describe("LyricsDisplay", () => {
  it("renders every lyric line", () => {
    render(
      <LyricsDisplay
        cues={cues}
        activeIndex={1}
        reducedMotion
        onSeekToLine={() => {}}
      />
    );
    expect(screen.getByText("first line")).toBeInTheDocument();
    expect(screen.getByText("second line")).toBeInTheDocument();
    expect(screen.getByText("third line")).toBeInTheDocument();
  });

  it("marks the active line with aria-current", () => {
    render(
      <LyricsDisplay
        cues={cues}
        activeIndex={1}
        reducedMotion
        onSeekToLine={() => {}}
      />
    );
    expect(screen.getByText("second line")).toHaveAttribute(
      "aria-current",
      "true"
    );
    expect(screen.getByText("first line")).not.toHaveAttribute("aria-current");
  });

  it("seeks to a line's start time when tapped", async () => {
    const onSeek = jest.fn();
    const user = userEvent.setup();
    render(
      <LyricsDisplay
        cues={cues}
        activeIndex={0}
        reducedMotion
        onSeekToLine={onSeek}
      />
    );
    await user.click(screen.getByText("third line"));
    expect(onSeek).toHaveBeenCalledWith(5);
  });

  it("renders with no active line (activeIndex -1)", () => {
    render(
      <LyricsDisplay
        cues={cues}
        activeIndex={-1}
        reducedMotion
        onSeekToLine={() => {}}
      />
    );
    expect(screen.getByText("first line")).toBeInTheDocument();
    expect(screen.queryByText("first line")).not.toHaveAttribute("aria-current");
  });
});
