/**
 * Zod schemas for the email signup feature.
 *
 * Validates the body of POST /api/subscribe. The `website` field is a
 * honeypot: it is visually hidden on the form, so any non-empty value
 * indicates an automated submission and the request is rejected.
 */

import { z } from "zod";
import { AvailableLanguageSchema } from "@/lib/language-config";

export const SubscribeSchema = z.object({
  email: z.email(),
  locale: AvailableLanguageSchema.default("en"),
  cadence: z.enum(["weekly", "daily"]).default("weekly"),
  website: z.string().max(0).optional(), // honeypot: must be empty
});

export type SubscribeInput = z.infer<typeof SubscribeSchema>;
