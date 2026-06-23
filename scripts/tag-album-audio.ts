/**
 * Embed ID3 tags + cover art into the album's mp3 files.
 * Run with: npm run tag:album
 *
 * For each song in ALBUM it writes:
 *   - title       → the song name (e.g. "First Breath")
 *   - artist      → "Law of One Study"
 *   - album_artist→ "Law of One Study"
 *   - album       → "The Wanderer's Return"
 *   - track       → the track number
 *   - cover art   → the song's cover (webp → jpeg, embedded as APIC)
 *
 * Rewrites public/album/song-0N.mp3 in place (ffmpeg can't edit in place,
 * so it writes a temp file and swaps it). Requires ffmpeg on PATH.
 */

import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import sharp from "sharp";

import { ALBUM } from "../src/data/music/album";
import enMessages from "../messages/en/music.json";

const ARTIST = "Law of One Study";
const ALBUM_DIR = path.resolve(__dirname, "../public/album");

/** Resolve a "songs.x.y"/"album.title" key against the English messages. */
function resolveKey(key: string): string {
  const stripped = key.replace(/^music\./, "");
  return stripped
    .split(".")
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === "object"
          ? (node as Record<string, unknown>)[part]
          : undefined,
      enMessages
    ) as string;
}

async function tagSong(
  song: (typeof ALBUM.songs)[number],
  albumTitle: string
): Promise<void> {
  const title = resolveKey(song.titleKey);
  const audioPath = path.join(ALBUM_DIR, song.audioFile);
  const coverWebp = path.join(
    ALBUM_DIR,
    `song-${song.trackNumber.toString().padStart(2, "0")}-cover.webp`
  );

  if (!fs.existsSync(audioPath)) {
    console.warn(`  ⚠ missing audio: ${song.audioFile} — skipping`);
    return;
  }

  // ID3 APIC frames want jpeg/png; convert the webp cover to a temp jpeg.
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "album-tag-"));
  const coverJpg = path.join(tmpDir, "cover.jpg");
  const outMp3 = path.join(tmpDir, song.audioFile);

  try {
    await sharp(coverWebp).jpeg({ quality: 90 }).toFile(coverJpg);

    execFileSync(
      "ffmpeg",
      [
        "-y",
        "-i", audioPath,
        "-i", coverJpg,
        "-map", "0:a",
        "-map", "1:v",
        "-c:a", "copy",
        "-c:v", "mjpeg",
        "-id3v2_version", "3",
        "-metadata", `title=${title}`,
        "-metadata", `artist=${ARTIST}`,
        "-metadata", `album_artist=${ARTIST}`,
        "-metadata", `album=${albumTitle}`,
        "-metadata", `track=${song.trackNumber}`,
        "-metadata:s:v", "title=Album cover",
        "-metadata:s:v", "comment=Cover (front)",
        "-disposition:v", "attached_pic",
        outMp3,
      ],
      { stdio: ["ignore", "ignore", "pipe"] }
    );

    fs.copyFileSync(outMp3, audioPath);
    console.log(`  ✓ ${song.audioFile}  →  "${title}" — ${ARTIST}`);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

async function main() {
  const albumTitle = resolveKey(ALBUM.titleKey);
  console.log(`Tagging ${ALBUM.songs.length} tracks for "${albumTitle}"…`);
  for (const song of ALBUM.songs) {
    await tagSong(song, albumTitle);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
