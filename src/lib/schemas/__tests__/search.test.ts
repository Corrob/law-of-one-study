import { parseSearchRequest, SearchRequestSchema, SearchModeSchema } from "../search";

describe("SearchModeSchema", () => {
  it("should accept 'sentence' as valid mode", () => {
    const result = SearchModeSchema.safeParse("sentence");
    expect(result.success).toBe(true);
  });

  it("should accept 'passage' as valid mode", () => {
    const result = SearchModeSchema.safeParse("passage");
    expect(result.success).toBe(true);
  });

  it("should reject invalid mode values", () => {
    const result = SearchModeSchema.safeParse("invalid");
    expect(result.success).toBe(false);
  });
});

describe("SearchRequestSchema", () => {
  it("should validate a valid search request", () => {
    const result = SearchRequestSchema.safeParse({
      query: "What is the Law of One?",
      limit: 10,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.query).toBe("What is the Law of One?");
      expect(result.data.limit).toBe(10);
    }
  });

  it("should use default limit when not provided", () => {
    const result = SearchRequestSchema.safeParse({
      query: "densities",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
    }
  });

  it("should default to passage mode when not provided", () => {
    const result = SearchRequestSchema.safeParse({
      query: "densities",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mode).toBe("passage");
    }
  });

  it("should accept sentence mode", () => {
    const result = SearchRequestSchema.safeParse({
      query: "You are infinity",
      mode: "sentence",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mode).toBe("sentence");
    }
  });

  it("should accept passage mode", () => {
    const result = SearchRequestSchema.safeParse({
      query: "Law of One",
      mode: "passage",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mode).toBe("passage");
    }
  });

  it("should reject invalid mode", () => {
    const result = SearchRequestSchema.safeParse({
      query: "test",
      mode: "invalid",
    });

    expect(result.success).toBe(false);
  });

  it("should reject query that is too short", () => {
    const result = SearchRequestSchema.safeParse({
      query: "a",
    });

    expect(result.success).toBe(false);
  });

  it("should reject query that is too long", () => {
    const result = SearchRequestSchema.safeParse({
      query: "a".repeat(501),
    });

    expect(result.success).toBe(false);
  });

  it("should reject limit below 1", () => {
    const result = SearchRequestSchema.safeParse({
      query: "test query",
      limit: 0,
    });

    expect(result.success).toBe(false);
  });

  it("should reject limit above 50", () => {
    const result = SearchRequestSchema.safeParse({
      query: "test query",
      limit: 51,
    });

    expect(result.success).toBe(false);
  });
});

describe("parseSearchRequest", () => {
  it("should return success with valid data", () => {
    const result = parseSearchRequest({ query: "love and light" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.query).toBe("love and light");
    }
  });

  it("should return error message for invalid data", () => {
    const result = parseSearchRequest({ query: "a" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("2 characters");
    }
  });

  it("should handle missing query", () => {
    const result = parseSearchRequest({});

    expect(result.success).toBe(false);
  });

  it("should handle non-object input", () => {
    const result = parseSearchRequest("not an object");

    expect(result.success).toBe(false);
  });
});
