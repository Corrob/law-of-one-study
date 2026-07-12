import {
  buildRelatedResources,
  MEDITATION_CONCEPT_TAGS,
  SONG_CONCEPT_TAGS,
} from "../recommendations";
import { findConceptById } from "@/lib/concept-graph";
import { getAllPathMetas } from "@/lib/study-paths";

describe("buildRelatedResources", () => {
  it("returns no cards for empty input", () => {
    expect(buildRelatedResources([])).toEqual([]);
  });

  it("ignores unknown (supplement) ids entirely", () => {
    expect(buildRelatedResources(["supplement-only-id", "another-unknown"])).toEqual([]);
  });

  it("recommends the densities path and a density song for density questions", () => {
    const result = buildRelatedResources(["density", "third-density", "harvest"]);
    const types = result.map((r) => r.type);
    expect(types).toContain("path");
    expect(result.find((r) => r.type === "path")?.id).toBe("densities");
    expect(types).toContain("song");
  });

  it("recommends the balancing meditation for energy-center questions", () => {
    const result = buildRelatedResources(["energy-center", "balancing"]);
    expect(result.find((r) => r.type === "meditation")?.id).toBe("balancing-the-self");
  });

  it("caps at 3 cards with at most one per type, path first", () => {
    // A broad match set that hits paths, meditations, songs, and concepts.
    const result = buildRelatedResources([
      "density",
      "third-density",
      "harvest",
      "balancing",
      "energy-center",
      "love",
    ]);
    expect(result.length).toBeLessThanOrEqual(3);
    const types = result.map((r) => r.type);
    expect(new Set(types).size).toBe(types.length);
    expect(types[0]).toBe("path");
  });

  it("offers a related concept card the seeker has not already matched", () => {
    const result = buildRelatedResources(["wanderer"]);
    const conceptCard = result.find((r) => r.type === "concept");
    if (conceptCard) {
      expect(conceptCard.id).not.toBe("wanderer");
      expect(findConceptById(conceptCard.id)).toBeDefined();
      expect(conceptCard.href).toBe(`/explore?concept=${conceptCard.id}`);
    }
  });

  it("localizes card titles", () => {
    const en = buildRelatedResources(["density", "third-density"], "en");
    const es = buildRelatedResources(["density", "third-density"], "es");
    expect(en.length).toBe(es.length);
    const enPath = en.find((r) => r.type === "path");
    const esPath = es.find((r) => r.type === "path");
    expect(enPath?.id).toBe(esPath?.id);
    expect(enPath?.title).not.toBe(esPath?.title);
  });

  it("is deterministic", () => {
    const a = buildRelatedResources(["catalyst", "polarity"]);
    const b = buildRelatedResources(["catalyst", "polarity"]);
    expect(a).toEqual(b);
  });

  it("every curated tag is a real concept-graph id and every resource is reachable", () => {
    const tagMaps = { ...MEDITATION_CONCEPT_TAGS, ...SONG_CONCEPT_TAGS };
    for (const [resourceId, tags] of Object.entries(tagMaps)) {
      for (const tag of tags) {
        expect(findConceptById(tag)).toBeDefined();
      }
      // Each resource must actually surface when its own tags are matched.
      const result = buildRelatedResources(tags);
      expect(result.map((r) => r.id)).toContain(resourceId);
    }
  });

  it("path concepts referenced by study paths are matchable", () => {
    // Sanity: study-path concept lists intersect the graph, so path cards can fire.
    const allPathConcepts = getAllPathMetas("en").flatMap((p) => p.concepts);
    expect(allPathConcepts.some((c) => findConceptById(c))).toBe(true);
  });
});
