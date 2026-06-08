/**
 * Supabase `sites` registry access for provisioning. The pure row builder is
 * unit-tested; the upsert wrapper talks to the Supabase REST API.
 */

export type ProvisionStatus =
  | "pending"
  | "repo_created"
  | "project_created"
  | "domain_assigned"
  | "deployed"
  | "live"
  | "failed";

export type SiteRegistryRow = {
  subdomain: string;
  custom_domain: string | null;
  repo_name: string;
  repo_url: string;
  vercel_project_id: string | null;
  provision_status: ProvisionStatus;
};

export type RegistryInput = {
  subdomain: string;
  customDomain?: string;
  repoName: string;
  repoUrl: string;
  vercelProjectId?: string;
  status: ProvisionStatus;
};

/** Map provisioning results into a `sites` registry row. */
export function mapToRegistryRow(input: RegistryInput): SiteRegistryRow {
  return {
    subdomain: input.subdomain,
    custom_domain: input.customDomain ?? null,
    repo_name: input.repoName,
    repo_url: input.repoUrl,
    vercel_project_id: input.vercelProjectId ?? null,
    provision_status: input.status,
  };
}

export type SupabaseConfig = { url: string; serviceRoleKey: string };

/**
 * Upsert a site registry row via the Supabase REST API (service role).
 * Conflict target is `subdomain` so re-running provisioning is idempotent.
 */
export async function upsertSiteRegistry(
  config: SupabaseConfig,
  row: SiteRegistryRow,
): Promise<void> {
  const response = await fetch(
    `${config.url}/rest/v1/sites?on_conflict=subdomain`,
    {
      method: "POST",
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(row),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Supabase registry upsert failed: ${response.status} ${await response.text()}`,
    );
  }
}
