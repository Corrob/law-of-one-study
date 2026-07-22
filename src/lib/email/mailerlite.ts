/**
 * Thin server-side MailerLite API client.
 *
 * Only ever imported from Route Handlers — the MAILERLITE_API_KEY must
 * never reach the client bundle. All functions throw MailerLiteError on
 * non-2xx responses so callers can normalize errors without leaking
 * MailerLite internals to the browser.
 */

import { type AvailableLanguage } from "@/lib/language-config";

const API_BASE = "https://connect.mailerlite.com/api";

export class MailerLiteError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "MailerLiteError";
    this.status = status;
  }
}

function getApiKey(): string {
  const key = process.env.MAILERLITE_API_KEY;
  if (!key) {
    throw new Error("MAILERLITE_API_KEY is not configured");
  }
  return key;
}

export type EmailCadence = "weekly" | "daily";

/**
 * Group ID for a locale and cadence, if configured:
 * weekly → MAILERLITE_GROUP_{EN,ES,DE,FR}, daily → MAILERLITE_GROUP_DAILY_*.
 * A locale without the env var simply has no list for that cadence.
 */
export function getGroupIdForLocale(
  locale: AvailableLanguage,
  cadence: EmailCadence = "weekly"
): string | undefined {
  const prefix = cadence === "daily" ? "MAILERLITE_GROUP_DAILY_" : "MAILERLITE_GROUP_";
  return process.env[`${prefix}${locale.toUpperCase()}`];
}

async function mailerLiteFetch(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    // Include a snippet of the response body — it only reaches server logs,
    // and MailerLite's validation messages are the fastest way to debug.
    const detail = await response.text().catch(() => "");
    throw new MailerLiteError(
      `MailerLite request failed: ${path} (${response.status}) ${detail.slice(0, 500)}`,
      response.status
    );
  }
  return response.json();
}

/**
 * Create or update a subscriber and assign them to a group.
 * MailerLite upserts by email, so re-subscribing is idempotent.
 */
export async function upsertSubscriber(params: {
  email: string;
  locale: AvailableLanguage;
  groupId?: string;
}): Promise<void> {
  await mailerLiteFetch("/subscribers", {
    method: "POST",
    body: JSON.stringify({
      email: params.email,
      fields: { locale: params.locale },
      groups: params.groupId ? [params.groupId] : [],
    }),
  });
}

/**
 * List names of recent campaigns (sent and ready) for idempotency checks —
 * the cron route skips a send if a campaign with the same name exists.
 */
export async function listCampaignNames(): Promise<string[]> {
  const statuses = ["sent", "ready"] as const;
  const results = (await Promise.all(
    statuses.map((status) =>
      mailerLiteFetch(`/campaigns?filter[status]=${status}&limit=100`)
    )
  )) as Array<{ data?: Array<{ name?: string }> }>;

  return results.flatMap((result) =>
    (result.data ?? []).flatMap((campaign) => campaign.name ?? [])
  );
}

/**
 * Create a regular campaign targeted at one or more groups. MailerLite
 * dedupes recipients across groups, so a subscriber in several target
 * groups still receives exactly one email. Returns the new campaign's ID.
 *
 * MailerLite generates the plain-text MIME part from the HTML at send
 * time; the API rejects payloads that try to supply one explicitly.
 */
export async function createCampaign(params: {
  name: string;
  subject: string;
  groupIds: string[];
  html: string;
}): Promise<string> {
  const fromEmail = process.env.MAILERLITE_FROM_EMAIL;
  const fromName = process.env.MAILERLITE_FROM_NAME ?? "Law of One Study";
  if (!fromEmail) {
    throw new Error("MAILERLITE_FROM_EMAIL is not configured");
  }

  const data = (await mailerLiteFetch("/campaigns", {
    method: "POST",
    body: JSON.stringify({
      name: params.name,
      type: "regular",
      groups: params.groupIds,
      emails: [
        {
          subject: params.subject,
          from_name: fromName,
          from: fromEmail,
          content: params.html,
        },
      ],
    }),
  })) as { data?: { id?: string | number } };

  const id = data.data?.id;
  if (id === undefined) {
    throw new MailerLiteError("MailerLite campaign response missing id", 502);
  }
  return String(id);
}

/** Schedule a campaign for immediate delivery. */
export async function scheduleCampaign(campaignId: string): Promise<void> {
  await mailerLiteFetch(`/campaigns/${campaignId}/schedule`, {
    method: "POST",
    body: JSON.stringify({ delivery: "instant" }),
  });
}
