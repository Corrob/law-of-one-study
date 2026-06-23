import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

let mockLocale = "en";
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => mockLocale,
}));

import AlbumLanding from "../AlbumLanding";

describe("AlbumLanding", () => {
  beforeEach(() => {
    mockLocale = "en";
  });

  it("starts the album from the beginning when Play is pressed", async () => {
    const onPlay = jest.fn();
    const user = userEvent.setup();
    render(<AlbumLanding onPlay={onPlay} onOpenList={() => {}} />);
    await user.click(screen.getByRole("button", { name: "album.play" }));
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it("also starts the album when the title or subtitle is clicked", async () => {
    const onPlay = jest.fn();
    const user = userEvent.setup();
    render(<AlbumLanding onPlay={onPlay} onOpenList={() => {}} />);
    await user.click(screen.getByRole("button", { name: "album.title" }));
    await user.click(screen.getByRole("button", { name: "album.subtitle" }));
    expect(onPlay).toHaveBeenCalledTimes(2);
  });

  it("keeps the landing uncluttered — no description or play label", () => {
    render(<AlbumLanding onPlay={() => {}} onOpenList={() => {}} />);
    expect(screen.queryByText("album.description")).not.toBeInTheDocument();
    // The play affordance is the cover itself (aria-label), not a text label.
    expect(screen.getByRole("button", { name: "album.play" })).toBeInTheDocument();
  });

  it("opens the song list", async () => {
    const onOpenList = jest.fn();
    const user = userEvent.setup();
    render(<AlbumLanding onPlay={() => {}} onOpenList={onOpenList} />);
    await user.click(screen.getByText("album.songList"));
    expect(onOpenList).toHaveBeenCalledTimes(1);
  });

  it("hides the English-only notice for English", () => {
    render(<AlbumLanding onPlay={() => {}} onOpenList={() => {}} />);
    expect(screen.queryByText("album.englishOnly")).not.toBeInTheDocument();
  });

  it("shows the English-only notice for other locales", () => {
    mockLocale = "es";
    render(<AlbumLanding onPlay={() => {}} onOpenList={() => {}} />);
    expect(screen.getByText("album.englishOnly")).toBeInTheDocument();
  });
});
