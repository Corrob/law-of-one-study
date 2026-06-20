"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { seededParticles } from "./particles";
import { type SceneProps } from "../DensityScene";

const SPARKS = seededParticles(18, 7);

/**
 * Song 1 — "First Breath" (1st density). A single ember ignites in the void
 * and slowly grows over the course of the song; sparks drift upward from it.
 * The growth is driven by playback progress via the audio clock.
 */
export default function EmberScene({
  color,
  reducedMotion,
  clock,
  durationSeconds,
}: SceneProps) {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reducedMotion) return;
    const unsubscribe = clock.subscribe((t) => {
      const progress = durationSeconds > 0 ? Math.min(t / durationSeconds, 1) : 0;
      const el = glowRef.current;
      if (el) {
        el.style.transform = `translate(-50%, -50%) scale(${0.6 + progress * 0.8})`;
        el.style.opacity = `${0.4 + progress * 0.5}`;
      }
    });
    return unsubscribe;
  }, [clock, durationSeconds, reducedMotion]);

  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse at 50% 60%, #1a0f08 0%, var(--lo1-deep-space) 70%)",
      }}
    >
      {/* The ember */}
      <div
        ref={glowRef}
        className="absolute left-1/2 top-[58%] rounded-full"
        style={{
          width: 180,
          height: 180,
          transform: "translate(-50%, -50%) scale(0.6)",
          opacity: 0.4,
          background: `radial-gradient(circle, ${color}cc 0%, ${color}55 35%, transparent 70%)`,
          filter: "blur(4px)",
        }}
      />

      {/* Rising sparks */}
      {!reducedMotion &&
        SPARKS.map((s) => (
          <motion.span
            key={s.id}
            className="absolute rounded-full"
            style={{
              left: `${35 + s.x * 0.3}%`,
              top: "60%",
              width: s.size * 0.7,
              height: s.size * 0.7,
              background: color,
            }}
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 0.9, 0], y: -140 - s.y }}
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
