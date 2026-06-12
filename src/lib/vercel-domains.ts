/**
 * Vercel Domains API client for attaching customer custom domains to the
 * project. Vercel provisions TLS automatically once DNS points correctly, and
 * the existing host-based routing in `proxy.ts` serves the right tenant — so
 * this module only needs to register/unregister domains and report status.
 *
 * Requires env: VERCEL_TOKEN, VERCEL_PROJECT_ID (and optional VERCEL_TEAM_ID).
 * Server-only — never import into client components.
 */

const API_BASE = "https://api.vercel.com";

export type VercelDomainResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number };

/**
 * DNS record the customer must add at their registrar. Apex domains use an A
 * record to Vercel's anycast IP; subdomains use a CNAME.
 */
export type DnsRecommendation =
  | { type: "A"; name: string; value: string }
  | { type: "CNAME"; name: string; value: string };

export type DomainStatus = {
  domain: string;
  /** DNS verified and pointing at Vercel — the domain serves the site. */
  verified: boolean;
  record: DnsRecommendation;
};

const APEX_A_RECORD = "76.76.21.21";
const SUBDOMAIN_CNAME = "cname.vercel-dns.com";

/**
 * Recommend the DNS record for a domain. Apex (e.g. `oma-firma.fi`) gets an A
 * record; a subdomain (e.g. `kampanja.oma-firma.fi`) gets a CNAME on its label.
 * Uses a label-count heuristic; Vercel's own verification is authoritative for
 * confirming the domain is live.
 */
export function recommendedDnsRecord(domain: string): DnsRecommendation {
  const labels = domain.split(".");
  if (labels.length <= 2) {
    return { type: "A", name: "@", value: APEX_A_RECORD };
  }
  const subdomain = labels.slice(0, labels.length - 2).join(".");
  return { type: "CNAME", name: subdomain, value: SUBDOMAIN_CNAME };
}

export function isVercelConfigured(): boolean {
  return Boolean(process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID);
}

function vercelEnv(): { token: string; projectId: string; teamQuery: string } {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) {
    throw new Error(
      "Vercel domains require VERCEL_TOKEN and VERCEL_PROJECT_ID env vars",
    );
  }
  const teamId = process.env.VERCEL_TEAM_ID;
  return { token, projectId, teamQuery: teamId ? `?teamId=${teamId}` : "" };
}

async function vercelFetch<T>(
  path: string,
  init: RequestInit,
): Promise<VercelDomainResult<T>> {
  const { token } = vercelEnv();
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const body = (await response.json().catch(() => ({}))) as {
      error?: { message?: string };
    } & T;
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: body.error?.message || `Vercel API ${response.status}`,
      };
    }
    return { ok: true, data: body as T };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Vercel API request failed",
    };
  }
}

/**
 * Attach a custom domain to the Vercel project. Treats "already added to this
 * project" as success so re-saving the same domain is idempotent.
 */
export async function addDomainToProject(
  domain: string,
): Promise<VercelDomainResult<{ name: string; verified: boolean }>> {
  const { projectId, teamQuery } = vercelEnv();
  const result = await vercelFetch<{ name: string; verified: boolean }>(
    `/v10/projects/${projectId}/domains${teamQuery}`,
    { method: "POST", body: JSON.stringify({ name: domain }) },
  );
  if (
    !result.ok &&
    result.status === 409 &&
    /already|exists|in use by your/i.test(result.error)
  ) {
    return { ok: true, data: { name: domain, verified: false } };
  }
  return result;
}

/** Remove a custom domain from the Vercel project. Not-found is treated as success. */
export async function removeDomainFromProject(
  domain: string,
): Promise<VercelDomainResult<{ removed: true }>> {
  const { projectId, teamQuery } = vercelEnv();
  const result = await vercelFetch<unknown>(
    `/v9/projects/${projectId}/domains/${domain}${teamQuery}`,
    { method: "DELETE" },
  );
  if (!result.ok && result.status === 404) {
    return { ok: true, data: { removed: true } };
  }
  if (!result.ok) return result;
  return { ok: true, data: { removed: true } };
}

/** Check whether a custom domain is verified and serving on the project. */
export async function getDomainStatus(
  domain: string,
): Promise<VercelDomainResult<DomainStatus>> {
  const { projectId, teamQuery } = vercelEnv();
  const result = await vercelFetch<{ verified: boolean }>(
    `/v9/projects/${projectId}/domains/${domain}${teamQuery}`,
    { method: "GET" },
  );
  if (!result.ok) return result;
  return {
    ok: true,
    data: {
      domain,
      verified: Boolean(result.data.verified),
      record: recommendedDnsRecord(domain),
    },
  };
}
