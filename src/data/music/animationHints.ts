/**
 * Animation-hint vocabulary for timed lyric cues.
 *
 * A lyric cue's optional `animationHint` fires a synced visual moment when that
 * line is sung. There are two kinds:
 *
 * - **Generic FX** ({@link LYRIC_FX_EFFECTS}) — a small, reusable set of
 *   meaning-driven overlays rendered by `LyricFx` over *any* density scene
 *   (tinted by the song's ray color). Place one on the key beat of each
 *   verse/chorus/bridge so the visuals echo the words.
 * - **Scene-specific** ({@link SCENE_HINTS}) — bespoke moments owned by a single
 *   scene (e.g. Song 6's MandalaScene reveal). `LyricFx` ignores these.
 *
 * Keep the vocabulary small and consistent (lyric-video best practice: a few
 * eased moves, used with intention — not a different effect on every line).
 */

/** Generic, reusable meaning-driven effects rendered by `LyricFx`. */
export const LYRIC_FX_EFFECTS = [
  "spark", // ignition, a stirring, the first spark of knowing
  "rise", // reaching, growth, rising, waking, ascending
  "fall", // a veil descending, forgetting, the glad dive
  "bloom", // a chorus swell — brighten + expand (the big moments)
  "shimmer", // a sweep of light — veils, transparency, revelation
  "expand", // an outward ring — vastness, opening, "existing in the all"
  "contract", // an inward ring — the many fall to one, gathering, return
  "split", // two paths diverging — the choice, two hands
  "warm", // a gold infusion — the cold light learning to love (the flame)
] as const;

export type LyricFxEffect = (typeof LYRIC_FX_EFFECTS)[number];

/** Bespoke hints handled inside a specific scene, not by `LyricFx`. */
export const SCENE_HINTS = [
  "motif-return",
  "higher-self-reveal",
  "chorus-bloom",
] as const;

/** Every valid `animationHint` value (generic FX + scene-specific). */
export const ALL_ANIMATION_HINTS: ReadonlySet<string> = new Set([
  ...LYRIC_FX_EFFECTS,
  ...SCENE_HINTS,
]);

const FX_SET: ReadonlySet<string> = new Set(LYRIC_FX_EFFECTS);

/** Whether `hint` is a generic FX effect that `LyricFx` renders. */
export function isLyricFxEffect(hint: string | undefined): hint is LyricFxEffect {
  return hint != null && FX_SET.has(hint);
}
