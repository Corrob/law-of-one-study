"use client";

import { useEffect, useRef } from "react";
import { ringParticles } from "./particles";
import { type SceneProps } from "../DensityScene";

const POINTS = ringParticles(40, 11);

/**
 * Song 7 — "Gateway" (7th density). A field of points ("the many") converges
 * to a single point of light ("to one") as the song progresses, leaving one
 * bright seed at the center — which mirrors Song 1's opening ember to complete
 * the octave loop. Progression is driven by the audio clock.
 */
export default function DissolveScene({
  color,
  reducedMotion,
  clock,
  durationSeconds,
}: SceneProps) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const pointRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reducedMotion) return;
    const unsubscribe = clock.subscribe((t) => {
      const progress = durationSeconds > 0 ? Math.min(t / durationSeconds, 1) : 0;
      const field = fieldRef.current;
      const point = pointRef.current;
      if (field) {
        // The many fall to one: the whole field collapses toward center.
        field.style.transform = `scale(${1 - progress * 0.95})`;
        field.style.opacity = `${1 - progress * 0.7}`;
      }
      if (point) {
        point.style.opacity = `${0.2 + progress * 0.8}`;
        point.style.transform = `translate(-50%, -50%) scale(${0.6 + progress * 0.8})`;
      }
    });
    return unsubscribe;
  }, [clock, durationSeconds, reducedMotion]);

  return (
    <div
      className="absolute inset-0"
      style={{
        background: `radial-gradient(ellipse at 50% 50%, ${color}14 0%, transparent 60%), var(--lo1-deep-space)`,
      }}
    >
      {/* The field of "many" points */}
      <div
        ref={fieldRef}
        className="absolute inset-0"
        style={{ transformOrigin: "50% 50%", opacity: reducedMotion ? 0.5 : 1 }}
      >
        {POINTS.map((p) => (
          <span
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              background: color,
              opacity: 0.55,
            }}
          />
        ))}
      </div>

      {/* The single point of light at the center */}
      <div
        ref={pointRef}
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: 60,
          height: 60,
          transform: "translate(-50%, -50%) scale(0.6)",
          opacity: reducedMotion ? 0.7 : 0.2,
          background:
            "radial-gradient(circle, var(--lo1-white) 0%, var(--lo1-gold) 40%, transparent 75%)",
        }}
      />
    </div>
  );
}
