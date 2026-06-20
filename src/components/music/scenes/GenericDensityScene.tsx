"use client";

import { motion } from "framer-motion";
import { seededParticles } from "./particles";
import { type SceneProps } from "../DensityScene";

const PARTICLES = seededParticles(26, 2);

/**
 * Fallback scene for densities without a bespoke visual (Songs 2–5 for now):
 * a density-tinted wash with slowly drifting motes.
 */
export default function GenericDensityScene({ color, reducedMotion }: SceneProps) {
  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 40%, ${color}22 0%, transparent 60%), radial-gradient(ellipse at 50% 110%, ${color}14 0%, transparent 55%), var(--lo1-deep-space)`,
        }}
      />
      {PARTICLES.map((p) =>
        reducedMotion ? (
          <span
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              background: color,
              opacity: 0.25,
            }}
          />
        ) : (
          <motion.span
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              background: color,
            }}
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 0.5, 0], y: -60 }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )
      )}
    </div>
  );
}
