/**
 * "The Wanderer's Return" — album metadata.
 *
 * A 7-track concept album; each song corresponds to one density of consciousness.
 * Lyrics are English-only for v1 (timed cues live in ./lyrics/song-0N.json).
 * Audio files live in public/music/ as song-01.mp3 … song-07.mp3.
 *
 * Source of truth for lyrics/concept: docs/album-lyrics.md.
 * `durationSeconds` are the real track lengths; the player also refreshes them
 * from the audio element's loadedmetadata event.
 */

import { type Album, type Song } from "@/lib/schemas/music";

/**
 * Density accent colors — the Ra energy-ray ramp (red → violet ≈ 1st → 7th),
 * matching the palette used by the concept graph (src/lib/graph/layout.ts).
 */
export const DENSITY_COLORS: Record<number, string> = {
  1: "#f87171", // red ray
  2: "#fb923c", // orange ray
  3: "#fbbf24", // yellow ray
  4: "#4ade80", // green ray
  5: "#38bdf8", // blue ray
  6: "#818cf8", // indigo ray
  7: "#a78bfa", // violet ray
};

export const ALBUM: Album = {
  id: "the-wanderers-return",
  titleKey: "album.title",
  descriptionKey: "album.description",
  songs: [
    {
      id: "first-breath",
      trackNumber: 1,
      titleKey: "songs.firstBreath.title",
      descriptionKey: "songs.firstBreath.description",
      density: 1,
      durationSeconds: 174,
      audioFile: "song-01.mp3",
      densityColor: DENSITY_COLORS[1],
      raPassages: ["13.7", "13.9", "27.7", "16.51"],
    },
    {
      id: "the-reaching",
      trackNumber: 2,
      titleKey: "songs.theReaching.title",
      descriptionKey: "songs.theReaching.description",
      density: 2,
      durationSeconds: 153,
      audioFile: "song-02.mp3",
      densityColor: DENSITY_COLORS[2],
      raPassages: ["13.17", "13.21", "20.3"],
    },
    {
      id: "behind-the-veil",
      trackNumber: 3,
      titleKey: "songs.behindTheVeil.title",
      descriptionKey: "songs.behindTheVeil.description",
      density: 3,
      durationSeconds: 168,
      audioFile: "song-03.mp3",
      densityColor: DENSITY_COLORS[3],
      raPassages: ["82.21", "82.28", "19.17", "19.18"],
    },
    {
      id: "known",
      trackNumber: 4,
      titleKey: "songs.known.title",
      descriptionKey: "songs.known.description",
      density: 4,
      durationSeconds: 128,
      audioFile: "song-04.mp3",
      densityColor: DENSITY_COLORS[4],
      raPassages: ["16.50", "40.12", "17.31", "48.6"],
    },
    {
      id: "cold-light",
      trackNumber: 5,
      titleKey: "songs.coldLight.title",
      descriptionKey: "songs.coldLight.description",
      density: 5,
      durationSeconds: 181,
      audioFile: "song-05.mp3",
      densityColor: DENSITY_COLORS[5],
      raPassages: ["41.26"],
    },
    {
      id: "a-million-years-ahead",
      trackNumber: 6,
      titleKey: "songs.aMillionYearsAhead.title",
      descriptionKey: "songs.aMillionYearsAhead.description",
      density: 6,
      durationSeconds: 191,
      audioFile: "song-06.mp3",
      densityColor: DENSITY_COLORS[6],
      raPassages: ["36.1", "36.6", "36.8", "36.9", "12.28"],
    },
    {
      id: "gateway",
      trackNumber: 7,
      titleKey: "songs.gateway.title",
      descriptionKey: "songs.gateway.description",
      density: 7,
      durationSeconds: 179,
      audioFile: "song-07.mp3",
      densityColor: DENSITY_COLORS[7],
      raPassages: ["16.22", "36.1", "27.8", "27.9", "28.15", "16.51"],
    },
  ],
};

/**
 * Public path to a song's audio file. Served from /album/ so the asset path
 * can't collide with a localized page route or the i18n proxy — the same reason
 * meditation audio lives under /meditations/, not /meditate/.
 */
export function getAudioPath(song: Song): string {
  return `/album/${song.audioFile}`;
}

/**
 * Public path to a song's cover art. Derived from the track number so the seven
 * covers live alongside the audio: /album/song-0N-cover.webp.
 */
export function getCoverPath(song: Song): string {
  const n = song.trackNumber.toString().padStart(2, "0");
  return `/album/song-${n}-cover.webp`;
}

/** Find a song by id. */
export function getSongById(id: string): Song | undefined {
  return ALBUM.songs.find((s) => s.id === id);
}
