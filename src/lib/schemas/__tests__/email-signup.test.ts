import { SubscribeSchema } from "../email-signup";

describe("SubscribeSchema", () => {
  it("accepts a valid email with defaults applied", () => {
    const result = SubscribeSchema.safeParse({ email: "seeker@example.com" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        email: "seeker@example.com",
        locale: "en",
        cadence: "weekly",
      });
    }
  });

  it("accepts all supported locales and cadences", () => {
    for (const locale of ["en", "es", "de", "fr"]) {
      for (const cadence of ["weekly", "daily"]) {
        const result = SubscribeSchema.safeParse({
          email: "seeker@example.com",
          locale,
          cadence,
        });
        expect(result.success).toBe(true);
      }
    }
  });

  it("accepts an empty honeypot field", () => {
    const result = SubscribeSchema.safeParse({
      email: "seeker@example.com",
      website: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a filled honeypot field", () => {
    const result = SubscribeSchema.safeParse({
      email: "seeker@example.com",
      website: "https://spam.example.com",
    });
    expect(result.success).toBe(false);
  });

  it.each(["", "not-an-email", "missing@tld@double.com", "a@b"])(
    "rejects invalid email %p",
    (email) => {
      expect(SubscribeSchema.safeParse({ email }).success).toBe(false);
    }
  );

  it("rejects unsupported locales", () => {
    const result = SubscribeSchema.safeParse({
      email: "seeker@example.com",
      locale: "pt",
    });
    expect(result.success).toBe(false);
  });
});
