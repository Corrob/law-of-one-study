"use client";

import { motion } from "framer-motion";
import { seededParticles } from "./particles";
import { type SceneProps } from "../DensityScene";

const SPORES = seededParticles(20, 3);
const TENDRILS = [-28, -10, 8, 26]; // base x-offsets (%) from center

/**
 * Song 2 — "The Reaching" (2nd density). Tendrils grow upward toward a light
 * they cannot reach; spores drift up. Growth/striving toward the source.
 */
export default function GrowthScene({ color, reducedMotion }: SceneProps) {
  return (
    <div
      className="absolute inset-0"
      style={{
        background: `radial-gradient(ellipse at 50% 16%, ${color}26 0%, transparent 55%), radial-gradient(ellipse at 50% 120%, #14210f 0%, var(--lo1-deep-space) 70%)`,
      }}
    >
      {/* the light they reach toward */}
      <div
        className="absolute left-1/2 top-[14%] -translate-x-1/2 rounded-full"
        style={{
          width: 160,
          height: 160,
          background: `radial-gradient(circle, ${color}55 0%, transparent 70%)`,
          filter: "blur(6px)",
        }}
      />

      {/* tendrils */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        {TENDRILS.map((dx, i) => {
          const x = 50 + dx;
          const bend = i % 2 ? 8 : -8;
          const d = `M${x},100 C${x + bend},70 ${x - bend},45 ${50 + dx * 0.3},18`;
          return (
            <motion.path
              key={i}
              d={d}
              fill="none"
              stroke={color}
              strokeOpacity={0.4}
              strokeWidth={0.6}
              strokeLinecap="round"
              initial={reducedMotion ? false : { pathLength: 0 }}
              animate={reducedMotion ? {} : { pathLength: 1 }}
              transition={{ duration: 3 + i, ease: "easeOut" }}
            />
          );
        })}
      </svg>

      {/* rising spores */}
      {!reducedMotion &&
        SPORES.map((s) => (
          <motion.span
            key={s.id}
            className="absolute rounded-full"
            style={{
              left: `${s.x}%`,
              top: `${60 + s.y * 0.4}%`,
              width: s.size * 0.6,
              height: s.size * 0.6,
              background: color,
            }}
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 0.6, 0], y: -120 }}
            transition={{
              duration: s.duration,
              delay: s.delay,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        ))}
    </div>
  );
}
