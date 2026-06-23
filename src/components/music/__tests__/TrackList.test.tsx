import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import TrackList from "../TrackList";
import { ALBUM } from "@/data/music/album";

describe("TrackList", () => {
  it("renders a row, cover image and reference pills for every song", () => {
    const { container } = render(<TrackList onSelect={() => {}} />);

    // One button + one (decorative) cover image per song.
    expect(screen.getAllByRole("button")).toHaveLength(ALBUM.songs.length);
    expect(container.querySelectorAll("img")).toHaveLength(ALBUM.songs.length);

    // Ra references render as pills (e.g. song 1 cites 13.7).
    expect(screen.getByText("Ra 13.7")).toBeInTheDocument();
  });

  it("shows each song's full description", () => {
    render(<TrackList onSelect={() => {}} />);
    expect(
      screen.getByText(ALBUM.songs[0].descriptionKey)
    ).toBeInTheDocument();
  });

  it("calls onSelect with the chosen song", async () => {
    const onSelect = jest.fn();
    const user = userEvent.setup();
    render(<TrackList onSelect={onSelect} />);
    const first = ALBUM.songs[0];
    await user.click(
      screen.getByRole("button", { name: new RegExp(first.titleKey) })
    );
    expect(onSelect).toHaveBeenCalledWith(first);
  });

  it("marks the current song with aria-current", () => {
    const current = ALBUM.songs[2];
    render(<TrackList onSelect={() => {}} currentSongId={current.id} />);
    expect(
      screen.getByRole("button", { name: new RegExp(current.titleKey) })
    ).toHaveAttribute("aria-current", "true");
  });
});
