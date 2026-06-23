"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { isLyricFxEffect, type LyricFxEffect } from "@/data/music/animationHints";

interface LyricFxProps {
  /** The active line's animationHint (only generic FX effects are rendered). */
  effect?: string;
  /** Changes per lyric line — used to (re)trigger the effect on each new line. */
  trigger: number;
  /** The song's density ray color. */
  color: string;
  reducedMotion: boolean;
}

/**
 * Meaning-driven lyric FX — a small, reusable vocabulary of eased overlays that
 * play once when a hinted line is sung, echoing the words (a spark ignites, a
 * veil falls, a chorus blooms). Rendered behind the lyrics inside the density
 * scene, tinted by the song's ray color, so it never competes with the text.
 *
 * The effect latches on its own short timeline so it plays out fully even when
 * the next (un-hinted) line arrives moments later. Disabled under reduced motion.
 */
export default function LyricFx({
  effect,
  trigger,
  color,
  reducedMotion,
}: LyricFxProps) {
  const [active, setActive] = useState<{ fx: LyricFxEffect; id: number } | null>(
    null
  );

  useEffect(() => {
    if (reducedMotion || !isLyricFxEffect(effect)) return;
    setActive({ fx: effect, id: trigger });
  }, [effect, trigger, reducedMotion]);

  useEffect(() => {
    if (!active) return;
    const id = setTimeout(() => setActive(null), 3800);
    return () => clearTimeout(id);
  }, [active]);

  if (!active) return null;

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden pointer-events-none"
    >
      <FxLayer key={active.id} fx={active.fx} color={color} />
    </div>
  );
}

/** Renders the one-shot motion for a single effect. */
function FxLayer({ fx, color }: { fx: LyricFxEffect; color: string }) {
  switch (fx) {
    case "spark":
      return (
        <motion.div
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: 140,
            height: 140,
            marginLeft: -70,
            marginTop: -70,
            background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          }}
          initial={{ opacity: 0, scale: 0.2 }}
          animate={{ opacity: [0, 0.6, 0], scale: [0.2, 1.6, 2.1] }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
      );
    case "rise":
      return (
        <motion.div
          className="absolute inset-x-0 bottom-0 h-2/3"
          style={{ background: `linear-gradient(to top, ${color}40, transparent)` }}
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: [0, 0.5, 0], y: [60, -80] }}
          transition={{ duration: 2.6, ease: "easeOut" }}
        />
      );
    case "fall":
      return (
        <motion.div
          className="absolute inset-x-0 top-0 h-2/3"
          style={{
            background: `linear-gradient(to bottom, ${color}4d, transparent)`,
          }}
          initial={{ opacity: 0, y: -60 }}
          animate={{ opacity: [0, 0.55, 0.2, 0], y: [-60, 80] }}
          transition={{ duration: 2.6, ease: "easeInOut" }}
        />
      );
    case "bloom":
      return (
        <motion.div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 50% 55%, ${color}59 0%, transparent 60%)`,
          }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: [0, 0.7, 0.25, 0], scale: [0.6, 1.1, 1] }}
          transition={{ duration: 3, ease: "easeOut" }}
        />
      );
    case "shimmer":
      return (
        <motion.div
          className="absolute inset-y-0 w-1/2"
          style={{
            background: `linear-gradient(100deg, transparent, ${color}4d, transparent)`,
          }}
          initial={{ x: "-120%", opacity: 0 }}
          animate={{ x: "240%", opacity: [0, 0.8, 0] }}
          transition={{ duration: 2.2, ease: "easeInOut" }}
        />
      );
    case "expand":
      return (
        <motion.div
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: 80,
            height: 80,
            marginLeft: -40,
            marginTop: -40,
            border: `2px solid ${color}`,
          }}
          initial={{ opacity: 0.6, scale: 0.2 }}
          animate={{ opacity: 0, scale: 7 }}
          transition={{ duration: 2.6, ease: "easeOut" }}
        />
      );
    case "contract":
      return (
        <motion.div
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: 80,
            height: 80,
            marginLeft: -40,
            marginTop: -40,
            border: `2px solid ${color}`,
          }}
          initial={{ opacity: 0, scale: 7 }}
          animate={{ opacity: [0, 0.6, 0], scale: 0.2 }}
          transition={{ duration: 2.6, ease: "easeIn" }}
        />
      );
    case "split":
      return (
        <>
          <motion.div
            className="absolute top-[28%] bottom-[28%] left-1/2 w-px"
            style={{ background: color }}
            initial={{ x: 0, opacity: 0 }}
            animate={{ x: -90, opacity: [0, 0.6, 0] }}
            transition={{ duration: 2.2, ease: "easeOut" }}
          />
          <motion.div
            className="absolute top-[28%] bottom-[28%] left-1/2 w-px"
            style={{ background: color }}
            initial={{ x: 0, opacity: 0 }}
            animate={{ x: 90, opacity: [0, 0.6, 0] }}
            transition={{ duration: 2.2, ease: "easeOut" }}
          />
        </>
      );
    case "warm":
      return (
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 60%, var(--lo1-gold) 0%, transparent 65%)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.35, 0.12, 0] }}
          transition={{ duration: 3.5, ease: "easeInOut" }}
        />
      );
  }
}
