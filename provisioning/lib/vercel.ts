/**
 * Vercel provisioning: create a project linked to the customer repo, assign the
 * subdomain/custom domain, and trigger deploys. Pure payload builders are
 * unit-tested; the calls use the Vercel REST API with a token.
 */

const VERCEL_API = "https://api.vercel.com";

export type VercelConfig = {
  token: string;
  /** Optional team id; appended as ?teamId= to every request when set. */
  teamId?: string;
};

/** Body for "Create a new project" linked to a GitHub repo. */
export function buildProjectPayload(input: {
  name: string;
  repoFullName: string;
  env?: Record<string, string>;
}): Record<string, unknown> {
  return {
    name: input.name,
    framework: "nextjs",
    gitRepository: { type: "github", repo: input.repoFullName },
    ...(input.env
      ? {
          environmentVariables: Object.entries(input.env).map(
            ([key, value]) => ({
              key,
              value,
              type: "plain",
              target: ["production", "preview"],
            }),
          ),
        }
      : {}),
  };
}

/** Body for "Add a domain to a project". */
export function buildDomainPayload(domain: string): Record<string, unknown> {
  return { name: domain };
}

function withTeam(config: VercelConfig, path: string): string {
  if (!config.teamId) return `${VERCEL_API}${path}`;
  const separator = path.includes("?") ? "&" : "?";
  return `${VERCEL_API}${path}${separator}teamId=${config.teamId}`;
}

async function vercelFetch(
  config: VercelConfig,
  path: string,
  init: RequestInit,
): Promise<Response> {
  return fetch(withTeam(config, path), {
    ...init,
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

export type CreatedProject = { id: string; name: string };

export async function createProject(
  config: VercelConfig,
  input: { name: string; repoFullName: string; env?: Record<string, string> },
): Promise<CreatedProject> {
  const response = await vercelFetch(config, `/v11/projects`, {
    method: "POST",
    body: JSON.stringify(buildProjectPayload(input)),
  });

  if (!response.ok) {
    throw new Error(
      `Vercel project create failed: ${response.status} ${await response.text()}`,
    );
  }

  const data = (await response.json()) as { id: string; name: string };
  return { id: data.id, name: data.name };
}

/** Assign a domain (subdomain or custom) to a project. */
export async function addProjectDomain(
  config: VercelConfig,
  projectId: string,
  domain: string,
): Promise<void> {
  const response = await vercelFetch(
    config,
    `/v10/projects/${projectId}/domains`,
    { method: "POST", body: JSON.stringify(buildDomainPayload(domain)) },
  );

  if (!response.ok) {
    throw new Error(
      `Vercel add domain failed: ${response.status} ${await response.text()}`,
    );
  }
}

export type DomainStatus = { verified: boolean; misconfigured: boolean };

/** Check verification status of a custom domain (self-serve — Scope 3). */
export async function getDomainStatus(
  config: VercelConfig,
  projectId: string,
  domain: string,
): Promise<DomainStatus> {
  const response = await vercelFetch(
    config,
    `/v9/projects/${projectId}/domains/${domain}`,
    { method: "GET" },
  );

  if (!response.ok) {
    throw new Error(
      `Vercel domain status failed: ${response.status} ${await response.text()}`,
    );
  }

  const data = (await response.json()) as {
    verified: boolean;
    misconfigured?: boolean;
  };
  return { verified: data.verified, misconfigured: data.misconfigured ?? false };
}
