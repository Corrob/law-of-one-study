/**
 * @jest-environment node
 */

import { GET } from "../route";
import {
  createCampaign,
  getGroupIdForLocale,
  listCampaignNames,
  scheduleCampaign,
} from "@/lib/email/mailerlite";
import { getDayOfYear, getQuoteForDay } from "@/lib/daily-quote";

jest.mock("@/lib/email/mailerlite", () => ({
  getGroupIdForLocale: jest.fn(),
  listCampaignNames: jest.fn(),
  createCampaign: jest.fn(),
  scheduleCampaign: jest.fn(),
}));

const getGroupIdMock = getGroupIdForLocale as jest.Mock;
const listCampaignNamesMock = listCampaignNames as jest.Mock;
const createCampaignMock = createCampaign as jest.Mock;
const scheduleCampaignMock = scheduleCampaign as jest.Mock;

function makeRequest(authorization?: string): Request {
  return new Request("http://localhost/api/cron/quote-email", {
    headers: authorization ? { authorization } : {},
  });
}

describe("GET /api/cron/quote-email", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CRON_SECRET = "cron-secret";
    getGroupIdMock.mockImplementation((locale: string) =>
      locale === "en" ? "group-en" : undefined
    );
    listCampaignNamesMock.mockResolvedValue([]);
    createCampaignMock.mockResolvedValue("42");
    scheduleCampaignMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  it("rejects requests without the cron secret", async () => {
    const response = await GET(makeRequest());
    expect(response.status).toBe(401);
    expect(createCampaignMock).not.toHaveBeenCalled();
  });

  it("rejects requests with a wrong secret", async () => {
    const response = await GET(makeRequest("Bearer wrong"));
    expect(response.status).toBe(401);
  });

  it("rejects all requests when CRON_SECRET is unset", async () => {
    delete process.env.CRON_SECRET;
    const response = await GET(makeRequest("Bearer cron-secret"));
    expect(response.status).toBe(401);
  });

  it("creates and schedules a campaign per configured locale group", async () => {
    const response = await GET(makeRequest("Bearer cron-secret"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ status: "ok", sent: 1, locales: ["en"] });
    expect(body.skipped).toEqual(expect.arrayContaining(["es", "de", "fr"]));

    expect(createCampaignMock).toHaveBeenCalledTimes(1);
    const call = createCampaignMock.mock.calls[0][0];
    expect(call.groupId).toBe("group-en");
    expect(call.name).toBe(
      `weekly-quote-${new Date().getFullYear()}-${getDayOfYear(new Date())}-en`
    );
    expect(call.html).toContain("L/L Research");
    expect(call.plainText).toContain("L/L Research");
    expect(call.subject).toContain(getQuoteForDay(new Date(), "en").reference);
    expect(scheduleCampaignMock).toHaveBeenCalledWith("42");
  });

  it("returns 502 when listing existing campaigns fails", async () => {
    listCampaignNamesMock.mockRejectedValue(new Error("api down"));
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const response = await GET(makeRequest("Bearer cron-secret"));

    expect(response.status).toBe(502);
    expect(createCampaignMock).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("skips locales whose campaign for today already exists", async () => {
    listCampaignNamesMock.mockResolvedValue([
      `weekly-quote-${new Date().getFullYear()}-${getDayOfYear(new Date())}-en`,
    ]);

    const response = await GET(makeRequest("Bearer cron-secret"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.sent).toBe(0);
    expect(body.skipped).toContain("en");
    expect(createCampaignMock).not.toHaveBeenCalled();
  });

  it("reports partial failure when a send throws", async () => {
    createCampaignMock.mockRejectedValueOnce(new Error("boom"));
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const response = await GET(makeRequest("Bearer cron-secret"));

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.status).toBe("partial");
    expect(body.failed).toEqual(["en"]);
    consoleSpy.mockRestore();
  });
});
