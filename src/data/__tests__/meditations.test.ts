import { MEDITATIONS, getAudioPath, type Meditation } from "../meditations";

describe("MEDITATIONS", () => {
  it("contains three meditations", () => {
    expect(MEDITATIONS).toHaveLength(3);
  });

  it("has unique ids", () => {
    const ids = MEDITATIONS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has matching references and referenceUrls lengths", () => {
    for (const meditation of MEDITATIONS) {
      expect(meditation.references.length).toBe(
        meditation.referenceUrls.length
      );
    }
  });

  it("has valid referenceUrls pointing to lawofone.info", () => {
    for (const meditation of MEDITATIONS) {
      for (const url of meditation.referenceUrls) {
        expect(url).toMatch(/^https:\/\/lawofone\.info\/s\/\d+#\d+$/);
      }
    }
  });

  it("has positive durations", () => {
    for (const meditation of MEDITATIONS) {
      expect(meditation.durationSeconds).toBeGreaterThan(0);
    }
  });

  it("has audio files ending in .mp3", () => {
    for (const meditation of MEDITATIONS) {
      expect(meditation.audioFile).toMatch(/\.mp3$/);
    }
  });
});

describe("getAudioPath", () => {
  const meditation: Meditation = {
    id: "test",
    titleKey: "test",
    descriptionKey: "testDesc",
    quoteKey: "testQuote",
    references: [],
    referenceUrls: [],
    durationSeconds: 60,
    audioFile: "test-meditation.mp3",
  };

  it("returns root path for English locale", () => {
    expect(getAudioPath(meditation, "en")).toBe(
      "/meditations/test-meditation.mp3"
    );
  });

  it("returns locale-prefixed path for Spanish", () => {
    expect(getAudioPath(meditation, "es")).toBe(
      "/meditations/es/test-meditation.mp3"
    );
  });

  it("returns locale-prefixed path for French", () => {
    expect(getAudioPath(meditation, "fr")).toBe(
      "/meditations/fr/test-meditation.mp3"
    );
  });

  it("returns locale-prefixed path for German", () => {
    expect(getAudioPath(meditation, "de")).toBe(
      "/meditations/de/test-meditation.mp3"
    );
  });
});
