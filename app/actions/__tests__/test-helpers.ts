import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createSiteId, SiteId } from "@/src/lib/types";

/**
 * Create a Supabase client for testing
 * Uses service role key to bypass RLS for test setup
 */
export function createTestClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables for testing");
  }

  // Warn if using anon key (tests may fail due to RLS)
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn(
      "⚠️  SUPABASE_SERVICE_ROLE_KEY not found. Tests may fail due to RLS policies. " +
        "Add SUPABASE_SERVICE_ROLE_KEY to .env.local for proper integration testing.",
    );
  }

  return createSupabaseClient(supabaseUrl, supabaseKey);
}

/**
 * Create a test site and page for integration tests
 * Returns siteId and cleanup function
 */
export async function createTestSite(published = true): Promise<{
  siteId: SiteId;
  cleanup: () => Promise<void>;
}> {
  const client = createTestClient();

  // Create a test user (organization)
  const userId = crypto.randomUUID();
  const { error: userError } = await client.from("users").insert({
    id: userId,
    contact_email: `test-${Date.now()}@example.com`,
    company_name: "Test Company",
    status: "Active",
  });

  if (userError) throw userError;

  // Create a test site
  const siteId = crypto.randomUUID();
  const { error: siteError } = await client.from("sites").insert({
    id: siteId,
    user_id: userId,
    subdomain: `test-${Date.now()}`,
  });

  if (siteError) throw siteError;

  // Create a home page
  const { error: pageError } = await client.from("pages").insert({
    site_id: siteId,
    slug: "home",
    title: "Test Home Page",
    content: { templateId: "waitlist", hero: { title: "Test" } },
    published,
  });

  if (pageError) throw pageError;

  const cleanup = async () => {
    // Cascade delete will handle sites, pages, leads, and analytics_events
    await client.from("users").delete().eq("id", userId);
  };

  return { siteId: createSiteId(siteId), cleanup };
}

/**
 * Wait for a condition to be true
 * Useful for async operations like webhooks
 */
export async function waitFor(
  condition: () => Promise<boolean>,
  timeoutMs = 5000,
  intervalMs = 100,
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await condition()) return true;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return false;
}
