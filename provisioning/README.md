# Provisioning (control plane)

Scripts that create and hand off **repo-per-site** customer sites. Each site is a
standalone repo (from `site-template`) deployed as its own Vercel project and
recorded in the Supabase `sites` registry.

> Pure builders (`lib/*.ts`) are unit-tested. The API wrappers call GitHub,
> Vercel and Supabase and need tokens — nothing runs without them.

## Setup

```bash
cd provisioning
npm install
```

Env (a `.env` is fine with a loader, or export inline):

| Var | Purpose |
|-----|---------|
| `GITHUB_TOKEN` | PAT with repo-create on the sites org |
| `GITHUB_OWNER` | Org that owns customer repos, e.g. `rascal-sites` |
| `GITHUB_TEMPLATE_REPO` | `owner/name` of the template, e.g. `rascal-company/rascal-site-template` |
| `VERCEL_TOKEN` | Vercel API token |
| `VERCEL_TEAM_ID` | (optional) Vercel team id |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (registry upsert) |
| `ROOT_DOMAIN` | (optional) defaults to `rascalpages.fi` |
| `SITE_CENTRAL_API` | (optional) central lead/analytics endpoint, injected as a project env var |

Apply the registry migration first: `supabase-migration-site-registry.sql`.

## Usage

```bash
# Preview the steps without touching anything
npm run provision -- samikiias "Sami Kiias" samikiias.fi --dry-run

# Provision for real
npm run provision -- samikiias "Sami Kiias" samikiias.fi

# Hand a site off to a customer (Scope 5)
npm run transfer -- samikiias customer-github-login --dry-run
```

## What `provision-site` does

1. `createRepoFromTemplate` — new repo `rascal-site-<subdomain>` from the template
2. `putFile` × seed — `content/site.json` + `content/posts/tervetuloa.md`
3. `createProject` — Vercel project linked to the repo (first deploy triggered by the link)
4. `addProjectDomain` — `<subdomain>.rascalpages.fi` (+ optional custom domain)
5. `upsertSiteRegistry` — record repo/project/status in `sites`

Domain setup (wildcard DNS, custom domain verification) is documented in
`DOMAINS.md`. Handoff is documented in `HANDOFF.md`.

## Tests

```bash
npm run test       # vitest (pure builders)
npm run typecheck  # tsc --noEmit
```
