import {
  getRaMaterialUrl,
  getRaMaterialUrlFromReference,
  formatQuoteWithAttribution,
} from "../quote-utils";

describe("quote-utils", () => {
  describe("getRaMaterialUrl", () => {
    it("should generate English URL", () => {
      expect(getRaMaterialUrl(20, 1, "en")).toBe(
        "https://www.llresearch.org/channeling/ra-contact/20#1"
      );
    });

    it("should generate Spanish URL", () => {
      expect(getRaMaterialUrl(20, 1, "es")).toBe(
        "https://www.llresearch.org/es/channeling/ra-contact/20#1"
      );
    });

    it("should handle session-only URL", () => {
      expect(getRaMaterialUrl(20, undefined, "en")).toBe(
        "https://www.llresearch.org/channeling/ra-contact/20"
      );
    });

    it("should default to English", () => {
      expect(getRaMaterialUrl(20, 1)).toBe(
        "https://www.llresearch.org/channeling/ra-contact/20#1"
      );
    });
  });

  describe("getRaMaterialUrlFromReference", () => {
    it("should parse simple reference", () => {
      expect(getRaMaterialUrlFromReference("20.1")).toBe(
        "https://www.llresearch.org/channeling/ra-contact/20#1"
      );
    });

    it("should parse Ra-prefixed reference", () => {
      expect(getRaMaterialUrlFromReference("Ra 20.1")).toBe(
        "https://www.llresearch.org/channeling/ra-contact/20#1"
      );
    });

    it("should return base URL for invalid reference", () => {
      expect(getRaMaterialUrlFromReference("invalid")).toBe(
        "https://www.llresearch.org/channeling/ra-contact"
      );
    });

    it("should handle locale", () => {
      expect(getRaMaterialUrlFromReference("20.1", "es")).toBe(
        "https://www.llresearch.org/es/channeling/ra-contact/20#1"
      );
    });
  });

  describe("formatQuoteWithAttribution", () => {
    it("should format quote with attribution and URL", () => {
      const result = formatQuoteWithAttribution(
        "I am Ra.",
        "Ra 1.1",
        "https://www.llresearch.org/channeling/ra-contact/1#1"
      );
      expect(result).toBe(
        '"I am Ra."\n— Ra 1.1\n\nhttps://www.llresearch.org/channeling/ra-contact/1#1'
      );
    });
  });
});
