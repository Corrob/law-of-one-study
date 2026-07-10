import { pickRandomStarters, STARTER_DISPLAY_COUNT } from "../starters";

describe("pickRandomStarters", () => {
  const pool = Array.from({ length: 20 }, (_, i) => `q${i}`);

  it("returns the requested count when the pool is large enough", () => {
    expect(pickRandomStarters(pool, 5)).toHaveLength(5);
  });

  it("defaults to STARTER_DISPLAY_COUNT", () => {
    expect(pickRandomStarters(pool)).toHaveLength(STARTER_DISPLAY_COUNT);
  });

  it("returns the whole pool (not more) when count exceeds pool size", () => {
    const small = ["a", "b"];
    expect(pickRandomStarters(small, 5).sort()).toEqual(["a", "b"]);
  });

  it("never returns duplicates", () => {
    const picked = pickRandomStarters(pool, 10);
    expect(new Set(picked).size).toBe(picked.length);
  });

  it("only returns items from the pool", () => {
    for (const item of pickRandomStarters(pool, 8)) {
      expect(pool).toContain(item);
    }
  });

  it("does not mutate the input pool", () => {
    const original = [...pool];
    pickRandomStarters(pool, 5);
    expect(pool).toEqual(original);
  });

  it("handles an empty pool", () => {
    expect(pickRandomStarters([], 5)).toEqual([]);
  });
});
