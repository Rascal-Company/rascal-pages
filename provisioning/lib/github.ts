/**
 * GitHub provisioning: create a customer repo from the template repo and seed
 * its initial content. Pure payload builders are unit-tested; the calls use the
 * GitHub REST API with a token.
 */

import type { SeedFile } from "./seed";

const GITHUB_API = "https://api.github.com";

export type GithubConfig = {
  token: string;
  /** Org that owns the template + customer repos, e.g. "rascal-sites". */
  owner: string;
  /** Template repo "owner/name", e.g. "rascal-company/rascal-site-template". */
  templateRepo: string;
};

/** Body for "Create a repository using a template". */
export function buildGenerateRepoPayload(input: {
  owner: string;
  name: string;
  private?: boolean;
}): Record<string, unknown> {
  return {
    owner: input.owner,
    name: input.name,
    private: input.private ?? true,
    include_all_branches: false,
  };
}

/** Body for "Create or update file contents" (content base64-encoded). */
export function buildContentsPutPayload(
  content: string,
  message: string,
): Record<string, unknown> {
  return {
    message,
    content: Buffer.from(content, "utf8").toString("base64"),
  };
}

async function githubFetch(
  config: GithubConfig,
  path: string,
  init: RequestInit,
): Promise<Response> {
  return fetch(`${GITHUB_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

export type CreatedRepo = { fullName: string; htmlUrl: string };

/** Create a new repo from the template. Returns the repo's full name + URL. */
export async function createRepoFromTemplate(
  config: GithubConfig,
  name: string,
): Promise<CreatedRepo> {
  const response = await githubFetch(
    config,
    `/repos/${config.templateRepo}/generate`,
    {
      method: "POST",
      body: JSON.stringify(
        buildGenerateRepoPayload({ owner: config.owner, name }),
      ),
    },
  );

  if (!response.ok) {
    throw new Error(
      `GitHub repo create failed: ${response.status} ${await response.text()}`,
    );
  }

  const data = (await response.json()) as {
    full_name: string;
    html_url: string;
  };
  return { fullName: data.full_name, htmlUrl: data.html_url };
}

/** Commit a single file into a repo on its default branch. */
export async function putFile(
  config: GithubConfig,
  repoFullName: string,
  file: SeedFile,
): Promise<void> {
  const response = await githubFetch(
    config,
    `/repos/${repoFullName}/contents/${file.path}`,
    {
      method: "PUT",
      body: JSON.stringify(
        buildContentsPutPayload(file.content, `seed: ${file.path}`),
      ),
    },
  );

  if (!response.ok) {
    throw new Error(
      `GitHub seed of ${file.path} failed: ${response.status} ${await response.text()}`,
    );
  }
}

/** Transfer repo ownership to a new owner (handoff — Scope 5). */
export async function transferRepo(
  config: GithubConfig,
  repoFullName: string,
  newOwner: string,
): Promise<void> {
  const response = await githubFetch(
    config,
    `/repos/${repoFullName}/transfer`,
    { method: "POST", body: JSON.stringify({ new_owner: newOwner }) },
  );

  if (!response.ok) {
    throw new Error(
      `GitHub repo transfer failed: ${response.status} ${await response.text()}`,
    );
  }
}
