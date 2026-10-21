import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/src/utils/supabase/admin";
import { isValidUuid } from "@/src/lib/types";
import { RateLimiter } from "@/src/lib/rate-limit";

/**
 * o.js-snippetin tapahtumat (näyttö / konversio) variaatiokohtaisia tilastoja
 * varten. Snippet lähettää sendBeaconilla text/plain-rungon, jotta selain ei
 * tee CORS-esikyselyä.
 */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EVENT_TYPES = ["view", "conversion"] as const;
type EventType = (typeof EVENT_TYPES)[number];

const eventLimiter = new RateLimiter({ maxRequests: 120, windowMs: 15 * 60 * 1000 });

function done(status = 204) {
  return new NextResponse(null, { status, headers: CORS_HEADERS });
}

export function OPTIONS() {
  return done();
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!eventLimiter.check(ip).allowed) return done(429);

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(await req.text());
  } catch {
    return done(400);
  }

  const siteId = typeof body.s === "string" ? body.s : "";
  const variantId = typeof body.v === "string" ? body.v : "";
  const visitorId = typeof body.vid === "string" ? body.vid : "";
  const type = body.t as EventType;
  if (
    !isValidUuid(siteId) ||
    !isValidUuid(variantId) ||
    !/^[\w-]{8,64}$/.test(visitorId) ||
    !EVENT_TYPES.includes(type)
  ) {
    return done(400);
  }

  const admin = createAdminClient();

  // Variaation pitää kuulua snippetin sivustoon.
  const { data: variant } = await admin
    .from("overlay_variants")
    .select("id")
    .eq("id", variantId)
    .eq("site_id", siteId)
    .maybeSingle();
  if (!variant) return done(404);

  const { error } = await admin
    .from("overlay_events")
    .insert({ variant_id: variantId, visitor_id: visitorId, event_type: type });
  if (error) {
    console.error("Overlay event error:", error);
    return done(500);
  }
  return done();
}
