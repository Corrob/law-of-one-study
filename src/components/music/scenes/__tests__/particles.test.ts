import { seededParticles, ringParticles } from "../particles";

describe("seededParticles", () => {
  it("returns the requested count", () => {
    expect(seededParticles(10).length).toBe(10);
  });

  it("is deterministic for a given seed (SSR-safe)", () => {
    expect(seededParticles(5, 3)).toEqual(seededParticles(5, 3));
  });

  it("differs across seeds", () => {
    expect(seededParticles(5, 1)).not.toEqual(seededParticles(5, 2));
  });

  it("keeps x/y within 0–100%", () => {
    for (const p of seededParticles(40)) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(100);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(100);
    }
  });

  it("produces positive size and duration", () => {
    for (const p of seededParticles(20)) {
      expect(p.size).toBeGreaterThan(0);
      expect(p.duration).toBeGreaterThan(0);
    }
  });
});

describe("ringParticles", () => {
  it("returns the requested count and stays on-screen", () => {
    const points = ringParticles(24, 5);
    expect(points.length).toBe(24);
    for (const p of points) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(100);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(100);
    }
  });

  it("is deterministic for a given seed", () => {
    expect(ringParticles(8, 2)).toEqual(ringParticles(8, 2));
  });
});
