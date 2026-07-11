/**
 * POST /api/subscribe — add an email to the weekly quote list.
 *
 * Validates with Zod, drops honeypot submissions silently (bots get a
 * generic "ok" so the trap isn't revealed), rate-limits by IP, and upserts
 * the subscriber into the locale's MailerLite group. Responses are
 * normalized and never reveal whether an email already existed.
 */

import { SubscribeSchema } from "@/lib/schemas/email-signup";
import { checkRateLimit } from "@/lib/email/rate-limit";
import { getGroupIdForLocale, upsertSubscriber } from "@/lib/email/mailerlite";

const GENERIC_ERROR = "Unable to subscribe right now. Please try again later.";

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { status: "error", message: "Invalid request body" },
      { status: 400 }
    );
  }

  const result = SubscribeSchema.safeParse(body);
  if (!result.success) {
    // A filled honeypot also lands here; answer "ok" so bots learn nothing.
    const honeypotFilled =
      typeof body === "object" &&
      body !== null &&
      "website" in body &&
      Boolean((body as { website?: unknown }).website);
    if (honeypotFilled) {
      return Response.json({ status: "ok" });
    }
    return Response.json(
      { status: "error", message: "Invalid email address" },
      { status: 400 }
    );
  }

  if (!checkRateLimit(getClientIp(request))) {
    return Response.json(
      { status: "error", message: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    await upsertSubscriber({
      email: result.data.email,
      locale: result.data.locale,
      groupId: getGroupIdForLocale(result.data.locale),
    });
    return Response.json({ status: "ok" });
  } catch (error) {
    console.error("Subscribe failed:", error);
    return Response.json(
      { status: "error", message: GENERIC_ERROR },
      { status: 502 }
    );
  }
}
