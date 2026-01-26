"use server";

import { createClient } from "@/src/utils/supabase/server";
import { SiteId } from "@/src/lib/types";

interface TrackEventResult {
  success?: boolean;
  error?: string;
}

const VALID_EVENT_TYPES = ["cta_click", "page_view", "form_view"] as const;
type EventType = (typeof VALID_EVENT_TYPES)[number];

function isValidEventType(type: string): type is EventType {
  return VALID_EVENT_TYPES.includes(type as EventType);
}

/**
 * Core event tracking logic (testable)
 * Separated from server action wrapper for unit testing
 */
export async function trackEventCore(
  supabase: Awaited<ReturnType<typeof createClient>>,
  siteId: SiteId,
  eventType: string,
  metadata: Record<string, unknown> = {},
): Promise<TrackEventResult> {
  // 1. Validate event type
  if (!isValidEventType(eventType)) {
    return { error: "Virheellinen tapahtumatyyppi." };
  }

  // 2. Insert event (RLS policy enforces published site check)
  const { error: insertError } = await supabase
    .from("analytics_events")
    .insert({
      site_id: siteId,
      event_type: eventType,
      metadata,
    });

  if (insertError) {
    console.error("Analytics event error:", insertError);
    return { error: "Tapahtuman tallennus epäonnistui." };
  }

  return { success: true };
}

/**
 * Server action wrapper for trackEventCore
 * This is called from client components
 */
export async function trackEvent(
  siteId: SiteId,
  eventType: string,
  metadata: Record<string, unknown> = {},
): Promise<TrackEventResult> {
  const supabase = await createClient();
  return trackEventCore(supabase, siteId, eventType, metadata);
}
