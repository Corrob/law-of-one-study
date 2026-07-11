/**
 * @jest-environment node
 */

import {
  upsertSubscriber,
  listCampaignNames,
  createCampaign,
  scheduleCampaign,
  getGroupIdForLocale,
  MailerLiteError,
} from "../mailerlite";

function mockFetchResponse(body: unknown, ok = true, status = 200) {
  return jest.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
  });
}

describe("mailerlite client", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      MAILERLITE_API_KEY: "test-key",
      MAILERLITE_FROM_EMAIL: "quotes@lawofone.study",
      MAILERLITE_FROM_NAME: "Law of One Study",
      MAILERLITE_GROUP_EN: "group-en",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe("getGroupIdForLocale", () => {
    it("returns the configured group id", () => {
      expect(getGroupIdForLocale("en")).toBe("group-en");
    });

    it("returns undefined when unconfigured", () => {
      expect(getGroupIdForLocale("fr")).toBeUndefined();
    });
  });

  describe("upsertSubscriber", () => {
    it("posts the subscriber with locale field and group", async () => {
      const fetchMock = mockFetchResponse({ data: {} });
      global.fetch = fetchMock;

      await upsertSubscriber({
        email: "seeker@example.com",
        locale: "es",
        groupId: "group-es",
      });

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe("https://connect.mailerlite.com/api/subscribers");
      expect(init.method).toBe("POST");
      expect(init.headers.Authorization).toBe("Bearer test-key");
      expect(JSON.parse(init.body)).toEqual({
        email: "seeker@example.com",
        fields: { locale: "es" },
        groups: ["group-es"],
      });
    });

    it("throws MailerLiteError on a failed response", async () => {
      global.fetch = mockFetchResponse({}, false, 422);
      await expect(
        upsertSubscriber({ email: "bad", locale: "en" })
      ).rejects.toThrow(MailerLiteError);
    });

    it("throws when the API key is missing", async () => {
      delete process.env.MAILERLITE_API_KEY;
      await expect(
        upsertSubscriber({ email: "seeker@example.com", locale: "en" })
      ).rejects.toThrow("MAILERLITE_API_KEY");
    });
  });

  describe("listCampaignNames", () => {
    it("collects names across sent and ready statuses", async () => {
      const fetchMock = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ data: [{ name: "weekly-quote-2026-192-en" }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ data: [{ name: "weekly-quote-2026-192-es" }] }),
        });
      global.fetch = fetchMock;

      const names = await listCampaignNames();
      expect(names).toEqual([
        "weekly-quote-2026-192-en",
        "weekly-quote-2026-192-es",
      ]);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("createCampaign", () => {
    it("creates a regular campaign and returns its id", async () => {
      const fetchMock = mockFetchResponse({ data: { id: 42 } });
      global.fetch = fetchMock;

      const id = await createCampaign({
        name: "weekly-quote-2026-192-en",
        subject: "Your weekly quote",
        groupId: "group-en",
        html: "<html></html>",
        plainText: "text",
      });

      expect(id).toBe("42");
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe("https://connect.mailerlite.com/api/campaigns");
      const body = JSON.parse(init.body);
      expect(body.type).toBe("regular");
      expect(body.groups).toEqual(["group-en"]);
      expect(body.emails[0].from).toBe("quotes@lawofone.study");
    });

    it("throws when MAILERLITE_FROM_EMAIL is missing", async () => {
      delete process.env.MAILERLITE_FROM_EMAIL;
      await expect(
        createCampaign({
          name: "n",
          subject: "s",
          groupId: "g",
          html: "<html></html>",
          plainText: "t",
        })
      ).rejects.toThrow("MAILERLITE_FROM_EMAIL");
    });
  });

  describe("scheduleCampaign", () => {
    it("schedules the campaign for instant delivery", async () => {
      const fetchMock = mockFetchResponse({ data: {} });
      global.fetch = fetchMock;

      await scheduleCampaign("42");

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe("https://connect.mailerlite.com/api/campaigns/42/schedule");
      expect(JSON.parse(init.body)).toEqual({ delivery: "instant" });
    });
  });
});
