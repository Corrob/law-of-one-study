import {
  QUOTE_MARKER_REGEX,
  couldBePartialMarker,
  MAX_PARTIAL_MARKER_LENGTH,
} from "../quote-markers";

describe("chat/quote-markers", () => {
  describe("QUOTE_MARKER_REGEX", () => {
    describe("simple markers", () => {
      it("should match simple quote marker", () => {
        const match = "{{QUOTE:1}}".match(QUOTE_MARKER_REGEX);
        expect(match).not.toBeNull();
        expect(match![1]).toBe("1"); // quote index
        expect(match![2]).toBeUndefined(); // no start sentence
        expect(match![3]).toBeUndefined(); // no end sentence
      });

      it("should match multi-digit quote index", () => {
        const match = "{{QUOTE:42}}".match(QUOTE_MARKER_REGEX);
        expect(match).not.toBeNull();
        expect(match![1]).toBe("42");
      });

      it("should match quote index 0", () => {
        const match = "{{QUOTE:0}}".match(QUOTE_MARKER_REGEX);
        expect(match).not.toBeNull();
        expect(match![1]).toBe("0");
      });
    });

    describe("range markers", () => {
      it("should match range marker with sentence range", () => {
        const match = "{{QUOTE:1:s3:s7}}".match(QUOTE_MARKER_REGEX);
        expect(match).not.toBeNull();
        expect(match![1]).toBe("1"); // quote index
        expect(match![2]).toBe("3"); // start sentence
        expect(match![3]).toBe("7"); // end sentence
      });

      it("should match range marker with multi-digit sentences", () => {
        const match = "{{QUOTE:5:s12:s25}}".match(QUOTE_MARKER_REGEX);
        expect(match).not.toBeNull();
        expect(match![1]).toBe("5");
        expect(match![2]).toBe("12");
        expect(match![3]).toBe("25");
      });

      it("should match range marker starting at sentence 0", () => {
        const match = "{{QUOTE:2:s0:s5}}".match(QUOTE_MARKER_REGEX);
        expect(match).not.toBeNull();
        expect(match![2]).toBe("0");
        expect(match![3]).toBe("5");
      });
    });

    describe("non-matches", () => {
      it("should not match incomplete markers", () => {
        expect("{{QUOTE:1}".match(QUOTE_MARKER_REGEX)).toBeNull();
        expect("{{QUOTE:".match(QUOTE_MARKER_REGEX)).toBeNull();
        expect("{QUOTE:1}}".match(QUOTE_MARKER_REGEX)).toBeNull();
      });

      it("should not match markers with invalid format", () => {
        expect("{{QUOTE:}}".match(QUOTE_MARKER_REGEX)).toBeNull();
        expect("{{QUOTE:abc}}".match(QUOTE_MARKER_REGEX)).toBeNull();
        expect("{{quote:1}}".match(QUOTE_MARKER_REGEX)).toBeNull();
      });

      it("should not match incomplete range markers", () => {
        expect("{{QUOTE:1:s3}}".match(QUOTE_MARKER_REGEX)).toBeNull();
        expect("{{QUOTE:1:s3:}}".match(QUOTE_MARKER_REGEX)).toBeNull();
        expect("{{QUOTE:1:3:7}}".match(QUOTE_MARKER_REGEX)).toBeNull();
      });
    });

    describe("extraction from text", () => {
      it("should extract marker from surrounding text", () => {
        const text = "This is a quote: {{QUOTE:2}} from Ra.";
        const match = text.match(QUOTE_MARKER_REGEX);
        expect(match).not.toBeNull();
        expect(match![1]).toBe("2");
      });

      it("should extract range marker from surrounding text", () => {
        const text = "Here is an excerpt {{QUOTE:3:s1:s4}} of the response.";
        const match = text.match(QUOTE_MARKER_REGEX);
        expect(match).not.toBeNull();
        expect(match![1]).toBe("3");
        expect(match![2]).toBe("1");
        expect(match![3]).toBe("4");
      });
    });
  });

  describe("couldBePartialMarker", () => {
    describe("static prefixes", () => {
      it("should return true for opening brace", () => {
        expect(couldBePartialMarker("{")).toBe(true);
      });

      it("should return true for double opening brace", () => {
        expect(couldBePartialMarker("{{")).toBe(true);
      });

      it("should return true for partial QUOTE keyword", () => {
        expect(couldBePartialMarker("{{Q")).toBe(true);
        expect(couldBePartialMarker("{{QU")).toBe(true);
        expect(couldBePartialMarker("{{QUO")).toBe(true);
        expect(couldBePartialMarker("{{QUOT")).toBe(true);
        expect(couldBePartialMarker("{{QUOTE")).toBe(true);
      });

      it("should return true for QUOTE with colon", () => {
        expect(couldBePartialMarker("{{QUOTE:")).toBe(true);
      });
    });

    describe("quote index in progress", () => {
      it("should return true for single digit index", () => {
        expect(couldBePartialMarker("{{QUOTE:1")).toBe(true);
      });

      it("should return true for multi-digit index", () => {
        expect(couldBePartialMarker("{{QUOTE:12")).toBe(true);
        expect(couldBePartialMarker("{{QUOTE:123")).toBe(true);
      });

      it("should return true for index with single closing brace", () => {
        expect(couldBePartialMarker("{{QUOTE:1}")).toBe(true);
        expect(couldBePartialMarker("{{QUOTE:42}")).toBe(true);
      });
    });

    describe("sentence range in progress", () => {
      it("should return true for colon after index", () => {
        expect(couldBePartialMarker("{{QUOTE:1:")).toBe(true);
      });

      it("should return true for 's' prefix", () => {
        expect(couldBePartialMarker("{{QUOTE:1:s")).toBe(true);
      });

      it("should return true for start sentence number", () => {
        expect(couldBePartialMarker("{{QUOTE:1:s3")).toBe(true);
        expect(couldBePartialMarker("{{QUOTE:1:s12")).toBe(true);
      });

      it("should return true for colon after start sentence", () => {
        expect(couldBePartialMarker("{{QUOTE:1:s3:")).toBe(true);
      });

      it("should return true for 's' prefix for end sentence", () => {
        expect(couldBePartialMarker("{{QUOTE:1:s3:s")).toBe(true);
      });

      it("should return true for end sentence number", () => {
        expect(couldBePartialMarker("{{QUOTE:1:s3:s7")).toBe(true);
        expect(couldBePartialMarker("{{QUOTE:1:s3:s15")).toBe(true);
      });

      it("should return true for range with single closing brace", () => {
        expect(couldBePartialMarker("{{QUOTE:1:s3:s7}")).toBe(true);
      });
    });

    describe("complete markers (should return false)", () => {
      it("should return false for complete simple marker", () => {
        expect(couldBePartialMarker("{{QUOTE:1}}")).toBe(false);
      });

      it("should return false for complete range marker", () => {
        expect(couldBePartialMarker("{{QUOTE:1:s3:s7}}")).toBe(false);
      });
    });

    describe("non-markers (should return false)", () => {
      it("should return false for regular text", () => {
        expect(couldBePartialMarker("Hello")).toBe(false);
        expect(couldBePartialMarker("World")).toBe(false);
      });

      it("should return false for empty string", () => {
        expect(couldBePartialMarker("")).toBe(false);
      });

      it("should return false for wrong prefix", () => {
        expect(couldBePartialMarker("{{Q1")).toBe(false);
        expect(couldBePartialMarker("{{OTHER")).toBe(false);
        expect(couldBePartialMarker("[[QUOTE")).toBe(false);
      });

      it("should return false for lowercase quote", () => {
        expect(couldBePartialMarker("{{quote")).toBe(false);
        expect(couldBePartialMarker("{{Quote")).toBe(false);
      });

      it("should return false for single brace followed by text", () => {
        expect(couldBePartialMarker("{hello")).toBe(false);
      });
    });

    describe("edge cases", () => {
      it("should handle index 0", () => {
        expect(couldBePartialMarker("{{QUOTE:0")).toBe(true);
        expect(couldBePartialMarker("{{QUOTE:0}")).toBe(true);
      });

      it("should handle sentence 0", () => {
        expect(couldBePartialMarker("{{QUOTE:1:s0")).toBe(true);
        expect(couldBePartialMarker("{{QUOTE:1:s0:s")).toBe(true);
      });
    });
  });

  describe("MAX_PARTIAL_MARKER_LENGTH", () => {
    it("should be at least as long as longest possible partial marker", () => {
      // Longest partial: "{{QUOTE:99:s99:s99}" = 20 chars
      const longestPartial = "{{QUOTE:99:s99:s99}";
      expect(MAX_PARTIAL_MARKER_LENGTH).toBeGreaterThanOrEqual(
        longestPartial.length
      );
    });

    it("should be 25 (documented value)", () => {
      expect(MAX_PARTIAL_MARKER_LENGTH).toBe(25);
    });
  });

  describe("integration scenarios", () => {
    it("should correctly identify split marker scenario", () => {
      // Simulating a marker split across chunks
      const chunk1 = "Here is the quote {{QUOTE:";
      const chunk2 = "5:s3:s10}}";

      // Check if end of chunk1 could be partial
      const possiblePartial = "{{QUOTE:";
      expect(couldBePartialMarker(possiblePartial)).toBe(true);

      // After combining, should match complete marker
      const combined = chunk1 + chunk2;
      expect(combined.match(QUOTE_MARKER_REGEX)).not.toBeNull();
    });

    it("should handle progressive marker building", () => {
      // Simulate character-by-character streaming
      const marker = "{{QUOTE:3:s1:s5}}";
      for (let i = 1; i < marker.length; i++) {
        const partial = marker.slice(0, i);
        const isPartial = couldBePartialMarker(partial);

        // All prefixes except the complete marker should be partial
        if (i < marker.length) {
          expect(isPartial).toBe(true);
        }
      }

      // Complete marker should not be partial
      expect(couldBePartialMarker(marker)).toBe(false);
    });
  });
});
