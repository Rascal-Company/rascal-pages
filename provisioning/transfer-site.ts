/**
 * Hand off a customer site (Scope 5): transfer the GitHub repo to the customer.
 *
 * The Vercel project transfer is done from the Vercel dashboard (or by the
 * customer connecting their own Vercel account to the transferred repo) — see
 * HANDOFF.md. This script automates the GitHub side and prints the checklist.
 *
 * Usage:
 *   tsx transfer-site.ts <subdomain> <newOwner> [--dry-run]
 *
 * Required env (skipped in --dry-run): GITHUB_TOKEN, GITHUB_OWNER,
 * GITHUB_TEMPLATE_REPO.
 */

import { buildRepoName } from "./lib/names";
import { transferRepo, type GithubConfig } from "./lib/github";

const HANDOFF_CHECKLIST = [
  "GitHub repo transferred to the customer",
  "Vercel project moved to the customer's account (or repo reconnected)",
  "Production env vars re-created in the customer's Vercel project",
  "Custom domain re-verified under the new owner",
  "Customer confirmed they can edit content/ and push",
];

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env: ${key}`);
  return value;
}

export async function transferSite(
  subdomain: string,
  newOwner: string,
): Promise<void> {
  const github: GithubConfig = {
    token: requireEnv("GITHUB_TOKEN"),
    owner: requireEnv("GITHUB_OWNER"),
    templateRepo: requireEnv("GITHUB_TEMPLATE_REPO"),
  };

  const repoFullName = `${github.owner}/${buildRepoName(subdomain)}`;
  console.log(`[transfer] transferring ${repoFullName} → ${newOwner}`);
  await transferRepo(github, repoFullName, newOwner);

  console.log("[transfer] GitHub transfer requested. Remaining checklist:");
  for (const item of HANDOFF_CHECKLIST) console.log(`  - ${item}`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const [subdomain, newOwner] = args.filter((a) => !a.startsWith("--"));

  if (!subdomain || !newOwner) {
    console.error("Usage: tsx transfer-site.ts <subdomain> <newOwner> [--dry-run]");
    process.exit(1);
  }

  if (dryRun) {
    console.log(
      `[transfer] DRY RUN: would transfer ${buildRepoName(subdomain)} → ${newOwner}`,
    );
    for (const item of HANDOFF_CHECKLIST) console.log(`  - ${item}`);
    return;
  }

  await transferSite(subdomain, newOwner);
}

if (process.argv[1] && process.argv[1].endsWith("transfer-site.ts")) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
