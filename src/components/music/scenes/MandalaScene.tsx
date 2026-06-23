"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { type SceneProps } from "../DensityScene";

/**
 * Song 6 — "A Million Years Ahead" (6th density). A slowly rotating mandala of
 * unified light. Owns the two cued moments:
 *  - "higher-self-reveal" → a brief flash-back to Song 3's veil palette
 *    (indigo + amber), a visual memory mirroring the lyric/melodic callback.
 *  - "chorus-bloom" → a one-time euphoric bloom of the central gold glow.
 */
export default function MandalaScene({
  color,
  activeHint,
  reducedMotion,
}: SceneProps) {
  const [bloom, setBloom] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [motif, setMotif] = useState(false);

  // Trigger the cued states from the active lyric hint.
  useEffect(() => {
    if (activeHint === "chorus-bloom") setBloom(true);
    if (activeHint === "higher-self-reveal") setReveal(true);
    if (activeHint === "motif-return") setMotif(true);
  }, [activeHint]);

  // A gentle pulse when the opening motif returns, then settle.
  useEffect(() => {
    if (!motif) return;
    const id = setTimeout(() => setMotif(false), 3000);
    return () => clearTimeout(id);
  }, [motif]);

  // Auto-clear the reveal flash-back after ~7s. The timer is tied to `reveal`,
  // NOT to `activeHint` — otherwise the next line changing the hint would cancel
  // it and the overlay would stay up for the rest of the song.
  useEffect(() => {
    if (!reveal) return;
    const id = setTimeout(() => setReveal(false), 7000);
    return () => clearTimeout(id);
  }, [reveal]);

  // Let the one-shot bloom burst play, then resume the ambient glow pulse.
  useEffect(() => {
    if (!bloom) return;
    const id = setTimeout(() => setBloom(false), 3500);
    return () => clearTimeout(id);
  }, [bloom]);

  return (
    <div
      className="absolute inset-0"
      style={{
        background: `radial-gradient(ellipse at 50% 45%, ${color}1f 0%, transparent 60%), var(--lo1-deep-space)`,
      }}
    >
      {/* Rotating mandala */}
      <motion.div
        className="absolute left-1/2 top-1/2"
        style={{ width: 360, height: 360, marginLeft: -180, marginTop: -180 }}
        animate={
          reducedMotion
            ? {}
            : {
                rotate: 360,
                scale: bloom ? [1, 1.15, 1] : motif ? [1, 1.08, 1] : 1,
              }
        }
        transition={{
          rotate: { duration: 70, repeat: Infinity, ease: "linear" },
          scale: { duration: 2.5, ease: "easeInOut" },
        }}
      >
        <MandalaSVG color={color} />
      </motion.div>

      {/* Central gold bloom */}
      <motion.div
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: 300,
          height: 300,
          marginLeft: -150,
          marginTop: -150,
          background:
            "radial-gradient(circle, var(--lo1-gold) 0%, transparent 65%)",
        }}
        animate={
          reducedMotion
            ? { opacity: 0.16 }
            : { opacity: bloom ? [0.16, 0.5, 0.22] : [0.12, 0.2, 0.12] }
        }
        transition={{
          duration: bloom ? 3 : 6,
          repeat: bloom ? 0 : Infinity,
          ease: "easeInOut",
        }}
      />

      {/* "higher-self-reveal" — a memory of Song 3 (the veil) */}
      <AnimatePresence>
        {reveal && !reducedMotion && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            style={{
              background:
                "radial-gradient(ellipse at 50% 50%, rgba(129,140,248,0.22) 0%, rgba(251,191,36,0.10) 40%, transparent 70%)",
            }}
          >
            <ReachingArc />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Concentric rings + petals — a simple sacred-geometry mandala. */
function MandalaSVG({ color }: { color: string }) {
  const petals = Array.from({ length: 12 });
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full" aria-hidden="true">
      <g fill="none" stroke={color} strokeOpacity={0.35} strokeWidth={0.8}>
        <circle cx="100" cy="100" r="40" />
        <circle cx="100" cy="100" r="60" />
        <circle cx="100" cy="100" r="80" stroke="var(--lo1-gold)" strokeOpacity={0.4} />
        {petals.map((_, i) => (
          <ellipse
            key={i}
            cx="100"
            cy="60"
            rx="10"
            ry="34"
            transform={`rotate(${(360 / petals.length) * i} 100 100)`}
            stroke="var(--lo1-gold)"
            strokeOpacity={0.22}
          />
        ))}
      </g>
    </svg>
  );
}

/** A faint arc reaching toward the center — "the hand you couldn't see." */
function ReachingArc() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <motion.path
        d="M10,150 Q70,120 100,100"
        fill="none"
        stroke="rgba(232,230,242,0.5)"
        strokeWidth={1}
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
      />
      <motion.circle
        cx="100"
        cy="100"
        r="3"
        fill="var(--lo1-gold)"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.6, duration: 0.8 }}
      />
    </svg>
  );
}
