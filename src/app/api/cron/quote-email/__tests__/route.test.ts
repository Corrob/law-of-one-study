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

// 2026-07-21 is a Tuesday, 2026-07-26 a Sunday (times in UTC).
const A_TUESDAY = new Date("2026-07-21T13:00:00Z");
const A_SUNDAY = new Date("2026-07-26T13:00:00Z");

describe("GET /api/cron/quote-email", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(A_TUESDAY);
    process.env.CRON_SECRET = "cron-secret";
    // Weekly groups: EN only. Daily groups: EN only.
    getGroupIdMock.mockImplementation((locale: string, cadence: string = "weekly") =>
      locale === "en" ? (cadence === "daily" ? "group-daily-en" : "group-en") : undefined
    );
    listCampaignNamesMock.mockResolvedValue([]);
    createCampaignMock.mockResolvedValue("42");
    scheduleCampaignMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
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

  it("sends a daily campaign to the daily group on a weekday", async () => {
    const response = await GET(makeRequest("Bearer cron-secret"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ status: "ok", sent: 1, locales: ["en"] });
    expect(body.skipped).toEqual(expect.arrayContaining(["es", "de", "fr"]));

    expect(createCampaignMock).toHaveBeenCalledTimes(1);
    const call = createCampaignMock.mock.calls[0][0];
    expect(call.groupIds).toEqual(["group-daily-en"]);
    expect(call.name).toBe(
      `quote-${new Date().getFullYear()}-${getDayOfYear(new Date())}-en`
    );
    expect(call.html).toContain("L/L Research");
    expect(call.html).toContain("/en/ask?q=");
    expect(call.html).toContain(encodeURIComponent(getQuoteForDay(new Date(), "en").reference));
    expect(call.subject).toContain(getQuoteForDay(new Date(), "en").reference);
    expect(call.subject).toContain("Your daily quote");
    expect(call.html).toContain("accompany your day");
    expect(scheduleCampaignMock).toHaveBeenCalledWith("42");
  });

  it("targets the daily and weekly groups together on Sundays", async () => {
    jest.setSystemTime(A_SUNDAY);

    const response = await GET(makeRequest("Bearer cron-secret"));

    expect(response.status).toBe(200);
    expect(createCampaignMock).toHaveBeenCalledTimes(1);
    const call = createCampaignMock.mock.calls[0][0];
    // One campaign to both groups — MailerLite dedupes overlapping members.
    expect(call.groupIds).toEqual(["group-daily-en", "group-en"]);
    expect(call.subject).toContain("Your weekly quote");
  });

  it("sends Sunday campaigns to weekly-only locales without a daily group", async () => {
    jest.setSystemTime(A_SUNDAY);
    getGroupIdMock.mockImplementation((locale: string, cadence: string = "weekly") =>
      cadence === "weekly" ? `group-${locale}` : undefined
    );

    const response = await GET(makeRequest("Bearer cron-secret"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.sent).toBe(4);
    expect(createCampaignMock).toHaveBeenCalledTimes(4);
    expect(createCampaignMock.mock.calls[0][0].groupIds).toEqual(["group-en"]);
  });

  it("skips weekly-only locales on weekdays", async () => {
    getGroupIdMock.mockImplementation((locale: string, cadence: string = "weekly") =>
      cadence === "weekly" ? `group-${locale}` : undefined
    );

    const response = await GET(makeRequest("Bearer cron-secret"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.sent).toBe(0);
    expect(body.skipped).toEqual(expect.arrayContaining(["en", "es", "de", "fr"]));
    expect(createCampaignMock).not.toHaveBeenCalled();
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
      `quote-${new Date().getFullYear()}-${getDayOfYear(new Date())}-en`,
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
