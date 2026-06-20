"use client";

import { motion } from "framer-motion";
import { type SceneProps } from "../DensityScene";

// A deterministic, lightly-skewed lattice of nodes.
const NODES = Array.from({ length: 4 }, (_, r) =>
  Array.from({ length: 5 }, (_, c) => ({
    x: 12 + c * 19 + (r % 2 ? 6 : 0),
    y: 18 + r * 22,
  }))
).flat();

// The one node that stays dark — "I can hold the shape of everything / and warm not even one."
const DARK_NODE = 9;

/**
 * Song 5 — "Cold Light" (5th density). A crystalline lattice shimmers coldly;
 * one node never lights. Wisdom that illuminates everything and warms nothing.
 */
export default function LatticeScene({ color, reducedMotion }: SceneProps) {
  return (
    <div
      className="absolute inset-0"
      style={{
        background: `radial-gradient(ellipse at 50% 40%, ${color}14 0%, transparent 60%), var(--lo1-deep-space)`,
      }}
    >
      <motion.svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
        animate={reducedMotion ? {} : { opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      >
        {NODES.map((n, i) =>
          NODES.slice(i + 1).map((m, j) => {
            if (Math.hypot(n.x - m.x, n.y - m.y) > 24) return null;
            return (
              <line
                key={`${i}-${j}`}
                x1={n.x}
                y1={n.y}
                x2={m.x}
                y2={m.y}
                stroke={color}
                strokeOpacity={0.18}
                strokeWidth={0.3}
              />
            );
          })
        )}
        {NODES.map((n, i) => (
          <circle
            key={i}
            cx={n.x}
            cy={n.y}
            r={i === DARK_NODE ? 1.1 : 0.9}
            fill={i === DARK_NODE ? "transparent" : color}
            fillOpacity={0.7}
            stroke={i === DARK_NODE ? color : "none"}
            strokeOpacity={i === DARK_NODE ? 0.5 : 0}
            strokeWidth={0.4}
          />
        ))}
      </motion.svg>
    </div>
  );
}
