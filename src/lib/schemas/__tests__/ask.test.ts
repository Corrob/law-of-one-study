import { AskRequestSchema } from "../ask";

describe("AskRequestSchema", () => {
  it("accepts a minimal valid request and defaults history/locale", () => {
    const result = AskRequestSchema.safeParse({ message: "What is harvest?" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.history).toEqual([]);
      expect(result.data.locale).toBe("en");
    }
  });

  it("accepts history and a valid locale", () => {
    const result = AskRequestSchema.safeParse({
      message: "tell me more",
      history: [{ role: "user", content: "What is harvest?" }],
      locale: "es",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty message", () => {
    expect(AskRequestSchema.safeParse({ message: "   " }).success).toBe(false);
  });

  it("rejects an invalid locale", () => {
    expect(AskRequestSchema.safeParse({ message: "hi", locale: "xx" }).success).toBe(false);
  });

  it("rejects an invalid history role", () => {
    expect(
      AskRequestSchema.safeParse({
        message: "hi",
        history: [{ role: "system", content: "x" }],
      }).success
    ).toBe(false);
  });
});
