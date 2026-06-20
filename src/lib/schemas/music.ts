/**
 * Zod schemas for the music album feature ("The Wanderer's Return").
 *
 * - Album / Song: feature metadata (typed literals live in src/data/music/album.ts).
 * - LyricCue / SongLyrics: timed karaoke cues, loaded from JSON and validated at
 *   load time (external-ish data from the Suno alignment pipeline).
 */

import { z } from "zod";

// =============================================================================
// Lyric cues (timed)
// =============================================================================

/**
 * A single timed lyric line. `animationHint` lets a specific moment trigger a
 * special scene state (e.g. "higher-self-reveal" in Song 6).
 */
export const LyricCueSchema = z.object({
  start: z.number().min(0),
  end: z.number().min(0),
  text: z.string(),
  animationHint: z.string().optional(),
});

export type LyricCue = z.infer<typeof LyricCueSchema>;

export const SongLyricsSchema = z.object({
  songId: z.string(),
  cues: z.array(LyricCueSchema),
});

export type SongLyrics = z.infer<typeof SongLyricsSchema>;

// =============================================================================
// Album + songs (metadata)
// =============================================================================

export const SongSchema = z.object({
  id: z.string(),
  trackNumber: z.number().int().min(1).max(7),
  /** i18n key under the "music" namespace, e.g. "songs.firstBreath.title" */
  titleKey: z.string(),
  descriptionKey: z.string(),
  /** density 1-7; each song corresponds to one density of consciousness */
  density: z.number().int().min(1).max(7),
  /** approximate duration in seconds; the real value comes from audio metadata */
  durationSeconds: z.number().min(0),
  audioFile: z.string(),
  /** CSS color (or token) for the density's accent */
  densityColor: z.string(),
  /** verified Ra Material references, e.g. ["36.9", "12.28"] */
  raPassages: z.array(z.string()),
});

export type Song = z.infer<typeof SongSchema>;

export const AlbumSchema = z.object({
  id: z.string(),
  titleKey: z.string(),
  descriptionKey: z.string(),
  songs: z.array(SongSchema).min(1),
});

export type Album = z.infer<typeof AlbumSchema>;

// =============================================================================
// Parse helpers (mirror parseStudyPath in study-paths.ts)
// =============================================================================

type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export function parseAlbum(data: unknown): ParseResult<Album> {
  const result = AlbumSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: result.error.issues[0]?.message || "Invalid album data",
  };
}

export function parseSongLyrics(data: unknown): ParseResult<SongLyrics> {
  const result = SongLyricsSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: result.error.issues[0]?.message || "Invalid song lyrics data",
  };
}
