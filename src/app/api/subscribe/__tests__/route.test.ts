/**
 * @jest-environment node
 */

import { POST } from "../route";
import { resetRateLimit } from "@/lib/email/rate-limit";
import { upsertSubscriber } from "@/lib/email/mailerlite";

jest.mock("@/lib/email/mailerlite", () => ({
  upsertSubscriber: jest.fn().mockResolvedValue(undefined),
  getGroupIdForLocale: jest.fn().mockReturnValue("group-en"),
}));

const upsertSubscriberMock = upsertSubscriber as jest.Mock;

function makeRequest(body: unknown, ip = "1.2.3.4"): Request {
  return new Request("http://localhost/api/subscribe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/subscribe", () => {
  beforeEach(() => {
    resetRateLimit();
    upsertSubscriberMock.mockClear();
    upsertSubscriberMock.mockResolvedValue(undefined);
  });

  it("subscribes a valid email to the locale group", async () => {
    const response = await POST(
      makeRequest({ email: "seeker@example.com", locale: "en" })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
    expect(upsertSubscriberMock).toHaveBeenCalledWith({
      email: "seeker@example.com",
      locale: "en",
      groupId: "group-en",
    });
  });

  it("rejects a malformed email with 400", async () => {
    const response = await POST(makeRequest({ email: "not-an-email" }));
    expect(response.status).toBe(400);
    expect(upsertSubscriberMock).not.toHaveBeenCalled();
  });

  it("rejects a non-JSON body with 400", async () => {
    const request = new Request("http://localhost/api/subscribe", {
      method: "POST",
      body: "not json",
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("silently drops filled-honeypot submissions", async () => {
    const response = await POST(
      makeRequest({ email: "bot@example.com", website: "https://spam.example" })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
    expect(upsertSubscriberMock).not.toHaveBeenCalled();
  });

  it("rate limits repeated requests from the same IP", async () => {
    for (let i = 0; i < 5; i++) {
      await POST(makeRequest({ email: `seeker${i}@example.com` }, "9.9.9.9"));
    }
    const response = await POST(
      makeRequest({ email: "seeker6@example.com" }, "9.9.9.9")
    );
    expect(response.status).toBe(429);
  });

  it("returns a normalized 502 when MailerLite fails", async () => {
    upsertSubscriberMock.mockRejectedValueOnce(new Error("boom"));
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(makeRequest({ email: "seeker@example.com" }));

    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.status).toBe("error");
    expect(body.message).not.toContain("boom");
    consoleSpy.mockRestore();
  });
});
