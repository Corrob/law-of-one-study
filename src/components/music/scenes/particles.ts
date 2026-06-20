/**
 * Deterministic particle layouts for the density scenes.
 *
 * Uses a seeded hash (not Math.random) so server and client render identical
 * markup — no hydration mismatch — and so a given scene always looks the same.
 */

export interface Particle {
  id: number;
  /** 0–100 (% of container) */
  x: number;
  y: number;
  /** px */
  size: number;
  /** seconds */
  delay: number;
  duration: number;
}

/** Fractional part of a large sine — a classic stable pseudo-random hash. */
function hash(n: number): number {
  const s = Math.sin(n) * 43758.5453;
  return s - Math.floor(s);
}

export function seededParticles(count: number, seed = 1): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const r = (k: number) => hash((i + 1) * 12.9898 + seed * 78.233 + k);
    return {
      id: i,
      x: r(1) * 100,
      y: r(2) * 100,
      size: 2 + r(3) * 5,
      delay: r(4) * 4,
      duration: 6 + r(5) * 6,
    };
  });
}

/** Particles placed evenly on a ring (for convergence/dissolution effects). */
export function ringParticles(count: number, seed = 1): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const r = (k: number) => hash((i + 1) * 9.123 + seed * 41.77 + k);
    const angle = (i / count) * Math.PI * 2;
    const radius = 30 + r(1) * 15; // % from center
    return {
      id: i,
      x: 50 + Math.cos(angle) * radius,
      y: 50 + Math.sin(angle) * radius,
      size: 2 + r(2) * 4,
      delay: r(3) * 3,
      duration: 5 + r(4) * 5,
    };
  });
}
