import { parseAlbum, parseSongLyrics } from "../music";
import { ALBUM, getAudioPath, getSongById } from "@/data/music/album";
import song06 from "@/data/music/lyrics/song-06.json";

describe("music schema", () => {
  it("validates the ALBUM literal", () => {
    const result = parseAlbum(ALBUM);
    expect(result.success).toBe(true);
  });

  it("rejects malformed album data", () => {
    const result = parseAlbum({ id: "x" });
    expect(result.success).toBe(false);
    if (!result.success) expect(typeof result.error).toBe("string");
  });

  it("validates the sample Song 6 lyrics", () => {
    const result = parseSongLyrics(song06);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.songId).toBe("a-million-years-ahead");
      expect(result.data.cues.length).toBeGreaterThan(0);
    }
  });

  it("rejects lyrics with a negative start time", () => {
    const result = parseSongLyrics({
      songId: "x",
      cues: [{ start: -1, end: 1, text: "bad" }],
    });
    expect(result.success).toBe(false);
  });
});

describe("ALBUM data integrity", () => {
  it("has 7 songs numbered 1–7 in order", () => {
    expect(ALBUM.songs.map((s) => s.trackNumber)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("maps each song to its matching density", () => {
    for (const song of ALBUM.songs) {
      expect(song.density).toBe(song.trackNumber);
    }
  });

  it("has unique song ids", () => {
    const ids = ALBUM.songs.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("references audio files ending in .mp3", () => {
    for (const song of ALBUM.songs) {
      expect(song.audioFile).toMatch(/^song-0[1-7]\.mp3$/);
    }
  });

  it("builds the audio path (served from /album, not /music)", () => {
    const song = ALBUM.songs[0];
    expect(getAudioPath(song)).toBe("/album/song-01.mp3");
  });

  it("looks up a song by id", () => {
    expect(getSongById("gateway")?.trackNumber).toBe(7);
    expect(getSongById("nope")).toBeUndefined();
  });

  it("carries at least one verified Ra reference per song", () => {
    for (const song of ALBUM.songs) {
      expect(song.raPassages.length).toBeGreaterThan(0);
    }
  });
});
