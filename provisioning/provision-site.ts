/**
 * Provision a new customer site end-to-end (Scope 2).
 *
 *   1. Create a GitHub repo from the template
 *   2. Seed initial content (site.json + welcome post)
 *   3. Create a Vercel project linked to the repo
 *   4. Assign <subdomain>.rascalpages.fi (+ optional custom domain)
 *   5. Record the mapping in the Supabase `sites` registry
 *
 * Usage:
 *   tsx provision-site.ts <subdomain> "<Display Name>" [customDomain] [--dry-run]
 *
 * Required env (skipped in --dry-run): GITHUB_TOKEN, GITHUB_OWNER,
 * GITHUB_TEMPLATE_REPO, VERCEL_TOKEN, [VERCEL_TEAM_ID], SUPABASE_URL,
 * SUPABASE_SERVICE_ROLE_KEY, [ROOT_DOMAIN], [SITE_CENTRAL_API].
 */

import {
  DEFAULT_ROOT_DOMAIN,
  buildRepoName,
  buildSubdomainHost,
  isValidSubdomain,
} from "./lib/names";
import { buildSeedFiles } from "./lib/seed";
import {
  createRepoFromTemplate,
  putFile,
  type GithubConfig,
} from "./lib/github";
import {
  addProjectDomain,
  createProject,
  type VercelConfig,
} from "./lib/vercel";
import {
  mapToRegistryRow,
  upsertSiteRegistry,
  type ProvisionStatus,
  type SupabaseConfig,
} from "./lib/registry";

export type ProvisionInput = {
  subdomain: string;
  name: string;
  customDomain?: string;
  rootDomain?: string;
};

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env: ${key}`);
  return value;
}

function log(step: string, detail: string): void {
  console.log(`[provision] ${step}: ${detail}`);
}

/** Print the planned actions without touching any external service. */
export function planProvision(input: ProvisionInput): string[] {
  const repoName = buildRepoName(input.subdomain);
  const host = buildSubdomainHost(
    input.subdomain,
    input.rootDomain ?? DEFAULT_ROOT_DOMAIN,
  );
  return [
    `create repo ${repoName} from template`,
    `seed content/site.json + content/posts/tervetuloa.md`,
    `create Vercel project ${repoName}`,
    `assign domain ${host}`,
    ...(input.customDomain ? [`assign custom domain ${input.customDomain}`] : []),
    `upsert sites registry (subdomain=${input.subdomain})`,
  ];
}

export async function provisionSite(input: ProvisionInput): Promise<void> {
  if (!isValidSubdomain(input.subdomain)) {
    throw new Error(`Invalid subdomain: ${input.subdomain}`);
  }

  const github: GithubConfig = {
    token: requireEnv("GITHUB_TOKEN"),
    owner: requireEnv("GITHUB_OWNER"),
    templateRepo: requireEnv("GITHUB_TEMPLATE_REPO"),
  };
  const vercel: VercelConfig = {
    token: requireEnv("VERCEL_TOKEN"),
    teamId: process.env.VERCEL_TEAM_ID,
  };
  const supabase: SupabaseConfig = {
    url: requireEnv("SUPABASE_URL"),
    serviceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };

  const rootDomain = input.rootDomain ?? process.env.ROOT_DOMAIN ?? DEFAULT_ROOT_DOMAIN;
  const repoName = buildRepoName(input.subdomain);
  const host = buildSubdomainHost(input.subdomain, rootDomain);
  const siteUrl = input.customDomain
    ? `https://${input.customDomain}`
    : `https://${host}`;
  const today = new Date().toISOString().slice(0, 10);

  let status: ProvisionStatus = "pending";
  const record = async (s: ProvisionStatus, projectId?: string, repoUrl?: string) => {
    status = s;
    await upsertSiteRegistry(
      supabase,
      mapToRegistryRow({
        subdomain: input.subdomain,
        customDomain: input.customDomain,
        repoName,
        repoUrl: repoUrl ?? "",
        vercelProjectId: projectId,
        status: s,
      }),
    );
  };

  try {
    log("github", `creating repo ${repoName}`);
    const repo = await createRepoFromTemplate(github, repoName);
    await record("repo_created", undefined, repo.htmlUrl);

    log("seed", "committing initial content");
    for (const file of buildSeedFiles(
      { subdomain: input.subdomain, customDomain: input.customDomain, name: input.name, url: siteUrl },
      today,
    )) {
      await putFile(github, repo.fullName, file);
    }

    log("vercel", `creating project ${repoName}`);
    const env: Record<string, string> = {};
    if (process.env.SITE_CENTRAL_API) env.SITE_CENTRAL_API = process.env.SITE_CENTRAL_API;
    const project = await createProject(vercel, {
      name: repoName,
      repoFullName: repo.fullName,
      env: Object.keys(env).length > 0 ? env : undefined,
    });
    await record("project_created", project.id, repo.htmlUrl);

    log("vercel", `assigning domain ${host}`);
    await addProjectDomain(vercel, project.id, host);
    if (input.customDomain) {
      await addProjectDomain(vercel, project.id, input.customDomain);
    }
    await record("domain_assigned", project.id, repo.htmlUrl);

    log("done", `${repoName} provisioned → ${siteUrl}`);
  } catch (error) {
    log("failed", `at status=${status}: ${(error as Error).message}`);
    throw error;
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const positional = args.filter((a) => !a.startsWith("--"));
  const [subdomain, name, customDomain] = positional;

  if (!subdomain || !name) {
    console.error(
      'Usage: tsx provision-site.ts <subdomain> "<Display Name>" [customDomain] [--dry-run]',
    );
    process.exit(1);
  }

  const input: ProvisionInput = { subdomain, name, customDomain };

  if (dryRun) {
    console.log(`[provision] DRY RUN for ${subdomain}:`);
    for (const step of planProvision(input)) console.log(`  - ${step}`);
    return;
  }

  await provisionSite(input);
}

// Run only when invoked directly (not when imported by tests).
if (process.argv[1] && process.argv[1].endsWith("provision-site.ts")) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
