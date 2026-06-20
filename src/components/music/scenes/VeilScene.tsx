"use client";

import { motion } from "framer-motion";
import { type SceneProps } from "../DensityScene";

/**
 * Song 3 — "Behind the Veil" (3rd density). A shimmering veil drifts across
 * the field; two paths diverge from a single choice-point (service-to-others
 * vs service-to-self).
 */
export default function VeilScene({ color, reducedMotion }: SceneProps) {
  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse at 50% 50%, rgba(129,140,248,0.14) 0%, transparent 60%), var(--lo1-deep-space)",
      }}
    >
      {/* shimmering veil (transform-based) */}
      <motion.div
        className="absolute top-0 bottom-0 -left-1/2 w-[200%]"
        style={{
          background: `linear-gradient(100deg, transparent 30%, ${color}33 50%, transparent 70%)`,
        }}
        animate={reducedMotion ? {} : { x: ["0%", "25%", "0%"] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* two diverging paths + the choice-point */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        <line
          x1="50"
          y1="100"
          x2="22"
          y2="20"
          stroke={color}
          strokeOpacity={0.35}
          strokeWidth={0.5}
        />
        <line
          x1="50"
          y1="100"
          x2="78"
          y2="20"
          stroke="#818cf8"
          strokeOpacity={0.35}
          strokeWidth={0.5}
        />
        <circle cx="50" cy="62" r="1.6" fill={color} fillOpacity={0.8} />
      </svg>
    </div>
  );
}
