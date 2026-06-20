"use client";

import dynamic from "next/dynamic";
import { type ComponentType } from "react";
import { type AudioClock } from "@/hooks/useAudioClock";

/**
 * Props shared by every density scene. Scenes are decorative (aria-hidden);
 * they read playback time from `clock`, react to `activeHint` for special
 * moments, and render a still frame when `reducedMotion` is true.
 */
export interface SceneProps {
  clock: AudioClock;
  activeHint?: string;
  reducedMotion: boolean;
  /** the song's density accent color */
  color: string;
  /** total track length (for time-based progression) */
  durationSeconds: number;
}

// Scenes are client-only and lazy-loaded so the route bundle stays light.
const EmberScene = dynamic(() => import("./scenes/EmberScene"), { ssr: false });
const GrowthScene = dynamic(() => import("./scenes/GrowthScene"), {
  ssr: false,
});
const VeilScene = dynamic(() => import("./scenes/VeilScene"), { ssr: false });
const MergeScene = dynamic(() => import("./scenes/MergeScene"), { ssr: false });
const LatticeScene = dynamic(() => import("./scenes/LatticeScene"), {
  ssr: false,
});
const MandalaScene = dynamic(() => import("./scenes/MandalaScene"), {
  ssr: false,
});
const DissolveScene = dynamic(() => import("./scenes/DissolveScene"), {
  ssr: false,
});
const GenericDensityScene = dynamic(
  () => import("./scenes/GenericDensityScene"),
  { ssr: false }
);

const BESPOKE_SCENES: Record<number, ComponentType<SceneProps>> = {
  1: EmberScene,
  2: GrowthScene,
  3: VeilScene,
  4: MergeScene,
  5: LatticeScene,
  6: MandalaScene,
  7: DissolveScene,
};

/**
 * Picks and renders the scene for a song's density. Songs without a bespoke
 * scene (2–5 for now) fall back to the generic color/particle scene.
 */
export default function DensityScene({
  density,
  ...sceneProps
}: { density: number } & SceneProps) {
  const Scene = BESPOKE_SCENES[density] ?? GenericDensityScene;
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden pointer-events-none"
    >
      <Scene {...sceneProps} />
    </div>
  );
}
