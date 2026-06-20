import { loadSongLyrics } from "../loadLyrics";
import { ALBUM } from "../album";

describe("loadSongLyrics — all album tracks", () => {
  it.each(ALBUM.songs.map((s) => [s.id]))(
    "loads valid, time-ordered cues within the track for %s",
    async (id) => {
      const song = ALBUM.songs.find((s) => s.id === id)!;
      const cues = await loadSongLyrics(song);

      expect(cues.length).toBeGreaterThan(0);

      let prevStart = -1;
      for (const cue of cues) {
        expect(cue.start).toBeGreaterThanOrEqual(0);
        expect(cue.end).toBeGreaterThanOrEqual(cue.start);
        // cues are sorted by start time
        expect(cue.start).toBeGreaterThanOrEqual(prevStart);
        prevStart = cue.start;
        // stays within the track (small slack for trailing outro tails)
        expect(cue.start).toBeLessThanOrEqual(song.durationSeconds + 5);
        expect(cue.text.length).toBeGreaterThan(0);
      }
    }
  );

  it("places the higher-self-reveal hint on Song 6's reveal line", async () => {
    const song = ALBUM.songs.find((s) => s.id === "a-million-years-ahead")!;
    const cues = await loadSongLyrics(song);
    const reveal = cues.find((c) => c.animationHint === "higher-self-reveal");
    expect(reveal?.text).toBe("I remember standing in the dark");
  });
});
