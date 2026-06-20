import { parseSongLyrics, type LyricCue } from "@/lib/schemas/music";
import { type Song } from "@/lib/schemas/music";

/**
 * Lazy loaders for each song's timed-cue JSON, keyed by song id.
 *
 * Only songs whose timings have been authored (from the Suno alignment
 * pipeline) appear here; the rest gracefully resolve to an empty cue list,
 * so the player still shows the track with a "lyrics coming soon" state.
 */
const LYRIC_MODULES: Record<string, () => Promise<{ default: unknown }>> = {
  "first-breath": () => import("./lyrics/song-01.json"),
  "the-reaching": () => import("./lyrics/song-02.json"),
  "behind-the-veil": () => import("./lyrics/song-03.json"),
  known: () => import("./lyrics/song-04.json"),
  "cold-light": () => import("./lyrics/song-05.json"),
  "a-million-years-ahead": () => import("./lyrics/song-06.json"),
  gateway: () => import("./lyrics/song-07.json"),
};

/** Load and validate a song's timed cues. Returns [] if none/invalid. */
export async function loadSongLyrics(song: Song): Promise<LyricCue[]> {
  const loader = LYRIC_MODULES[song.id];
  if (!loader) return [];
  try {
    const mod = await loader();
    const result = parseSongLyrics(mod.default);
    return result.success ? result.data.cues : [];
  } catch {
    return [];
  }
}
