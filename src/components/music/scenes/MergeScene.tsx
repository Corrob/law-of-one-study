"use client";

import { motion } from "framer-motion";
import { type SceneProps } from "../DensityScene";

const R = 16; // circle radius (viewBox units)
// Flower-of-life: a center circle ringed by six, computed deterministically.
const CENTERS = [
  { x: 50, y: 50 },
  ...Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i;
    return { x: 50 + Math.cos(a) * R, y: 50 + Math.sin(a) * R };
  }),
];

/**
 * Song 4 — "Known" (4th density). Overlapping circles of light breathe as one
 * — many hearts becoming transparent to one another (the social memory complex).
 */
export default function MergeScene({ color, reducedMotion }: SceneProps) {
  return (
    <div
      className="absolute inset-0"
      style={{
        background: `radial-gradient(ellipse at 50% 50%, ${color}1f 0%, transparent 60%), var(--lo1-deep-space)`,
      }}
    >
      <motion.svg
        viewBox="0 0 100 100"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] max-w-[420px] aspect-square"
        aria-hidden="true"
        animate={
          reducedMotion ? {} : { scale: [1, 1.04, 1], opacity: [0.7, 1, 0.7] }
        }
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        {CENTERS.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={R}
            fill="none"
            stroke={color}
            strokeOpacity={0.35}
            strokeWidth={0.5}
          />
        ))}
        <circle cx="50" cy="50" r="2" fill="var(--lo1-white)" />
      </motion.svg>
    </div>
  );
}
