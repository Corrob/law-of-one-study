import {
  absoluteResourceUrl,
  buildResourceInventory,
  getRelatedResource,
  isKnownResource,
  isResourceType,
  resourceHref,
  resourceTitle,
} from "../resources";
import { MEDITATIONS } from "@/data/meditations";
import { ALBUM } from "@/data/music/album";
import { getAllPathMetas } from "@/lib/study-paths";
import { getAllConcepts } from "@/lib/concept-graph";

describe("resources registry", () => {
  describe("drift guards (registry must cover every real resource)", () => {
    it("contains every meditation id", () => {
      for (const m of MEDITATIONS) {
        expect(isKnownResource("meditation", m.id)).toBe(true);
      }
    });

    it("contains every song id", () => {
      for (const s of ALBUM.songs) {
        expect(isKnownResource("song", s.id)).toBe(true);
      }
    });

    it("contains every study path id", () => {
      for (const p of getAllPathMetas("en")) {
        expect(isKnownResource("path", p.id)).toBe(true);
      }
    });

    it("contains every concept id", () => {
      for (const c of getAllConcepts()) {
        expect(isKnownResource("concept", c.id)).toBe(true);
      }
    });
  });

  describe("isResourceType / isKnownResource", () => {
    it("rejects unknown types and ids", () => {
      expect(isResourceType("video")).toBe(false);
      expect(isKnownResource("video", "balancing-the-self")).toBe(false);
      expect(isKnownResource("meditation", "not-a-real-id")).toBe(false);
    });
  });

  describe("resourceHref", () => {
    it("builds well-formed locale-neutral hrefs per type", () => {
      expect(resourceHref("meditation", "balancing-the-self")).toBe(
        "/meditate?meditation=balancing-the-self"
      );
      expect(resourceHref("song", "gateway")).toBe("/listen?song=gateway");
      expect(resourceHref("path", "densities")).toBe("/paths/densities");
      expect(resourceHref("concept", "harvest")).toBe("/explore?concept=harvest");
    });
  });

  describe("resourceTitle", () => {
    it("returns the localized title", () => {
      expect(resourceTitle("meditation", "finding-love", "en")).toBe(
        "Finding Love in the Moment"
      );
      expect(resourceTitle("meditation", "finding-love", "es")).toBe(
        "Encontrar el Amor en el Momento"
      );
    });

    it("returns undefined for unknown ids", () => {
      expect(resourceTitle("meditation", "nope")).toBeUndefined();
    });
  });

  describe("absoluteResourceUrl", () => {
    it("is unprefixed for English and prefixed for other locales", () => {
      expect(absoluteResourceUrl("path", "densities", "en")).toBe(
        "https://lawofone.study/paths/densities"
      );
      expect(absoluteResourceUrl("song", "gateway", "fr")).toBe(
        "https://lawofone.study/fr/listen?song=gateway"
      );
    });
  });

  describe("getRelatedResource", () => {
    it("resolves title, description, and href for a locale", () => {
      const resource = getRelatedResource("song", "gateway", "de");
      expect(resource).toMatchObject({ type: "song", id: "gateway", href: "/listen?song=gateway" });
      expect(resource?.title.length).toBeGreaterThan(0);
      expect(resource?.description?.length).toBeGreaterThan(0);
    });

    it("returns undefined for unknown ids", () => {
      expect(getRelatedResource("path", "nope")).toBeUndefined();
    });
  });

  describe("buildResourceInventory", () => {
    it("lists every meditation, song, and path — and no concepts", () => {
      const inventory = buildResourceInventory("en");
      for (const m of MEDITATIONS) expect(inventory).toContain(`meditation:${m.id}`);
      for (const s of ALBUM.songs) expect(inventory).toContain(`song:${s.id}`);
      for (const p of getAllPathMetas("en")) expect(inventory).toContain(`path:${p.id}`);
      expect(inventory).not.toContain("concept:");
    });

    it("localizes titles", () => {
      expect(buildResourceInventory("es")).toContain("Encontrar el Amor en el Momento");
    });
  });
});
